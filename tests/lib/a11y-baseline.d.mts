export const A11Y_MODES: readonly ['warn', 'block'];
export const A11Y_MODE: 'warn' | 'block';
export const A11Y_THEMES: readonly ['main', 'horizon', 'classic'];
export const BASELINE_FILE: string;

export type A11yMode = 'warn' | 'block';
export type A11yTheme = 'main' | 'horizon' | 'classic';

export interface FindingKey {
  page: string;
  theme: string;
  rule: string;
  target: string;
}

export interface BaselineEntry extends FindingKey {
  impact?: string | null;
  task: string;
  note: string;
}

export interface BaselineDocument {
  axeCoreVersion: string;
  entries: BaselineEntry[];
}

export interface Finding extends FindingKey {
  impact?: string | null;
  help?: string;
  helpUrl?: string;
  html?: string;
  nodes?: number;
}

export interface Verdict {
  mode: A11yMode;
  status: 'passed' | 'failed';
  newViolations: Array<Finding & { nodes: number; remedy: string }>;
  matched: Array<Finding & { nodes: number; task: string; note: string; remedy: string }>;
  stale: Array<BaselineEntry & { remedy: string }>;
  unverified: Array<BaselineEntry & { remedy: string }>;
}

export function entryKey(item: FindingKey): string;
export function escapeMarkdownText(value: unknown): string;
export function targetFingerprint(target: Array<string | string[]>, html?: string): string;
export function validateBaseline(document: unknown, known: { pages: string[] }): string[];
export function compareViolations(input: {
  baseline: BaselineEntry[];
  violations: Finding[];
  scanned: Array<{ page: string; theme: string }>;
  mode: A11yMode;
}): Verdict;
export function renderSummary(verdict: Verdict): string;
export function renderAnnotations(verdict: Verdict): string[];
