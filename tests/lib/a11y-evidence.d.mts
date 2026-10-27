export const EVIDENCE_SCHEMA: number;
export const EVIDENCE_MODE: 'report';
export const EVIDENCE_ATTACHMENT: string;
export const TARGET_ANNOTATION: string;
export const CHECK_RUN_PREFIX: string;
export const SEVERITIES: readonly string[];
export const TARGET_STATUSES: readonly string[];
export const PAGES_FILE: string;
export const WCAG_CRITERIA: Readonly<Record<string, { name: string; level: 'A' | 'AA' | 'AAA' }>>;
export const EVIDENCE_CHECKS: Readonly<Record<string, { title: string; spec: string; criteria: string[]; pullRequest: boolean; triage?: boolean }>>;
export const CHECK_SUITES: readonly string[];
export function checksForSuite(suite: string | undefined, checks?: Record<string, { pullRequest?: boolean }>): string[];

export interface EvidenceDocument {
  schema: number;
  check: string;
  title: string;
  mode: string;
  criteria: string[];
  run: Record<string, unknown>;
  targets: Array<Record<string, unknown>>;
  findings: Array<Record<string, unknown> & { id: string; kind: string; criteria: string[]; severity: string; reason: string }>;
  problems: string[];
  summary: {
    targets: number;
    measured: number;
    errors: number;
    flaky: number;
    findings: number;
    bySeverity: Record<string, number>;
    byKind: Record<string, number>;
    byCriterion: Record<string, { name: string | null; level: string | null; evaluated: number; findings: number; pages: string[] }>;
  };
}

export function criterionInfo(id: string): { id: string; name: string; level: string } | null;
export function compareCriteria(a: string, b: string): number;
export function checkRunName(check: string): string;
export function targetFileName(target: { page: string; theme: string; variant?: string | null }): string;
export function targetKey(target: { page: string; theme: string; variant?: string | null }): string;
export function findingId(check: string, finding: object): string;
export function validatePart(part: unknown): string[];
export function mergeEvidence(input: {
  check: string;
  parts: object[];
  failures?: Array<{ title: string; target: object | null; error: string; flaky?: boolean }>;
  run?: Record<string, unknown>;
  problems?: string[];
  checks?: Record<string, { title: string; criteria: string[] }>;
}): EvidenceDocument;
export function validateEvidence(doc: unknown, options?: { checks?: Record<string, object> }): string[];
export function evidenceHeadline(doc: EvidenceDocument): string;
export function renderEvidenceSummary(doc: EvidenceDocument, links?: { runUrl?: string; artifactUrl?: string }): string;
export function buildEvidenceCheckRun(input: {
  doc: EvidenceDocument | null;
  check?: string;
  problems?: string[];
  pages?: Map<string, number>;
  runUrl?: string;
  artifactUrl?: string;
}): { name: string; conclusion: 'success' | 'neutral'; title: string; summary: string; annotations: object[] };
export function findingText(finding: object): string;
export function measuredText(measured: Record<string, unknown>): string;
