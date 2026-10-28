/**
 * Support replies in the docs assistant (SU-1083). A teammate answers from the conversation's Slack
 * thread, and the panel polls the backend for those replies. This file holds the logic that has no
 * React or browser dependency, so it can be tested with `node:test` (see
 * `__tests__/docs-assistant-agent-replies.test.mjs`).
 */

export interface AgentMessageBase {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  ts: number;
}

/** What the panel needs to poll one conversation: the thread, its token, and the last reply shown. */
export interface AgentPollState {
  threadId: string;
  token: string;
  /** Slack ts of the newest reply already shown, sent back as `after`. */
  after: string | null;
}

export interface AgentReply {
  id: string;
  text: string;
}

/**
 * Every poll is one Slack call on the backend, and that budget is shared with the feedback buttons,
 * so the panel polls no faster than every 8 seconds, slows down once the conversation goes quiet,
 * and stops after half an hour without activity. Opening the panel or returning to the tab counts
 * as activity.
 */
export const AGENT_POLL = {
  activeMs: 8_000,
  quietAfterMs: 5 * 60_000,
  quietMs: 30_000,
  stopAfterMs: 30 * 60_000,
  maxRetryAfterMs: 5 * 60_000,
} as const;

/** The wait before the next poll, or `null` when the conversation has been idle long enough to stop. */
export function pollDelayMs(sinceActivityMs: number): number | null {
  if (sinceActivityMs >= AGENT_POLL.stopAfterMs) return null;
  if (sinceActivityMs >= AGENT_POLL.quietAfterMs) return AGENT_POLL.quietMs;
  return AGENT_POLL.activeMs;
}

/** Honors the backend's `Retry-After` (seconds), never polling faster than normal or waiting past the cap. */
export function retryDelayMs(retryAfter: string | null | undefined): number {
  const seconds = Number(retryAfter);
  if (!Number.isFinite(seconds) || seconds <= 0) return AGENT_POLL.quietMs;
  return Math.min(Math.max(seconds * 1000, AGENT_POLL.activeMs), AGENT_POLL.maxRetryAfterMs);
}

/** Replies from a response body, dropping anything that is not `{ id: string, text: string }`. */
export function parseReplies(payload: unknown): AgentReply[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const messages = (payload as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];
  const replies: AgentReply[] = [];
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) continue;
    const { id, text } = m as { id?: unknown; text?: unknown };
    if (typeof id === 'string' && id && typeof text === 'string' && text.trim()) {
      replies.push({ id, text });
    }
  }
  return replies;
}

/** The newest reply's Slack ts, which becomes the next `after`. */
export function newestReplyId(replies: AgentReply[]): string | null {
  let newest: string | null = null;
  for (const r of replies) {
    if (newest === null || Number(r.id) > Number(newest)) newest = r.id;
  }
  return newest;
}

export function agentMessageId(replyId: string): string {
  return `agent-${replyId}`;
}

/** Adds replies not already in the thread (a reply that arrives twice is shown once), oldest first. */
export function mergeReplies<T extends AgentMessageBase>(
  messages: T[],
  replies: AgentReply[],
  now: number,
  make: (id: string, content: string, ts: number) => T
): T[] {
  const known = new Set(messages.map((m) => m.id));
  const added = replies
    .filter((r) => !known.has(agentMessageId(r.id)))
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((r) => make(agentMessageId(r.id), r.text, now));
  return added.length ? [...messages, ...added] : messages;
}

/**
 * The history sent to the model. A Support reply is not part of the bot's conversation, so it never
 * goes back to the model as the assistant's own words.
 */
export function messagesForApi<T extends AgentMessageBase>(
  messages: T[]
): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of messages) {
    if (m.role === 'user' || m.role === 'assistant') out.push({ role: m.role, content: m.content });
  }
  return out;
}

/** Parses the poll state saved in localStorage; anything malformed is treated as no state. */
export function parsePollState(raw: string | null): AgentPollState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<AgentPollState> | null;
    if (!v || typeof v.threadId !== 'string' || typeof v.token !== 'string') return null;
    if (!v.threadId || !v.token) return null;
    return { threadId: v.threadId, token: v.token, after: typeof v.after === 'string' ? v.after : null };
  } catch {
    return null;
  }
}

/**
 * The poll state after a chat turn returned a thread id and (maybe) a token. The cursor survives only
 * while the thread stays the same, because replies of an old thread must not move the cursor of a new
 * one. No token means the backend has the feature off, so there is nothing to poll.
 */
export function nextPollState(
  previous: AgentPollState | null,
  threadId: string | null,
  token: string | null
): AgentPollState | null {
  if (!threadId || !token) return null;
  const after = previous && previous.threadId === threadId ? previous.after : null;
  return { threadId, token, after };
}

/** HTTP statuses after which polling this thread again cannot succeed, so the panel stops. */
export function isFatalPollStatus(status: number): boolean {
  return status === 400 || status === 403 || status === 404 || status === 503;
}
