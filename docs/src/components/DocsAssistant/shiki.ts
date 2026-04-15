/**
 * Client-side shiki wrapper for syntax highlighting assistant code blocks.
 * The highlighter is lazy-loaded and memoized so the WASM/grammar payload
 * is fetched once per page load.
 */
import type { Highlighter } from 'shiki';
import { SHIKI_LANGS, SHIKI_THEMES } from './constants';

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Returns a memoized shiki highlighter preloaded with the curated language
 * set and both `github-light` / `github-dark` themes.
 */
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

/**
 * Reads the Starlight-managed theme from `<html data-theme>`. Defaults to
 * `light` outside a browser environment.
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.dataset.theme;

  return attr === 'dark' ? 'dark' : 'light';
}

/**
 * Maps common language aliases (`javascript`, `sh`, …) to the curated
 * shiki grammar set. Unsupported languages fall back to `text` so shiki
 * does not throw.
 */
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
