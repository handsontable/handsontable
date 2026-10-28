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
  .replace(/^import \{[^}]*\} from ["']\.\/agentReplies["'];$/m, 'const {\n  AGENT_POLL,\n  isFatalPollStatus,\n  mergeReplies,\n  messagesForApi,\n  newestReplyId,\n  nextPollState,\n  parsePollState,\n  parseReplies,\n  pollDelayMs,\n  retryDelayMs,\n} = globalThis.__hotAgent;')
  .replace(
    /^import \{[^}]*\} from ["']\.\/constants["'];$/m,
    'const AGENT_REPLIES_ENDPOINT = "", CHAT_ENDPOINT = "", FEEDBACK_ENDPOINT = "", STORAGE_KEYS = {};'
  );

assert.doesNotMatch(shimmed, /^import [^(]/m, 'Expected every static import to be shimmed');

const { reducer } = await load(shimmed);

const {
  AGENT_POLL,
  isFatalPollStatus,
  mergeReplies,
  messagesForApi,
  newestReplyId,
  nextPollState,
  parsePollState,
  parseReplies,
  pollDelayMs,
  retryDelayMs,
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

test('the poll state follows the thread and is off when the backend sends no token', () => {
  const previous = { threadId: 't1', token: 'k1', after: '17.1' };
  assert.deepEqual(nextPollState(previous, 't1', 'k1'), previous, 'same thread keeps the cursor');
  assert.deepEqual(nextPollState(previous, 't2', 'k2'), { threadId: 't2', token: 'k2', after: null });
  assert.equal(nextPollState(previous, 't1', null), null, 'no token, nothing to poll');
  assert.equal(nextPollState(previous, null, 'k1'), null, 'no thread, nothing to poll');
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
