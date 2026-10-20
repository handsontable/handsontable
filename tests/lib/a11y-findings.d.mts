import type { Verdict } from './a11y-baseline.mjs';
import type { A11yPage } from '../a11y/pages.mjs';

export const FINDINGS_SCHEMA: number;
export function agentFindings(input: { verdict: Verdict; pages: readonly A11yPage[]; problems?: string[] }): object;
