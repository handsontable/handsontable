export const QUARANTINE_TAG: '@quarantine';
export const QUARANTINE_ANNOTATION: 'quarantine';
export const QUARANTINE_CAP: number;
export const QUARANTINE_MAX_DAYS: number;

export interface QuarantineEntry {
  taskId: string;
  expires: string;
  why: string | null;
}

export interface RunTest {
  title: string;
  file: string;
  project: string;
  outcome: 'skipped' | 'expected' | 'unexpected' | 'flaky';
  annotations: Array<{ type: string; description?: string }>;
}

export interface RunVerdict {
  status: 'passed' | 'failed' | 'timedout' | 'interrupted';
  downgraded: boolean;
  quarantineCount: number;
  quarantinedFlaky: number;
  problems: string[];
  notes: string[];
  warnings: string[];
}

export function describeQuarantine(taskId: string, expires: string, why?: string): string;
export function parseQuarantine(description: string | undefined): QuarantineEntry | null;
export function validateQuarantine(taskId: unknown, expires: unknown, now: Date): string | null;
export function isExpired(expires: string, now: Date): boolean;
export function evaluateRun(input: {
  tests: RunTest[];
  now: Date;
  runStatus: 'passed' | 'failed' | 'timedout' | 'interrupted';
  hadErrors?: boolean;
  cap?: number;
}): RunVerdict;
