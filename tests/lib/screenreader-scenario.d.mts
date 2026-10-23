export type ScenarioAction = { press: string } | { type: string } | { selectCell: [number, number] };

export interface ScenarioStep {
  id: string;
  action: ScenarioAction;
  expect: string[][];
  after?: { visible: string } | { hidden: string };
  note?: string;
}

export interface Scenario {
  schema: number;
  id: string;
  surface: string;
  fixture: string;
  query?: string;
  setup?: ScenarioAction[];
  steps: ScenarioStep[];
}

export const SCENARIO_SCHEMA: number;
export const SCENARIO_FILE_SUFFIX: string;
export const ACTIONS: readonly string[];
export const PRESS_MODIFIERS: readonly string[];
export const PRESS_KEYS: readonly string[];
export const PRESS_PATTERN: RegExp;
export function validateScenario(doc: unknown, options?: { fixtures?: string[]; fileName?: string }): string[];
export function loadScenarios(directory: string, options?: { fixtures?: string[] }):
  { fileName: string; scenario: Scenario | null; problems: string[] }[];
export function scenarioUrl(scenario: Pick<Scenario, 'fixture' | 'query'>, options?: { theme?: string; bundle?: string }): string;
