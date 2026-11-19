import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

/**
 * Support replies in the docs assistant (SU-1083). The polling rules live in
 * DocsAssistant/agentReplies.ts, which has no imports, and the thread state in the reducer of
 * DocsAssistant/useAssistant.ts. Both are transpiled and loaded here without a browser or React.
 */

const read = (relative) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const transpile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;

const load = (code) =>
  import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`);

const agent = await load(transpile(read('../DocsAssistant/agentReplies.ts')));

// useAssistant.ts imports React, ./agentReplies and ./constants. A data: URL module cannot resolve
// those specifiers, so each static import is swapped for a global, as in the markdown boundary test.
globalThis.__hotAgent = agent;
const shimmed = transpile(read('../DocsAssistant/useAssistant.ts'))
  .replace(
    /^import \{[^}]*\} from ["']react["'];$/m,
    'const { useCallback, useEffect, useReducer, useRef, useState } = {};'
  )
  .replace(/^import \{[^}]*\} from ["']\.\/agentReplies["'];$/m, 'const {\n  createAgentPoller,\n  mergeReplies,\n  messagesForApi,\n  newestReplyId,\n  nextPollState,\n  outgoingMessage,\n  parsePollState,\n  stripSupportPrefix,\n  toSupportApiText,\n} = globalThis.__hotAgent;')
  .replace(
    /^import \{[^}]*\} from ["']\.\/constants["'];$/m,
    'const AGENT_REPLIES_ENDPOINT = "", CHAT_ENDPOINT = "", FEEDBACK_ENDPOINT = "", STORAGE_KEYS = {};'
  );

assert.doesNotMatch(shimmed, /^import [^(]/m, 'Expected every static import to be shimmed');

const { reducer } = await load(shimmed);

const {
  AGENT_POLL,
  SUPPORT_REPLY_PREFIX,
  createAgentPoller,
  isFatalPollStatus,
  mergeReplies,
  messagesForApi,
  newestReplyId,
  nextPollState,
  outgoingMessage,
  parsePollState,
  parseReplies,
  pollDelayMs,
  retryDelayMs,
  retryableAssistantId,
  stripSupportPrefix,
  toSupportApiText,
} = agent;

const msg = (id, role, content = id) => ({ id, role, content, ts: 1 });
const initial = (messages) => ({ messages, streaming: false, error: null });
const roles = (state) => state.messages.map((m) => `${m.role}:${m.id}`);

test('polls no faster than every 8 seconds, slows down when quiet and stops when idle', () => {
  assert.equal(AGENT_POLL.activeMs, 8000);
  assert.equal(pollDelayMs(0), 8000);
  assert.equal(pollDelayMs(AGENT_POLL.quietAfterMs - 1), 8000);
  assert.equal(pollDelayMs(AGENT_POLL.quietAfterMs), 30000);
  assert.equal(pollDelayMs(AGENT_POLL.stopAfterMs - 1), 30000);
  assert.equal(pollDelayMs(AGENT_POLL.stopAfterMs), null);
});

test('honors Retry-After but never polls faster than normal or waits past the cap', () => {
  assert.equal(retryDelayMs('45'), 45000);
  assert.equal(retryDelayMs('1'), 8000, 'not faster than the normal pace');
  assert.equal(retryDelayMs('99999'), AGENT_POLL.maxRetryAfterMs);
  for (const bad of [null, undefined, '', 'abc', '0', '-5']) {
    assert.equal(retryDelayMs(bad), 30000, `bad Retry-After ${String(bad)}`);
  }
});

test('reads only well-formed replies from a response', () => {
  assert.deepEqual(parseReplies(null), []);
  assert.deepEqual(parseReplies({}), []);
  assert.deepEqual(parseReplies({ messages: 'x' }), []);
  assert.deepEqual(
    parseReplies({
      messages: [
        { id: '1793195390.895089', text: 'Hi' },
        { id: 5, text: 'number id' },
        { id: '2', text: '   ' },
        { id: '', text: 'no id' },
        { text: 'missing id' },
        null,
        'str',
      ],
    }),
    [{ id: '1793195390.895089', text: 'Hi' }]
  );
});

test('the cursor is the newest reply and moves only forward', () => {
  assert.equal(newestReplyId([]), null);
  assert.equal(
    newestReplyId([
      { id: '1793195390.895089', text: 'a' },
      { id: '1793195400.000100', text: 'b' },
      { id: '1793195395.000001', text: 'c' },
    ]),
    '1793195400.000100'
  );
});

test('a reply that arrives twice is shown once, and replies keep their order', () => {
  const make = (id, content, ts) => ({ id, role: 'agent', content, ts });
  const base = [msg('u1', 'user'), msg('a1', 'assistant')];
  const once = mergeReplies(
    base,
    [
      { id: '1793195400.000100', text: 'second' },
      { id: '1793195390.895089', text: 'first' },
    ],
    5,
    make
  );
  assert.deepEqual(
    once.map((m) => m.content),
    ['u1', 'a1', 'first', 'second']
  );
  const twice = mergeReplies(once, [{ id: '1793195390.895089', text: 'first' }], 6, make);
  assert.equal(twice, once, 'nothing new returns the same array');
});

test('a Support reply never goes back to the model', () => {
  const history = [
    msg('u1', 'user', 'question'),
    msg('a1', 'assistant', 'answer'),
    msg('s1', 'agent', 'Hi, this is Support'),
    msg('u2', 'user', 'thanks'),
  ];
  assert.deepEqual(messagesForApi(history), [
    { role: 'user', content: 'question' },
    { role: 'assistant', content: 'answer' },
    { role: 'user', content: 'thanks' },
  ]);
});

test('the poll state follows the thread, and a turn without a token keeps a working state', () => {
  const previous = { threadId: 't1', token: 'k1', after: '17.1' };
  assert.deepEqual(nextPollState(previous, 't1', 'k1'), previous, 'same thread keeps the cursor');
  assert.deepEqual(nextPollState(previous, 't2', 'k2'), { threadId: 't2', token: 'k2', after: null });
  assert.equal(nextPollState(previous, null, 'k1'), null, 'no thread, nothing to poll');
  assert.equal(nextPollState(null, 't1', null), null, 'no token and nothing saved, nothing to poll');
  assert.equal(nextPollState(previous, 't2', null), null, 'a new thread without a token cannot be polled');
  // A turn that lacks the token must not switch Support replies off for the same conversation.
  assert.equal(nextPollState(previous, 't1', null), previous);
  assert.equal(nextPollState(null, 't1', 'k1').after, null);
});

test('saved poll state is read back, and anything malformed is ignored', () => {
  assert.deepEqual(parsePollState(JSON.stringify({ threadId: 't', token: 'k', after: '1.2' })), {
    threadId: 't',
    token: 'k',
    after: '1.2',
  });
  assert.equal(parsePollState(JSON.stringify({ threadId: 't', token: 'k' })).after, null);
  for (const bad of [null, '', '{', 'null', '[]', JSON.stringify({ threadId: 't' }), JSON.stringify({ threadId: '', token: 'k' })]) {
    assert.equal(parsePollState(bad), null, `bad state ${String(bad)}`);
  }
});

test('stops polling after a status that cannot succeed, but not after a rate limit or an outage', () => {
  for (const status of [400, 403, 404, 503]) assert.equal(isFatalPollStatus(status), true, String(status));
  for (const status of [200, 429, 500, 502]) assert.equal(isFatalPollStatus(status), false, String(status));
});

test('thread state: a Support reply is added once and the bot answer is untouched', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant')]);
  const replies = [{ id: '1793195390.895089', text: 'Hi' }];
  const after = reducer(state, { type: 'ADD_AGENT', replies, now: 9 });
  assert.deepEqual(roles(after), ['user:u1', 'assistant:a1', 'agent:agent-1793195390.895089']);
  assert.equal(after.messages[2].content, 'Hi');
  assert.equal(reducer(after, { type: 'ADD_AGENT', replies, now: 10 }).messages, after.messages);
});

test('thread state: a failed turn still drops the empty bot placeholder when a Support reply landed after it', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant', ''), msg('s1', 'agent', 'Hi')]);
  const failed = reducer({ ...state, streaming: true }, { type: 'ERROR', error: 'boom' });
  assert.deepEqual(roles(failed), ['user:u1', 'agent:s1']);
  assert.equal(failed.error, 'boom');

  // A bot answer that has content is kept.
  const kept = reducer(
    initial([msg('u1', 'user'), msg('a1', 'assistant', 'partial'), msg('s1', 'agent')]),
    { type: 'ERROR', error: 'boom' }
  );
  assert.deepEqual(roles(kept), ['user:u1', 'assistant:a1', 'agent:s1']);
});

test('thread state: retry removes the bot answers to the last question and keeps Support replies', () => {
  const state = initial([
    msg('u1', 'user'),
    msg('a1', 'assistant'),
    msg('u2', 'user'),
    msg('a2', 'assistant'),
    msg('s1', 'agent'),
    msg('a3', 'assistant'),
  ]);
  assert.deepEqual(roles(reducer(state, { type: 'RETRY_POP' })), [
    'user:u1',
    'assistant:a1',
    'user:u2',
    'agent:s1',
  ]);
  // Without a Support reply it behaves as before: trailing bot answers go.
  assert.deepEqual(
    roles(reducer(initial([msg('u1', 'user'), msg('a1', 'assistant')]), { type: 'RETRY_POP' })),
    ['user:u1']
  );
});

// ── Writing to Support instead of the bot (SU-1118) ──────────────────────────────────────────────

const toSupport = (id, content = id) => ({ ...msg(id, 'user', content), toSupport: true });

test('write to Support: the request carries the marker', () => {
  assert.equal(SUPPORT_REPLY_PREFIX, '!reply');
  assert.equal(toSupportApiText('Thanks, can we talk tomorrow?'), '!reply Thanks, can we talk tomorrow?');
});

test('write to Support: a typed marker is read the way the backend reads it', () => {
  assert.equal(stripSupportPrefix('!reply Thanks'), 'Thanks');
  assert.equal(stripSupportPrefix('  !REPLY: Thanks'), 'Thanks');
  assert.equal(stripSupportPrefix('!reply, Thanks'), 'Thanks');
  assert.equal(stripSupportPrefix('!reply'), '', 'a bare marker is a message with no text');
  // Must not over-trigger: anything else is a normal question for the bot.
  for (const text of ['!replying now', 'hello !reply', 'How do I freeze columns?', '!user hi', '']) {
    assert.equal(stripSupportPrefix(text), null, text);
  }
});

test('write to Support: a message to Support never goes back to the model', () => {
  const history = [
    msg('u1', 'user', 'question'),
    msg('a1', 'assistant', 'answer'),
    msg('s1', 'agent', 'Hi, this is Support'),
    toSupport('u2', 'Thanks, call me'),
    msg('u3', 'user', 'another question'),
  ];
  assert.deepEqual(messagesForApi(history), [
    { role: 'user', content: 'question' },
    { role: 'assistant', content: 'answer' },
    { role: 'user', content: 'another question' },
  ]);
});

test('thread state: sending to Support adds no bot placeholder, so the feedback numbering holds', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant', 'answer'), msg('s1', 'agent'), toSupport('u2')]);
  const sending = reducer({ ...state, error: 'old' }, { type: 'BEGIN_SUPPORT_SEND' });
  assert.equal(sending.streaming, true);
  assert.equal(sending.error, null);
  assert.deepEqual(roles(sending), roles(state), 'no message was added');
  assert.equal(sending.messages.filter((m) => m.role === 'assistant').length, 1);
  // A normal turn still adds its placeholder.
  const asked = reducer(initial([msg('u1', 'user')]), { type: 'BEGIN_ASSISTANT', message: msg('a1', 'assistant', '') });
  assert.deepEqual(roles(asked), ['user:u1', 'assistant:a1']);
});

test('thread state: a failed message to Support keeps the message and does not touch the bot answers', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant', ''), toSupport('u2')]);
  const failed = reducer(reducer(state, { type: 'BEGIN_SUPPORT_SEND' }), { type: 'ERROR', error: 'boom' });
  assert.deepEqual(roles(failed), ['user:u1', 'assistant:a1', 'user:u2']);
  assert.equal(failed.error, 'boom');
  assert.equal(failed.streaming, false);
  assert.equal(failed.messages[2].toSupport, true);
});

test('thread state: retrying a message to Support removes no earlier bot answer', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant'), toSupport('u2')]);
  assert.deepEqual(roles(reducer(state, { type: 'RETRY_POP' })), ['user:u1', 'assistant:a1', 'user:u2']);
});

test('write to Support: one rule says what a message sends, so the form and the hook agree', () => {
  const live = { canWriteToSupport: true };
  // The chip is on: the marker is dropped, and a bare marker is no message.
  assert.deepEqual(outgoingMessage('Thanks', { ...live, toSupport: true }), { toSupport: true, body: 'Thanks' });
  assert.deepEqual(outgoingMessage('!reply Thanks', { ...live, toSupport: true }), { toSupport: true, body: 'Thanks' });
  assert.equal(outgoingMessage('!reply', { ...live, toSupport: true }), null);
  assert.equal(outgoingMessage('   ', { ...live, toSupport: true }), null);
  // The chip is off, with a live Support thread: a typed marker writes to Support.
  assert.deepEqual(outgoingMessage('!reply Thanks', { ...live, toSupport: false }), { toSupport: true, body: 'Thanks' });
  assert.equal(outgoingMessage('!reply', { ...live, toSupport: false }), null, 'a bare marker sends nothing');
  assert.deepEqual(outgoingMessage('How do I freeze columns?', { ...live, toSupport: false }), {
    toSupport: false,
    body: 'How do I freeze columns?',
  });
  // No live Support thread: the marker is not special, and the chip cannot send.
  assert.deepEqual(outgoingMessage('!reply', { canWriteToSupport: false, toSupport: false }), {
    toSupport: false,
    body: '!reply',
  });
  assert.equal(outgoingMessage('Thanks', { canWriteToSupport: false, toSupport: true }), null);
});

test('write to Support: only the last bot answer can be retried, and only while no later message of the reader follows it', () => {
  const asked = [msg('u1', 'user'), msg('a1', 'assistant', 'answer')];
  assert.equal(retryableAssistantId(asked), 'a1');
  // A Support reply is not a reader message: Retry still redoes the question.
  assert.equal(retryableAssistantId([...asked, msg('s1', 'agent')]), 'a1');
  // The reader wrote to Support after the answer: Retry would resend that message to Support.
  assert.equal(retryableAssistantId([...asked, msg('s1', 'agent'), toSupport('u2')]), undefined);
  // A new question has its own answer, which can be retried again.
  assert.equal(retryableAssistantId([...asked, toSupport('u2'), msg('u3', 'user'), msg('a3', 'assistant')]), 'a3');
  assert.equal(retryableAssistantId([msg('u1', 'user')]), undefined);
});

test('thread state: a message to Support counts as sent only after Support took it', () => {
  const state = initial([msg('u1', 'user'), msg('a1', 'assistant'), toSupport('u2')]);
  const sending = reducer(state, { type: 'BEGIN_SUPPORT_SEND' });
  assert.equal(sending.messages[2].supportSent, undefined, 'not while it is in flight');
  assert.equal(reducer(sending, { type: 'END' }).messages[2].supportSent, undefined, 'a stopped request is not a sent one');
  assert.equal(reducer(sending, { type: 'ERROR', error: 'boom' }).messages[2].supportSent, undefined);

  const sent = reducer(sending, { type: 'SUPPORT_SENT', id: 'u2' });
  assert.equal(sent.messages[2].supportSent, true);
  assert.equal(sent.messages[2].toSupport, true, 'the message stays a Support message for retry and for the model history');
  assert.equal(sent.messages[0].supportSent, undefined);
});

// ── The polling loop, with a fake clock and a fake network ───────────────────────────────────────

const flush = async () => {
  for (let i = 0; i < 25; i += 1) await Promise.resolve();
};

const reply = (status, body = { messages: [] }, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => headers[name] ?? null },
  json: async () => body,
});

/** A poller wired to a fake clock (the test's `t.mock.timers`) and a scripted network. */
function setupPoller(t, { poll = { threadId: 't1', token: 'k1', after: null }, visible = true } = {}) {
  // A test may build several pollers; each starts from a fresh clock.
  t.mock.timers.reset();
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1_000_000 });
  const env = { poll, visible, last: 0, calls: [], stops: 0, shown: [], script: [], pending: null };
  const poller = createAgentPoller({
    endpoint: '/api/agent-replies',
    getPoll: () => env.poll,
    getLastActivity: () => env.last,
    setLastActivity: (ms) => {
      env.last = ms;
    },
    isVisible: () => env.visible,
    now: () => Date.now(),
    fetch: (url, init) => {
      env.calls.push({ url, body: JSON.parse(init.body), at: Date.now(), signal: init.signal });
      if (env.pending) return env.pending.promise;
      return Promise.resolve(env.script.shift() ?? reply(200));
    },
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: (id) => clearTimeout(id),
    onReplies: (replies, p) => {
      env.shown.push(replies);
      env.poll = { ...p, after: replies[replies.length - 1].id };
      return true;
    },
    onStop: () => {
      env.stops += 1;
    },
  });
  /** Moves the clock in 1-second steps, letting each poll settle before the next timer is set. */
  const advance = async (ms) => {
    for (let spent = 0; spent < ms; spent += 1000) {
      t.mock.timers.tick(Math.min(1000, ms - spent));
      await flush();
    }
  };
  /** Holds the next fetch open until `resolve` is called, to test a poll that is still in flight. */
  const hold = () => {
    let resolve;
    const promise = new Promise((r) => {
      resolve = r;
    });
    env.pending = { promise, resolve };
    return (response) => {
      env.pending = null;
      resolve(response);
    };
  };
  return { env, poller, advance, hold };
}

const gaps = (calls) => calls.slice(1).map((c, i) => c.at - calls[i].at);

test('poller: polls at once, then no faster than every 8 seconds, with the token and the cursor', async (t) => {
  const { env, poller, advance } = setupPoller(t);
  env.script.push(reply(200, { messages: [{ id: '17.1', text: 'Hi' }] }));
  poller.start();
  await advance(1000);
  assert.equal(env.calls.length, 1);
  assert.deepEqual(env.calls[0].body, { threadId: 't1', token: 'k1' });
  assert.deepEqual(env.shown, [[{ id: '17.1', text: 'Hi' }]]);

  await advance(60_000);
  assert.ok(env.calls.length >= 7 && env.calls.length <= 9, `calls in a minute: ${env.calls.length}`);
  assert.ok(gaps(env.calls).every((g) => g >= 8000), `gaps ${gaps(env.calls)}`);
  assert.equal(env.calls[1].body.after, '17.1', 'the next poll sends the cursor');
  poller.stop();
});

test('poller: switching tabs while a poll is in flight does not start a second loop', async (t) => {
  const { env, poller, advance, hold } = setupPoller(t);
  const release = hold();
  poller.start();
  await advance(1000);
  assert.equal(env.calls.length, 1, 'the first poll is in flight');

  // The reader leaves and comes back, three times, before the poll finishes.
  for (let i = 0; i < 3; i += 1) {
    poller.wake();
    await advance(1000);
  }
  assert.equal(env.calls.length, 1, 'no second request while one is in flight');

  release(reply(200));
  await flush();
  await advance(120_000);
  assert.ok(gaps(env.calls).every((g) => g >= 8000), `a single loop: gaps ${gaps(env.calls)}`);
  assert.ok(env.calls.length <= 16, `calls in two minutes: ${env.calls.length}`);
  poller.stop();
});

test('poller: waking the tab when no poll is in flight polls right away and never doubles the timer', async (t) => {
  const { env, poller, advance } = setupPoller(t, { visible: false });
  poller.start();
  await advance(60_000);
  assert.equal(env.calls.length, 0, 'a hidden tab is not polled');

  env.visible = true;
  poller.wake();
  poller.wake();
  await advance(1000);
  assert.equal(env.calls.length, 1, 'two wakes in a row make one poll');
  await advance(60_000);
  assert.ok(gaps(env.calls).every((g) => g >= 8000), `gaps ${gaps(env.calls)}`);
  poller.stop();
});

test('poller: honors Retry-After on a 429 and slows down on a server error', async (t) => {
  const { env, poller, advance } = setupPoller(t);
  env.script.push(reply(429, {}, { 'Retry-After': '45' }), reply(502), reply(200));
  poller.start();
  await advance(120_000);
  assert.equal(gaps(env.calls)[0], 45_000, 'waits as long as the backend says');
  assert.equal(gaps(env.calls)[1], AGENT_POLL.quietMs, 'a 502 waits the quiet interval');
  assert.equal(env.stops, 0, 'neither stops the loop');
  poller.stop();
});

test('poller: stops for good on a status that cannot succeed', async (t) => {
  for (const status of [400, 403, 404, 503]) {
    const { env, poller, advance } = setupPoller(t);
    env.script.push(reply(status));
    poller.start();
    await advance(10 * 60_000);
    assert.equal(env.calls.length, 1, `status ${status}: no second poll`);
    assert.equal(env.stops, 1, `status ${status}: told the panel to stop`);
    poller.stop();
  }
});

test('poller: stops when the backend says the conversation is too old', async (t) => {
  const { env, poller, advance } = setupPoller(t);
  env.script.push(reply(200, { messages: [], stale: true }));
  poller.start();
  await advance(5 * 60_000);
  assert.equal(env.calls.length, 1);
  assert.equal(env.stops, 1);
  poller.stop();
});

test('poller: slows down after 5 quiet minutes, sleeps after 30, and wakes on activity', async (t) => {
  const { env, poller, advance } = setupPoller(t);
  poller.start();
  await advance(AGENT_POLL.quietAfterMs + 120_000);
  const late = gaps(env.calls).slice(-3);
  assert.ok(late.every((g) => g === AGENT_POLL.quietMs), `quiet pace: ${late}`);

  await advance(AGENT_POLL.stopAfterMs);
  const total = env.calls.length;
  await advance(10 * 60_000);
  assert.equal(env.calls.length, total, 'no polling after 30 idle minutes');
  assert.equal(env.stops, 0, 'sleeping is not stopping');

  poller.wake();
  await advance(1000);
  assert.equal(env.calls.length, total + 1, 'coming back to the tab polls again');
  poller.stop();
});

test('poller: does nothing without a poll state, and nothing after stop', async (t) => {
  const none = setupPoller(t, { poll: null });
  none.poller.start();
  await none.advance(60_000);
  assert.equal(none.env.calls.length, 0);
  none.poller.stop();

  const { env, poller, advance, hold } = setupPoller(t);
  const release = hold();
  poller.start();
  await advance(1000);
  poller.stop();
  assert.equal(env.calls[0].signal.aborted, true, 'the request in flight is aborted');
  release(reply(200, { messages: [{ id: '9.9', text: 'late' }] }));
  await flush();
  await advance(60_000);
  assert.equal(env.shown.length, 0, 'a reply that arrives after stop is not shown');
  assert.equal(env.calls.length, 1, 'and nothing polls again');
});
