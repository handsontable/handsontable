export const STORAGE_KEYS = {
  thread: 'hot-docs-chat-thread',
  open: 'hot-docs-chat-open',
  width: 'hot-docs-chat-width',
  threadId: 'hot-docs-chat-thread-id',
} as const;

export const WIDTH = {
  min: 360,
  max: 800,
  default: 520,
} as const;

export const STARTER_SUGGESTIONS = [
  'How do I freeze columns?',
  'What cell types are available?',
  'How do I customize the context menu?',
];

export const WELCOME = {
  headline: 'How can I help?',
  sub: 'I search the docs to answer questions about APIs, configuration, and usage. I say "I don\'t know" when the docs don\'t cover it.',
};

/**
 * Canonical docs hosts where the marketing worker proxies a stable same-origin
 * path (`/docs-assistant/*`) through to the assistant backend (SU-664). On
 * these hosts the widget talks to its own origin, so future backend rollovers
 * need no docs-repo, CSP, or CORS change.
 */
const SAME_ORIGIN_DOCS_HOSTS = new Set(['handsontable.com', 'dev.handsontable.com']);

/** Same-origin base proxied by the marketing worker on the canonical hosts. */
const SAME_ORIGIN_BASE = '/docs-assistant';

/**
 * Absolute backend URL used everywhere the same-origin proxy does not exist —
 * `*.pages.dev` deploy previews and local development. Baked at build time from
 * `PUBLIC_CHAT_API_URL`, falling back to the Netlify deployment.
 */
const ABSOLUTE_API_URL =
  (import.meta.env.PUBLIC_CHAT_API_URL as string | undefined) ||
  'https://hot-docs-assistant.netlify.app';

/**
 * Resolve the backend base URL at runtime. The widget mounts client-side only
 * (see `docs-assistant-bootstrap.ts`), so `window` is available — but the guard
 * keeps the module safe to evaluate during SSR/build too.
 */
function resolveApiBase(): string {
  if (typeof window !== 'undefined' && SAME_ORIGIN_DOCS_HOSTS.has(window.location.hostname)) {
    return SAME_ORIGIN_BASE;
  }
  return ABSOLUTE_API_URL;
}

export const API_URL = resolveApiBase();

export const CHAT_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/chat`;
export const FEEDBACK_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/feedback`;

export const SHIKI_LANGS = ['js', 'ts', 'html', 'css', 'json', 'bash'] as const;
export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
