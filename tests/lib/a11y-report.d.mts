import type { Verdict } from './a11y-baseline.mjs';
import type { A11yPage } from '../a11y/pages.mjs';

export const FIXTURE_SERVER: string;
export function escapeHtml(value: unknown): string;
export function heatBin(count: number, max: number): number;
export function renderHtmlReport(model: {
  verdict: Verdict;
  scans: object[];
  pages: readonly A11yPage[];
  run: { generatedAt?: string; engines?: string[]; commit?: string; prUrl?: string; runUrl?: string; docsUrl?: string; notes?: string[]; problems?: string[] };
}): string;
