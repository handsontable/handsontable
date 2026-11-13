export const LEDGER_URL: string;
export const DOCS_AUDIT_COMMAND: string;
export interface DocsAudit {
  runId: string;
  seenAt: string | null;
  headSha: string | null;
  keys: Set<string>;
}
export function driftKey(finding: { rule: string; page: string; theme: string; where: string }): string;
export function docsAudit(ledger: unknown): DocsAudit | null;
export function driftOf(audit: DocsAudit | null, comparison: { newViolations?: object[] } | null): (item: object) => boolean;
export function isDrift(audit: DocsAudit | null, item: { rule: string; page: string; theme: string; target: string }): boolean;
export function driftNotes(input: { audit: { runId: string; seenAt: string | null } | null; problem?: string | null; drift: number; counted: number; grown?: number; deployedAt?: string | null }): string[];
