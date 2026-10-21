// Light/dark mode for the page. Three sources, in priority order:
// 1. `?theme=light|dark` in the URL.
// 2. A message from the embedding page. demos.handsontable.com's embed wrapper
//    speaks this protocol: the iframe posts `{ source, ready: true }` to its
//    parent and the parent replies with `{ source, mode }`.
// 3. The OS preference (`prefers-color-scheme`).
export type Mode = 'light' | 'dark';

const SOURCE = 'hot-runner-scheme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<(mode: Mode) => void>();

const asMode = (value: unknown): Mode | null => (value === 'light' || value === 'dark' ? value : null);
let forced: Mode | null = asMode(new URLSearchParams(window.location.search).get('theme'));

export const currentMode = (): Mode => forced ?? (media.matches ? 'dark' : 'light');

export const onModeChange = (listener: (mode: Mode) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const apply = () => {
  const mode = currentMode();
  // Forces every `light-dark()` color on the page, including the A2UI
  // components, to the chosen side.
  document.documentElement.style.colorScheme = mode;
  document.documentElement.dataset.mode = mode;
  listeners.forEach((listener) => listener(mode));
};

media.addEventListener('change', apply);
window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { source?: string; mode?: string } | null;
  if (!data || data.source !== SOURCE || typeof data.mode !== 'string') return;
  forced = asMode(data.mode);
  apply();
});
apply();
