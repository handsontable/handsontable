export const TREE_CHECK: string;
export const TREE_CRITERIA: string[];

export interface TreeNode {
  id: string;
  role: string;
  name: string;
  parent: string | null;
  region: string;
  tag: string;
  attrs: Record<string, string>;
  focusable: boolean;
  /** The states written after the name (`checked`, `expanded=false`, `level=2`). */
  states?: string[];
  /** The value of a text field or a range. */
  value?: string;
  /** The root the node was read from (the grid or one portal), so the snapshot writes one header per root. */
  root?: string;
}

type TreeFinding = {
  kind: string;
  criteria: string[];
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'advisory';
  reason: string;
  selector?: string;
  step?: string;
  measured?: Record<string, unknown>;
};

export function gridRows(nodes: TreeNode[]): Array<{ id: string; rowindex: number | null; group: string | null; head: boolean; grid: string | null; cells: TreeNode[] }>;
export function structureFindings(nodes: TreeNode[]): TreeFinding[];
export function nameFindings(nodes: TreeNode[]): TreeFinding[];
export function diffSnapshot(expected: string, actual: string): { line: number; expected: string | null; actual: string | null; expectedLines: number; actualLines: number } | null;
export function serializeTree(nodes: TreeNode[]): string;
export function maskSnapshot(snapshot: string, run?: { origin?: string | null; version?: string | null }): string;
