import type { Verdict } from './a11y-baseline.mjs';

export function escapeHtml(value: unknown): string;
export function combineScans(scans: Array<{
  page: string;
  theme: string;
  axeCoreVersion: string;
  violations: Array<{ id: string; nodes?: Array<{ target?: Array<string | string[]> }> }>;
  incomplete?: Array<{ id: string; nodes?: Array<{ target?: Array<string | string[]> }> }>;
}>, url?: string): {
  url?: string;
  testEngine: { name: string; version: string };
  violations: object[];
  incomplete: object[];
  passes: object[];
  inapplicable: object[];
};
export function summaryHtml(verdict: Verdict, context: { scans: number; problems?: string[]; notes?: string[] }): string;
