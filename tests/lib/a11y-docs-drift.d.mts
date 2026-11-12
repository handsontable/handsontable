export const LEDGER_URL: string;
export const DOCS_AUDIT_COMMAND: string;
export interface DocsAudit {
  runId: string;
  seenAt: string | null;
  headSha: string | null;
  keys: Set<string>;
  nodes: Map<string, number | null>;
}
export function driftKey(finding: { rule: string; page: string; theme: string; where: string }): string;
export const SITE_DRIFT: Readonly<Record<'docs' | 'website', { audit: string; none: string; on: string; command: string; baseline: string;
  refresh: string | null; section: string; deploy: string }>>;
export function docsAudit(ledger: unknown): DocsAudit | null;
export function siteAudit(ledger: unknown, site: 'docs' | 'website'): DocsAudit | null;
export function driftOf(audit: DocsAudit | null, comparison: { newViolations?: object[]; grown?: object[] } | null): (item: object) => boolean;
export function isDrift(audit: DocsAudit | null, item: { rule: string; page: string; theme: string; target: string }): boolean;
export function driftNotes(input: { audit: { runId: string; seenAt: string | null } | null; problem?: string | null; drift: number; counted: number; grown?: number;
  deployedAt?: string | null; site?: 'docs' | 'website' }): string[];
