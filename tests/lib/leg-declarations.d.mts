export const THEMES_TAG: '@themes';
export const BUNDLES_TAG: '@bundles';
export const FULL_MATRIX_ENV: 'HOT_E2E_FULL_MATRIX';
export const TAG_CONSTANTS: Readonly<Record<string, string>>;
export const LEG_TAG_LIKE: RegExp;
export const IGNORE_COMMENT: 'leg-declarations: ignore';
export const IGNORE_WHY_MIN_LENGTH: number;

export interface GeometryHelper {
  name: string;
  owner: string | null;
  file: string;
  line: number;
}

/**
 * The functions and classes of the page objects a spec reaches, with which functions are geometry
 * helpers. Built inside `checkSpec()`; opaque to callers.
 */
export interface GeometryIndex {
  functions: Array<GeometryHelper & { geometry: boolean }>;
  classes: Map<string, { file: string; parent: string | null }>;
}

export interface MarkerFindContext {
  scope: 'spec' | 'module' | 'fixture';
  file: string;
  geometry: GeometryIndex;
}

export interface MarkerFinding {
  index: number;
  detail?: string;
}

export interface SurfaceMarker {
  id: string;
  axis: 'themes' | 'bundles';
  /**
   * Read by a pattern over the comment-stripped text, or by `find`; never both.
   */
  pattern?: RegExp;
  find?: (views: { code: string; masked: string }, context: MarkerFindContext) => MarkerFinding[];
  scopes: Array<'spec' | 'module' | 'fixture'>;
  why: string;
}

export const SURFACE_MARKERS: ReadonlyArray<SurfaceMarker>;

export interface Legs {
  themes: boolean;
  bundles: boolean;
}

export interface TagItem {
  kind: 'literal' | 'identifier' | 'unknown-identifier' | 'unreadable';
  tag: string | null;
  text: string;
}

export interface Details {
  kind: 'object' | 'quarantined' | 'unreadable';
  items: TagItem[];
  tags: string[];
  text: string;
}

export interface Block {
  kind: 'describe' | 'test';
  callee: string;
  start: number;
  end: number;
  line: number;
  depth: number;
  title: string;
  argumentCount: number;
  argumentSpans: Array<{ start: number; end: number }>;
  details: Details | null;
  tags: string[];
}

export interface Literal {
  start: number;
  end: number;
  value: string;
}

export interface ScannedSource {
  code: string;
  masked: string;
  literals: Literal[];
}

export interface Ignore {
  marker: string;
  why: string;
  line: number;
}

export interface MarkerHit {
  id: string;
  axis: 'themes' | 'bundles';
  scope: 'spec' | 'module' | 'fixture';
  file: string;
  line: number;
  count: number;
  detail?: string;
}

export interface SpecText {
  file: string;
  source: string;
}

export interface SpecInput extends SpecText {
  modules?: SpecText[];
  fixtures?: SpecText[];
}

export interface Violation {
  rule: string;
  message: string;
}

export interface SpecReport {
  file: string;
  blocks: Block[];
  topLevel: Block[];
  declared: Legs | null;
  tags: string[];
  violations: Violation[];
  hits: MarkerHit[];
  ignores: Ignore[];
}

export function parseFullMatrix(raw: string | undefined): boolean;
export function tagLookahead(tag: string): string;
export function legGrep(leg: { theme: string; bundle: string; fullMatrix?: boolean }): RegExp | undefined;
export function legsOf(tags: string[]): Legs;
export function projectsOf(legs: Legs): string[];
export function lineOf(text: string, index: number): number;
export function scanSource(source: string, where?: string): ScannedSource;
export function matchingBracket(masked: string, open: number, where: string): number;
export function splitTopLevel(masked: string, from: number, to: number): Array<{ start: number; end: number }>;
export function readBlocks(source: string, where?: string): Block[];
export function readIgnores(source: string): Ignore[];
export function findMarkerHits(
  code: string,
  scope: 'spec' | 'module' | 'fixture',
  file: string,
  context?: { masked?: string; geometry?: GeometryIndex },
): MarkerHit[];
export function readGeometryHelpers(modules: SpecText[]): GeometryHelper[];
export function scanFixtureHtml(source: string, where?: string): string;
export function isTypeOnlyModule(code: string): boolean;
export function relativeImports(code: string): string[];
export function fixturesNamed(texts: ScannedSource[], index: Map<string, string>): string[];
export function checkSpec(input: SpecInput): SpecReport;
