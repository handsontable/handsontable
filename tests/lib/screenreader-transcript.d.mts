import type { ScenarioAction } from './screenreader-scenario.mjs';

export interface TokenGroupMatch { synonyms: string[]; matched: string | null }
export interface TokenVerdict { passed: boolean; groups: TokenGroupMatch[] }
export interface GoldenDifference { id: string; expected: string | null; actual: string | null }
export interface GoldenVerdict { status: 'missing' | 'match' | 'differs' | 'recorded'; differences: GoldenDifference[] }

export interface TranscriptStep {
  id: string;
  action: ScenarioAction;
  spoken: string;
  normalized: string;
  tokens: TokenVerdict;
  durationMs: number;
}

export interface TranscriptEnvironment {
  screenReader: string;
  browser: string;
  platform: string;
}

export interface Transcript {
  schema: number;
  scenario: string;
  surface: string;
  project: string;
  mode: string;
  attempt: number;
  environment: TranscriptEnvironment;
  startedAt: string;
  durationMs: number;
  steps: TranscriptStep[];
  golden: GoldenVerdict;
}

export interface Golden {
  schema: number;
  scenario: string;
  project: string;
  recorded: TranscriptEnvironment & { at: string };
  steps: Record<string, string>;
}

export const TRANSCRIPT_SCHEMA: number;
export const GOLDEN_SCHEMA: number;
export const SCREENREADER_MODES: readonly string[];
export const SCREENREADER_MODE: 'report' | 'gate';
export const CHATTER: readonly string[];
export function normalizeAnnouncement(text: unknown): string;
export function matchTokenGroups(normalized: string, groups: string[][]): TokenVerdict;
export function goldenFromTranscript(transcript: Transcript): Golden;
export function compareWithGolden(golden: Golden | null, steps: Pick<TranscriptStep, 'id' | 'normalized'>[]): GoldenVerdict;
export function transcriptCounts(transcript: Transcript): { steps: number; tokenFailures: number; goldenStatus: string; goldenDifferences: number; durationMs: number };
export function renderTranscriptLog(transcript: Transcript): string;
export function describeAction(action: ScenarioAction): string;
