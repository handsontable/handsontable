import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  type AgentPollState,
  type AgentReply,
  createAgentPoller,
  mergeReplies,
  messagesForApi,
  newestReplyId,
  nextPollState,
  parsePollState,
} from './agentReplies';
import { AGENT_REPLIES_ENDPOINT, CHAT_ENDPOINT, FEEDBACK_ENDPOINT, STORAGE_KEYS } from './constants';

export interface ChatMessage {
  id: string;
  /** `agent` is a reply a teammate wrote from Slack. It is never sent to the model and never rated. */
  role: 'user' | 'assistant' | 'agent';
  content: string;
  ts: number;
  feedback?: 'up' | 'down';
  error?: string;
}

interface ThreadState {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
}

type Action =
  | { type: 'ADD_USER'; message: ChatMessage }
  | { type: 'ADD_AGENT'; replies: AgentReply[]; now: number }
  | { type: 'BEGIN_ASSISTANT'; message: ChatMessage }
  | { type: 'APPEND'; id: string; delta: string }
  | { type: 'END' }
  | { type: 'ERROR'; error: string }
  | { type: 'CLEAR' }
  | { type: 'RETRY_POP' }
  | { type: 'SET_FEEDBACK'; id: string; feedback: 'up' | 'down' }
  | { type: 'HYDRATE'; messages: ChatMessage[] };

// Exported for the node test of the thread state (`__tests__/docs-assistant-agent-replies.test.mjs`).
export function reducer(state: ThreadState, action: Action): ThreadState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, messages: action.messages };
    case 'ADD_USER':
      return { ...state, messages: [...state.messages, action.message], error: null };
    case 'ADD_AGENT':
      return {
        ...state,
        messages: mergeReplies<ChatMessage>(state.messages, action.replies, action.now, (id, content, ts) => ({
          id,
          role: 'agent',
          content,
          ts,
        })),
      };
    case 'BEGIN_ASSISTANT':
      return { ...state, messages: [...state.messages, action.message], streaming: true, error: null };
    case 'APPEND':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.delta } : m
        ),
      };
    case 'END':
      return { ...state, streaming: false };
    case 'ERROR': {
      // Drop the trailing empty assistant placeholder if it has no content.
      // A Support reply can land after the placeholder, so look past those.
      const messages = [...state.messages];
      let i = messages.length - 1;
      while (i >= 0 && messages[i].role === 'agent') i -= 1;
      if (i >= 0 && messages[i].role === 'assistant' && !messages[i].content) messages.splice(i, 1);
      return { ...state, streaming: false, error: action.error, messages };
    }
    case 'CLEAR':
      return { messages: [], streaming: false, error: null };
    case 'RETRY_POP': {
      // Drop the bot's answers to the last question; a Support reply stays.
      const lastUser = state.messages.map((m) => m.role).lastIndexOf('user');
      const messages = state.messages.filter((m, i) => !(i > lastUser && m.role === 'assistant'));
      return { ...state, messages, error: null };
    }
    case 'SET_FEEDBACK':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, feedback: action.feedback } : m
        ),
      };
    default:
      return state;
  }
}

function loadThread(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.thread);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistThread(messages: ChatMessage[]) {
  try {
    if (messages.length === 0) localStorage.removeItem(STORAGE_KEYS.thread);
    else localStorage.setItem(STORAGE_KEYS.thread, JSON.stringify(messages));
  } catch {
    // Quota or privacy-mode — drop silently.
  }
}

function readThreadId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.threadId);
  } catch {
    return null;
  }
}

function writeThreadId(ts: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.threadId, ts);
  } catch {
    // Quota or privacy-mode — drop silently.
  }
}

function clearThreadIdStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.threadId);
  } catch {
    // Quota or privacy-mode — drop silently.
  }
}

function readStoredPoll(): AgentPollState | null {
  try {
    return parsePollState(localStorage.getItem(STORAGE_KEYS.agentReplies));
  } catch {
    return null;
  }
}

function writeStoredPoll(poll: AgentPollState | null) {
  try {
    if (poll) localStorage.setItem(STORAGE_KEYS.agentReplies, JSON.stringify(poll));
    else localStorage.removeItem(STORAGE_KEYS.agentReplies);
  } catch {
    // Quota or privacy-mode — drop silently.
  }
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function* readSSE(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal
): AsyncGenerator<{
  type: string;
  delta?: { content?: string };
  thread_id?: string;
  agent_token?: string;
}> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      if (signal.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      // Events separated by blank line.
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const json = trimmed.slice(5).trim();
          if (!json || json === '[DONE]') continue;
          try {
            yield JSON.parse(json);
          } catch {
            // Ignore malformed event — keep the stream alive.
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * `active` is true while the panel is open: only then does the hook poll for a Support reply, so a
 * closed panel costs the backend nothing.
 */
export function useAssistant({ active = false }: { active?: boolean } = {}) {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    streaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);
  // Conversation thread id returned by the backend. Persisted in localStorage
  // under STORAGE_KEYS.threadId so the id survives page reloads and cross-page
  // navigation, matching the lifecycle of the visible conversation. Reset in
  // `clear` / `clearAndSend`.
  const threadIdRef = useRef<string | null>(readThreadId());
  // Support replies (SU-1083). The poll state lives in a ref (the cursor moves on every reply and must
  // not re-render), while its thread id is mirrored in state so the polling effect restarts when the
  // conversation changes. Saved state counts only while it still matches the saved thread id.
  const pollRef = useRef<AgentPollState | null>(
    (() => {
      const stored = readStoredPoll();
      return stored && stored.threadId === threadIdRef.current ? stored : null;
    })()
  );
  const [pollThreadId, setPollThreadId] = useState<string | null>(() => pollRef.current?.threadId ?? null);
  const lastActivityRef = useRef(Date.now());

  const applyPollState = useCallback((next: AgentPollState | null) => {
    pollRef.current = next;
    writeStoredPoll(next);
    setPollThreadId(next ? next.threadId : null);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const loaded = loadThread();
    if (loaded.length) dispatch({ type: 'HYDRATE', messages: loaded });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    persistThread(state.messages);
  }, [state.messages]);

  // Mirror of state.messages so setFeedback can read the current value without
  // listing it in deps. Including it would re-create the callback on every
  // streaming chunk and force every <Message> to re-render its action bar.
  const messagesRef = useRef(state.messages);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'END' });
  }, []);

  const sendInternal = useCallback(
    async (userMessageText: string, historyForApi: ChatMessage[]) => {
      const controller = new AbortController();
      abortRef.current = controller;

      // The question goes as typed. The backend reads the page the reader is
      // on from pageTitle/pageUrl below and fetches its Markdown itself, so
      // the request stays small: inlining the page's Markdown made turns on
      // the largest API pages (Options, Core) exceed the same-origin proxy's
      // body-size cap and fail with a 413.
      const apiMessages = [
        ...messagesForApi(historyForApi),
        { role: 'user' as const, content: userMessageText },
      ];

      const assistantId = uid();
      dispatch({
        type: 'BEGIN_ASSISTANT',
        message: { id: assistantId, role: 'assistant', content: '', ts: Date.now() },
      });

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (threadIdRef.current) {
          headers['X-Thread-Id'] = threadIdRef.current;
        }

        const res = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: apiMessages,
            pageTitle: document.title,
            pageUrl: window.location.href,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText || 'Request failed'}`);
        }
        if (!res.body) throw new Error('No response body');

        // Adopt the conversation id returned by the backend so it can
        // correlate subsequent turns. The id arrives twice: as `thread_id` on
        // the SSE `message_start` frame (primary — some client environments,
        // e.g. corporate TLS-inspection proxies, strip custom response
        // headers, but anything that delivers the stream delivers the frame)
        // and as the `X-Thread-Id` response header (fallback). The server
        // returns the RESOLVED id every turn — a fresh one when it discarded
        // a stale echoed id — so always adopt it rather than keeping what we
        // hold. Skip adoption once this request has been aborted or replaced
        // (stop / clear / clearAndSend), so a late frame can't resurrect an
        // id the user just cleared.
        const adoptThreadId = (id: string | null | undefined) => {
          if (!id || controller.signal.aborted) return;
          if (threadIdRef.current === id) return;
          threadIdRef.current = id;
          writeThreadId(id);
        };
        adoptThreadId(res.headers.get('X-Thread-Id'));
        // The token that lets the panel poll for Support replies. The first frame carries it too, and
        // the same-origin proxy does not pass the header, so the frame is the one that counts.
        const adoptAgentToken = (token: string | null | undefined) => {
          if (controller.signal.aborted) return;
          applyPollState(nextPollState(pollRef.current, threadIdRef.current, token ?? null));
        };
        const headerToken = res.headers.get('X-Thread-Token');
        if (headerToken) adoptAgentToken(headerToken);

        for await (const event of readSSE(res.body, controller.signal)) {
          if (event.type === 'message_start') {
            adoptThreadId(event.thread_id);
            adoptAgentToken(event.agent_token);
          } else if (event.type === 'content_chunk') {
            const delta = event.delta?.content ?? '';
            if (delta) dispatch({ type: 'APPEND', id: assistantId, delta });
          } else if (event.type === 'message_end') {
            break;
          }
        }
        dispatch({ type: 'END' });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Only dispatch END if no newer request has replaced this controller.
          // clearAndSend sets abortRef.current to null/new before aborting the
          // old one, so this guard prevents the old abort from killing the new
          // request's streaming state.
          if (abortRef.current === controller) {
            dispatch({ type: 'END' });
          }
          return;
        }
        dispatch({ type: 'ERROR', error: (err as Error).message || 'Request failed' });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [applyPollState]
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || state.streaming) return;
      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      };
      const history = state.messages;
      lastActivityRef.current = Date.now();
      dispatch({ type: 'ADD_USER', message: userMessage });
      await sendInternal(trimmed, history);
    },
    [sendInternal, state.messages, state.streaming]
  );

  const retry = useCallback(async () => {
    if (state.streaming) return;
    const lastUserIndex = state.messages.map((m) => m.role).lastIndexOf('user');
    if (lastUserIndex < 0) return;
    const lastUser = state.messages[lastUserIndex];
    lastActivityRef.current = Date.now();
    dispatch({ type: 'RETRY_POP' });
    const history = state.messages.slice(0, lastUserIndex);
    await sendInternal(lastUser.content, history);
  }, [sendInternal, state.messages, state.streaming]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    threadIdRef.current = null;
    clearThreadIdStorage();
    applyPollState(null);
    dispatch({ type: 'CLEAR' });
  }, [applyPollState]);

  const clearAndSend = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      abortRef.current = null;
      threadIdRef.current = null;
      clearThreadIdStorage();
      applyPollState(null);
      lastActivityRef.current = Date.now();
      dispatch({ type: 'CLEAR' });
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        ts: Date.now(),
      };
      dispatch({ type: 'ADD_USER', message: userMessage });
      await sendInternal(trimmed, []);
    },
    [applyPollState, sendInternal]
  );

  // Polls for a reply a teammate wrote in the conversation's Slack thread. Runs only while the panel is
  // open and the tab is visible; opening the panel or coming back to the tab counts as activity and polls
  // at once. The loop itself is createAgentPoller (see AGENT_POLL for the pace).
  useEffect(() => {
    if (!active || !pollThreadId) return undefined;
    const poller = createAgentPoller({
      endpoint: AGENT_REPLIES_ENDPOINT,
      getPoll: () => pollRef.current,
      getLastActivity: () => lastActivityRef.current,
      setLastActivity: (ms) => {
        lastActivityRef.current = ms;
      },
      isVisible: () => document.visibilityState === 'visible',
      now: () => Date.now(),
      fetch: (url, init) => window.fetch(url, init),
      setTimer: (callback, ms) => window.setTimeout(callback, ms),
      clearTimer: (id) => window.clearTimeout(id as number | undefined),
      onReplies: (replies, poll) => {
        if (pollRef.current !== poll) return false;
        const updated = { ...poll, after: newestReplyId(replies) };
        pollRef.current = updated;
        writeStoredPoll(updated);
        dispatch({ type: 'ADD_AGENT', replies, now: Date.now() });
        return true;
      },
      onStop: () => applyPollState(null),
    });
    const onVisible = () => poller.wake();
    document.addEventListener('visibilitychange', onVisible);
    poller.start();
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      poller.stop();
    };
  }, [active, pollThreadId, applyPollState]);

  const setFeedback = useCallback((id: string, feedback: 'up' | 'down') => {
    const messages = messagesRef.current;
    const target = messages.find((m) => m.id === id);
    if (!target || target.role !== 'assistant') return;
    if (target.feedback === feedback) return;

    const threadId = threadIdRef.current;
    if (!threadId) {
      // No thread id means no AI message has been received yet, so there is
      // nothing to rate. Defensive guard; should not happen in practice.
      return;
    }

    const assistantMessageIndex = messages
      .filter((m) => m.role === 'assistant')
      .findIndex((m) => m.id === id);
    if (assistantMessageIndex < 0) return;

    dispatch({ type: 'SET_FEEDBACK', id, feedback });

    fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, assistantMessageIndex, feedback }),
    })
      .then((res) => {
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error(`docs-assistant feedback failed: ${res.status} ${res.statusText}`);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('docs-assistant feedback failed', err);
      });
  }, []);

  return { state, send, stop, retry, clear, clearAndSend, setFeedback };
}
