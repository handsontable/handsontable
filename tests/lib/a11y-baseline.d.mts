export const A11Y_MODES: readonly ['warn', 'block'];
export const A11Y_MODE: 'warn' | 'block';
export const A11Y_THEMES: readonly ['main', 'horizon', 'classic'];
export const BASELINE_FILE: string;
export const ACTION_SETS: readonly ['newViolations', 'grown', 'improved', 'stale'];

export type A11yMode = 'warn' | 'block';
export type A11yTheme = 'main' | 'horizon' | 'classic';

export interface FindingKey {
  page: string;
  theme: string;
  rule: string;
  target: string;
}

export interface BaselineIssue {
  id: string;
  title: string;
  tracker?: string;
}

export interface BaselineEntry extends FindingKey {
  impact?: string | null;
  nodes: number;
  issue: string;
}

export interface BaselineDocument {
  axeCoreVersion: string;
  issues: BaselineIssue[];
  entries: BaselineEntry[];
}

export interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeDetail {
  html: string;
  selector: Array<string | string[]>;
  ancestry: Array<string | string[]> | null;
  box: NodeBox | null;
  failureSummary: string;
}

export interface Finding extends FindingKey {
  impact?: string | null;
  help?: string;
  helpUrl?: string;
  wcag?: string[];
  html?: string;
  selector?: Array<string | string[]>;
  ancestry?: Array<string | string[]> | null;
  box?: NodeBox | null;
  failureSummary?: string;
  nodes?: number;
}

export interface FoldedFinding extends FindingKey {
  impact?: string | null;
  help?: string;
  helpUrl?: string;
  wcag?: string[];
  nodes: number;
  details: NodeDetail[];
  remedy: string;
}

export interface ScanLike {
  page: string;
  theme: string;
  violations: Array<{
    id: string;
    impact?: string | null;
    help: string;
    helpUrl: string;
    tags?: string[];
    nodes: Array<{ target: Array<string | string[]>; html: string; failureSummary?: string; ancestry?: Array<string | string[]>; box?: NodeBox | null }>;
  }>;
}

export interface IssueWithCounts extends BaselineIssue {
  counts: { matched: number; grown: number; improved: number; stale: number; unverified: number; newPages: number };
}

export interface Verdict {
  mode: A11yMode;
  status: 'passed' | 'failed';
  newViolations: Array<FoldedFinding & { suggestedIssue: string | null }>;
  grown: Array<FoldedFinding & { issue: string; baselineNodes: number }>;
  matched: Array<FoldedFinding & { issue: string; baselineNodes: number }>;
  improved: Array<FoldedFinding & { issue: string; baselineNodes: number }>;
  stale: Array<BaselineEntry & { remedy: string }>;
  unverified: Array<BaselineEntry & { remedy: string }>;
  issues: IssueWithCounts[];
}

export interface VerdictCounts {
  new: number;
  grown: number;
  matched: number;
  improved: number;
  stale: number;
  unverified: number;
  action: number;
}

export function entryKey(item: FindingKey): string;
export function targetFingerprint(target: Array<string | string[]>, html?: string): string;
export function selectorText(selector: unknown): string;
export function wcagCriteria(tags?: string[]): string[];
export function findingsFromScan(scan: ScanLike): Finding[];
export interface ScanMark {
  n: number;
  status: 'new' | 'grown' | 'known';
  rule: string;
  target: string;
  issue: string | null;
  nodes: number;
  selectors: Array<Array<string | string[]>>;
}

export function representativeScans(entries: BaselineEntry[]): Map<string, Set<string>>;
export function marksForScan(input: { findings: Finding[]; entries: BaselineEntry[]; pictured?: Set<string> }): ScanMark[];
export function validateBaseline(document: unknown, known: { pages: string[] }): string[];
export function compareViolations(input: {
  baseline: BaselineEntry[];
  issues?: BaselineIssue[];
  violations: Finding[];
  scanned: Array<{ page: string; theme: string }>;
  mode: A11yMode;
}): Verdict;
export function verdictCounts(verdict: Verdict): VerdictCounts;
export function engineVersionNote(input: { engines: string[]; baselineVersion: string }): string | null;
export function headline(verdict: Verdict): string;
export function renderSummary(verdict: Verdict, context?: { reportUrl?: string }): string;
export function renderAnnotations(verdict: Verdict): string[];
export function escapeMarkdownText(value: unknown): string;
export function isSafeLink(url: unknown): boolean;
