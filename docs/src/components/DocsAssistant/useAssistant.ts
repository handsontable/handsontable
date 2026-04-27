import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CHAT_ENDPOINT, FEEDBACK_ENDPOINT, STORAGE_KEYS } from './constants';
import { buildContextualMessage } from './pageContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
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
  | { type: 'BEGIN_ASSISTANT'; message: ChatMessage }
  | { type: 'APPEND'; id: string; delta: string }
  | { type: 'END' }
  | { type: 'ERROR'; error: string }
  | { type: 'CLEAR' }
  | { type: 'RETRY_POP' }
  | { type: 'SET_FEEDBACK'; id: string; feedback: 'up' | 'down' }
  | { type: 'HYDRATE'; messages: ChatMessage[] };

function reducer(state: ThreadState, action: Action): ThreadState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, messages: action.messages };
    case 'ADD_USER':
      return { ...state, messages: [...state.messages, action.message], error: null };
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
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant' && !last.content) messages.pop();
      return { ...state, streaming: false, error: action.error, messages };
    }
    case 'CLEAR':
      return { messages: [], streaming: false, error: null };
    case 'RETRY_POP': {
      const messages = [...state.messages];
      while (messages.length && messages[messages.length - 1].role === 'assistant') messages.pop();
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

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function* readSSE(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal
): AsyncGenerator<{ type: string; delta?: { content?: string } }> {
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

export function useAssistant() {
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
      // Register the controller before any await so clearAndSend can abort
      // even while buildContextualMessage is still fetching page context.
      const controller = new AbortController();
      abortRef.current = controller;

      const contextualised = await buildContextualMessage(userMessageText);

      // Bail out if aborted during page-context fetch (no UI state committed yet).
      if (controller.signal.aborted) {
        if (abortRef.current === controller) abortRef.current = null;
        return;
      }

      const apiMessages = [
        ...historyForApi.map(({ role, content }) => ({ role, content })),
        { role: 'user' as const, content: contextualised },
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

        // Capture the thread id returned by the first successful turn so the
        // backend can correlate subsequent turns to the same conversation. The
        // server returns the same value on every turn of a conversation; the
        // `!current` guard avoids redundant writes.
        const returnedId = res.headers.get('X-Thread-Id');
        if (returnedId && !threadIdRef.current) {
          threadIdRef.current = returnedId;
          writeThreadId(returnedId);
        }

        for await (const event of readSSE(res.body, controller.signal)) {
          if (event.type === 'content_chunk') {
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
    []
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
      dispatch({ type: 'ADD_USER', message: userMessage });
      await sendInternal(trimmed, history);
    },
    [sendInternal, state.messages, state.streaming]
  );

  const retry = useCallback(async () => {
    if (state.streaming) return;
    const messages = [...state.messages];
    while (messages.length && messages[messages.length - 1].role === 'assistant') messages.pop();
    const lastUser = messages[messages.length - 1];
    if (!lastUser || lastUser.role !== 'user') return;
    dispatch({ type: 'RETRY_POP' });
    const history = messages.slice(0, -1);
    await sendInternal(lastUser.content, history);
  }, [sendInternal, state.messages, state.streaming]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    threadIdRef.current = null;
    clearThreadIdStorage();
    dispatch({ type: 'CLEAR' });
  }, []);

  const clearAndSend = useCallback(
    async (text: string) => {
      abortRef.current?.abort();
      abortRef.current = null;
      threadIdRef.current = null;
      clearThreadIdStorage();
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
    [sendInternal]
  );

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
