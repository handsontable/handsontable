export type ReadDirection = 'next' | 'previous' | 'in' | 'out';
export type ScenarioAction =
  | { press: string }
  | { type: string }
  | { selectCell: [number, number] }
  | { read: ReadDirection }
  | { activate: true }
  | { call: [string, ...unknown[]] };
export type SetupAction =
  | { press: string }
  | { type: string }
  | { selectCell: [number, number] }
  | { updateSettings: Record<string, unknown> }
  | { spreadsheetData: [number, number] }
  | { sentinels: true }
  | { focus: string }
  | { call: [string, ...unknown[]] };

export interface ScenarioStep {
  id: string;
  action: ScenarioAction;
  expect: string[][];
  /**
   * The severity of a token group, keyed by its first synonym; a group without one is serious.
   */
  severity?: Record<string, 'critical' | 'serious' | 'moderate' | 'minor'>;
  after?: { visible: string } | { hidden: string };
  note?: string;
  unsupported?: Record<string, string>;
}

export interface ScenarioTraversal {
  from: string;
  to: string;
  items: (string | string[])[];
}

export interface Scenario {
  schema: number;
  id: string;
  surface: string;
  group: 'keyboard' | 'reading' | 'menus';
  page?: string;
  state?: string;
  fixture?: string;
  catalogPages?: string[];
  query?: string;
  start?: 'grid' | 'page';
  criteria: string[];
  setup?: SetupAction[];
  steps: ScenarioStep[];
  traversal?: ScenarioTraversal;
  variantOf?: string;
}

export const SCENARIO_SCHEMA: number;
export const SCENARIO_FILE_SUFFIX: string;
export const ACTIONS: readonly string[];
export const SETUP_ACTIONS: readonly string[];
export const SPREADSHEET_LIMITS: Readonly<{ rows: number; columns: number }>;
export const READ_DIRECTIONS: readonly ReadDirection[];
export const SCREENREADER_LANES: readonly string[];
export const LANE_PRIMITIVES: Readonly<Record<string, { read: ReadDirection[]; activate: boolean }>>;
export const STARTS: readonly string[];
export const SCENARIO_GROUPS: readonly string[];
export const STEP_BUDGET_MS: number;
export const ENTRY_BUDGET_MS: number;
export function scenarioBudgetMs(scenario: { steps: unknown[] }): number;
export const PRESS_MODIFIERS: readonly string[];
export const PRESS_KEYS: readonly string[];
export const PRESS_PATTERN: RegExp;
export const CALL_NAME_PATTERN: RegExp;
export const QUERY_THEMES: readonly string[];
export const QUERY_BUNDLES: readonly string[];
export const DEFAULT_ROOT: string;
export function laneOfProject(project: string): string;
export function laneDrives(lane: string, action: ScenarioAction): boolean;
export function unsupportedReason(step: Pick<ScenarioStep, 'unsupported'>, lane: string): string | null;
export function laneUnsupported(scenarios: Pick<Scenario, 'steps'>[], lane: string): string[];
export function validateScenario(doc: unknown, options?: { fixtures?: string[]; fileName?: string }): string[];
export function resolveVariants<T extends { fileName: string; scenario: unknown; problems: string[] }>(loaded: T[]): T[];
export function loadScenarios(directory: string, options?: { fixtures?: string[] }):
  { fileName: string; scenario: Scenario | null; problems: string[] }[];
export function scenarioPlace(scenario: Pick<Scenario, 'page' | 'fixture'>): { fixture: string; pageQuery: string | undefined; root: string };
export function scenarioPageId(scenario: Pick<Scenario, 'page' | 'fixture'>): string;
export function scenarioUrl(scenario: Pick<Scenario, 'page' | 'fixture' | 'query'>, options?: { theme?: string; bundle?: string }): string;
