import type { Verdict } from './a11y-baseline.mjs';
import type { A11ySuite } from './a11y-suites.mjs';

export const FINDINGS_SCHEMA: number;
export function agentFindings(input: { verdict: Verdict; pages?: readonly { id: string }[]; problems?: string[]; suite?: A11ySuite; scans?: readonly { page: string; theme: string; url?: string }[] }): object;
