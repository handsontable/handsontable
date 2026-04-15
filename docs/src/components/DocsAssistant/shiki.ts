import type { Highlighter } from 'shiki';
import { SHIKI_LANGS, SHIKI_THEMES } from './constants';

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then((shiki) =>
      shiki.createHighlighter({
        themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
        langs: SHIKI_LANGS as unknown as string[],
      })
    );
  }
  return highlighterPromise;
}

export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.dataset.theme;
  return attr === 'dark' ? 'dark' : 'light';
}

export function normalizeLang(raw: string | undefined): string {
  if (!raw) return 'text';
  const l = raw.toLowerCase();
  const map: Record<string, string> = {
    javascript: 'js', jsx: 'js', node: 'js',
    typescript: 'ts', tsx: 'ts',
    shell: 'bash', sh: 'bash', zsh: 'bash',
    yml: 'json',
  };
  const resolved = map[l] ?? l;
  return (SHIKI_LANGS as readonly string[]).includes(resolved) ? resolved : 'text';
}
