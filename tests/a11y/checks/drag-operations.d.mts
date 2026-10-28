import type { DragState, Step } from './drag-runner';

export interface DragAlternative {
  input: 'single-pointer' | 'keyboard' | 'pointer-modifier';
  covers: 'full' | 'partial';
  how: string;
  steps: Step[];
  prepare?: Step[];
}

export interface DragOperation {
  id: string;
  plugin: string;
  gesture: 'drag' | 'path' | 'multipoint';
  operation: string;
  page?: string;
  fixture?: string;
  query?: string;
  expect: string;
  compare?: keyof DragState;
  drag: Step[];
  alternatives: DragAlternative[];
}

export const DRAG_OPERATIONS: DragOperation[];
export const NOT_DRAG: Record<string, string>;
