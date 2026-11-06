import type { ScenarioAction, ScenarioTraversal } from './screenreader-scenario.mjs';

export type TokenSeverity = 'critical' | 'serious' | 'moderate' | 'minor';
export interface TokenGroupMatch { synonyms: string[]; matched: string | null; severity: TokenSeverity }
export interface TokenVerdict { passed: boolean; groups: TokenGroupMatch[] }
export interface GoldenDifference { id: string; expected: string | null; actual: string | null }
export interface GoldenVerdict { status: 'missing' | 'match' | 'differs' | 'recorded' | 'incomplete'; differences: GoldenDifference[] }
/**
 * Where a run stopped when it threw: the id of the step being run, or `setup` when it stopped before
 * the first step (the page load, the reader's entry, the setup actions or the mode pin), and the
 * error's message.
 */
export interface TranscriptIncomplete { step: string; error: string }

export interface TranscriptStep {
  id: string;
  action: ScenarioAction;
  spoken: string;
  normalized: string;
  tokens: TokenVerdict;
  durationMs: number;
  /**
   * What the reader said while it prepared the primitive (NVDA's switch between focus and browse mode),
   * outside the step's capture; absent when it said nothing.
   */
  preparing?: string[];
}

/**
 * A step the lane did not run, because the step declares it `unsupported` there: a gap the report lists.
 */
export interface TranscriptUnsupportedStep {
  id: string;
  action: ScenarioAction;
  reason: string;
}

export interface TraversalVerdict {
  passed: boolean;
  steps: string[];
  items: { item: string; count: number; firstStep: string | null }[];
  outOfOrder: string[];
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
  /**
   * The catalog page the scenario opened, or its fixture file when it opened none.
   */
  page: string;
  criteria: string[];
  project: string;
  lane: string;
  mode: string;
  attempt: number;
  environment: TranscriptEnvironment;
  startedAt: string;
  durationMs: number;
  steps: TranscriptStep[];
  unsupported: TranscriptUnsupportedStep[];
  traversal?: TraversalVerdict;
  golden: GoldenVerdict;
  incomplete?: TranscriptIncomplete;
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
export const TOKEN_SEVERITIES: readonly TokenSeverity[];
export const DEFAULT_TOKEN_SEVERITY: TokenSeverity;
export const CHATTER: readonly string[];
export function normalizeAnnouncement(text: unknown): string;
export function matchTokenGroups(normalized: string, groups: string[][], severities?: Record<string, string>): TokenVerdict;
export function matchTraversal(steps: Pick<TranscriptStep, 'id' | 'normalized'>[], traversal: ScenarioTraversal): TraversalVerdict;
export function goldenFromTranscript(transcript: Transcript): Golden;
export function compareWithGolden(golden: Golden | null, steps: Pick<TranscriptStep, 'id' | 'normalized'>[]): GoldenVerdict;
export function transcriptCounts(transcript: Transcript): {
  steps: number; tokenFailures: number; unsupported: number; traversalFailed: boolean; goldenStatus: string; goldenDifferences: number; durationMs: number;
};
export function renderTranscriptLog(transcript: Transcript): string;
export function describeAction(action: ScenarioAction): string;
