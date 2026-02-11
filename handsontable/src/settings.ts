/**
 * Re-exports of core settings types for external consumers.
 * Wrappers and user code can import from 'handsontable/settings'.
 */
export type { GridSettings } from './common';

export type ColumnSettings = Record<string, unknown>;
export type CellProperties = Record<string, unknown>;
