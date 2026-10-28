export const POINTER_CHECK: string;
export const POINTER_CRITERIA: string[];
export const GESTURES: string[];
export const INPUTS: string[];
export const DRAG_FIELDS: string[];
export const DRAG_INVENTORY_FILE: string;

type Finding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
  file?: string;
  line?: number;
};
type Alternative = { input: string; covers: string; how: string };
type Operation = { id: string; plugin: string; operation: string; gesture: string; alternatives: Alternative[] };

export function actionEffects(effects: string[]): string[];
export function cancellationFindings(input: {
  target: { selector: string; name?: string };
  onPress: string[];
  afterAway: string[];
  onClick: string[];
}): { findings: Finding[]; measured: boolean };
export function dragFindings(input: { operation: Operation; proven: boolean[]; line?: number }): Finding[];
export function gestureFindings(input: { operation: Operation; proven: boolean[]; line?: number }): Finding[];
export function operationCriteria(operation: { gesture: string }): string[];
export function dragInventoryLines(source: string): Map<string, number>;
export function inventoryProblems(inventory: Operation[]): string[];
export function undeclaredPointerPlugins(input: {
  tracking: string[];
  inventory: Operation[];
  notDrag: Record<string, string>;
}): { missing: string[]; stale: string[] };
