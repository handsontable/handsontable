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

export const API_URL =
  (import.meta.env.PUBLIC_CHAT_API_URL as string | undefined) ||
  'https://hot-docs-assistant.netlify.app';

export const CHAT_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/chat`;
export const FEEDBACK_ENDPOINT = `${API_URL.replace(/\/$/, '')}/api/feedback`;

export const SHIKI_LANGS = ['js', 'ts', 'html', 'css', 'json', 'bash'] as const;
export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const;
