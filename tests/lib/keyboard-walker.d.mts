export const WALKER_CHECK: string;
export const WALKER_CRITERIA: string[];
export const REGIONS: string[];

export interface WalkStop {
  region: string;
  ref?: string | number;
  cell?: number[] | null;
  role?: string;
  name?: string;
  ignored?: boolean;
  modal?: boolean;
  locator?: string;
  tag?: string;
  contextChange?: string;
  signals?: { url?: string; popups?: number; editorOpen?: boolean };
}

export interface WalkVerdict {
  reachedEnd: boolean;
  leftDocument: boolean;
  cycle: { from: number; to: number } | null;
  trapped: boolean;
  presses: number;
  productStops: number;
  modal: boolean;
  exitRoute: { keys: string; left: boolean; presses: number } | null;
}

export function stopKey(stop: WalkStop): string;
export function isProductStop(stop: WalkStop): boolean;
export function walkVerdict(input: {
  direction: 'forward' | 'backward';
  stops: WalkStop[];
  budgetExhausted?: boolean;
  exitRoute?: { keys: string; left: boolean; presses: number } | null;
}): WalkVerdict;
export function walkFindings(input: {
  walk: WalkVerdict;
  stops: WalkStop[];
  direction: 'forward' | 'backward';
  modalExit?: string | null;
  opened?: boolean;
  reported?: Set<string>;
}): Array<{ kind: string; criteria: string[]; severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory'; reason: string; selector?: string; step?: string; measured?: Record<string, unknown> }>;
export function escapeFindings(input: {
  state: string;
  closedAfter: number | null;
  presses?: number;
  focusReturned: boolean;
  focus?: string;
}): Array<{ kind: string; criteria: string[]; severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory'; reason: string; step?: string; measured?: Record<string, unknown> }>;
export function goldenStops(stops: WalkStop[]): object[];
export function diffTabOrder(expected: object[], actual: object[]): { index: number; expected: object | null; actual: object | null; expectedLength: number; actualLength: number } | null;
export function normalizeKeys(cell: string): string;
export function parseShortcutTables(markdown: string): Array<{ section: string; keys: string; mac: string; action: string; ordinal: number; line: number }>;
export function shortcutKey(row: { section: string; keys: string; ordinal?: number }): string;
export type ProbeStep = string | { api?: string; focus?: string; type?: string };
export function probePresses(probe: { press: string | Array<string | { key: string; prepare?: ProbeStep[] }> }): Array<{ key: string; prepare: ProbeStep[] }>;
export function probeStep(entry: { keys: string; probe: { setup: string; at?: number[]; then?: ProbeStep[] } }, press: { key: string; prepare?: ProbeStep[] }): string;
export function effectsBetween(before: object, after: object): string[];
export function probeVerdict(input: { expect: string | string[]; forbid?: string[]; before: object; after: object }): { status: 'ok' | 'nothing' | 'unexpected' | 'focus-left'; effects: string[] };
export function inventoryLines(source: string): Map<string, number>;
export function singleCharacterShortcuts<T extends { section: string; keys: string }>(rows: T[]): T[];
