import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CHAT_ENDPOINT, STORAGE_KEYS } from './constants';
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

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'END' });
  }, []);

  const sendInternal = useCallback(
    async (userMessageText: string, historyForApi: ChatMessage[]) => {
      const contextualised = await buildContextualMessage(userMessageText);
      const apiMessages = [
        ...historyForApi.map(({ role, content }) => ({ role, content })),
        { role: 'user' as const, content: contextualised },
      ];

      const assistantId = uid();
      dispatch({
        type: 'BEGIN_ASSISTANT',
        message: { id: assistantId, role: 'assistant', content: '', ts: Date.now() },
      });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText || 'Request failed'}`);
        }
        if (!res.body) throw new Error('No response body');

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
          dispatch({ type: 'END' });
          return;
        }
        dispatch({ type: 'ERROR', error: (err as Error).message || 'Request failed' });
      } finally {
        abortRef.current = null;
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
    dispatch({ type: 'CLEAR' });
  }, []);

  const setFeedback = useCallback((id: string, feedback: 'up' | 'down') => {
    dispatch({ type: 'SET_FEEDBACK', id, feedback });
  }, []);

  return { state, send, stop, retry, clear, setFeedback };
}
