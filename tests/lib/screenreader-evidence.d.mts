import type { Scenario } from './screenreader-scenario.mjs';
import type { Transcript } from './screenreader-transcript.mjs';

export type StepVerdict = 'pass' | 'missing-fact' | 'recorded' | 'unsupported' | 'not-run';

export interface StepRecord {
  scenario: string;
  step: string;
  lane: string;
  project: string;
  page: string;
  theme: string;
  criteria: string[];
  action: string;
  verdict: StepVerdict;
  reason?: string;
}

export const SCREENREADER_CHECK: string;
export const STEP_VERDICTS: readonly StepVerdict[];
export const FINDING_SEVERITY: string;
export function screenreaderChecks(scenarios: Pick<Scenario, 'criteria'>[]): Record<string, { title: string; criteria: string[] }>;
export function scenarioTheme(scenario: Pick<Scenario, 'query'>): string;
export function stepRecords(transcript: Transcript, scenario: Scenario): StepRecord[];
export function evidencePart(transcript: Transcript, scenario: Scenario): Record<string, unknown>;
export function buildScreenreaderEvidence(input: {
  project: string;
  lane: string;
  group?: string;
  transcripts: Transcript[];
  scenarios: Scenario[];
  run?: Record<string, unknown>;
  problems?: string[];
}): { doc: Record<string, unknown> & { records: StepRecord[] }; details: { file: string; detail: Record<string, unknown> }[]; problems: string[] };
