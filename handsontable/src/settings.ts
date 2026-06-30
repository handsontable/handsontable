/**
 * Re-exports of core settings types for external consumers.
 * Wrappers and user code can import from 'handsontable/settings'.
 */
import type Handsontable from './base';
import type { CommentObject } from './plugins/comments';
import type { GridSettings } from './core/settings';
/**
 * A row object, one of the two ways to supply data to the table, the alternative being an array of values.
 * Row objects can have any data assigned to them, not just column data, and can define a `__children` array for nested rows.
 */
export interface RowObject {
  [prop: string]: unknown;
}

/**
 * A cell value, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
 */
export type CellValue = unknown;

/**
 * An object containing possible options to use in SelectEditor.
 */
export interface SelectOptionsObject {
  [prop: string]: string;
}

/**
 * A single row of source data, which can be represented as an array of values, or an object with key/value pairs.
 */
export type SourceRowData = RowObject | CellValue[];

export interface ColumnDataGetterSetterFunction {
  (row: RowObject | CellValue[]): CellValue;
  (row: RowObject | CellValue[], value: CellValue): void;
}

/**
 * A cell change represented by `[row, column, prevValue, nextValue]`.
 */
export type CellChange = [number, string | number | ColumnDataGetterSetterFunction, CellValue, CellValue];

/**
 * The default sources for which the table triggers hooks.
 */
export type ChangeSource = 'auto' | 'edit' | 'loadData' | 'updateData' | 'populateFromArray' | 'spliceCol' |
  'spliceRow' | 'timeValidate' | 'dateValidate' | 'validateCells' |
  'Autofill.fill' | 'ContextMenu.clearColumn' | 'ContextMenu.columnLeft' |
  'ContextMenu.columnRight' | 'ContextMenu.removeColumn' |
  'ContextMenu.removeRow' | 'ContextMenu.rowAbove' | 'ContextMenu.rowBelow' |
  'CopyPaste.paste' | 'CopyPaste.cut' | 'UndoRedo.redo' | 'UndoRedo.undo' | 'ColumnSummary.set' |
  'ColumnSummary.reset' | 'DataProvider.revert';

export type { GridSettings } from './core/settings';
/**
 * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
 */
export interface ColumnSettings extends Omit<GridSettings, 'data'> {
  data?: string | number | ColumnDataGetterSetterFunction;

  // NOTE: do not add a `[key: string]: unknown` index signature here. Column and cell meta is already
  // extensible with arbitrary keys through the `[key: string]: any` signature inherited from
  // `GridSettings`. A second index signature with a different value type (`unknown` vs the inherited
  // `any`) makes TypeScript drop the `this` binding on nested `handsontable.getValue` — contextual
  // typing widens `this` to `{}`. The `_hotColumnGetValueFn` type test guards against re-adding it.
}

/**
 * Additional cell-specific meta data.
 */
export interface CellMeta extends ColumnSettings {
  className?: string | string[];
  readOnly?: boolean;
  valid?: boolean;
  comment?: CommentObject;
  isSearchResult?: boolean;
  hidden?: boolean;
  skipRowOnPaste?: boolean;
}

/**
 * A rendered cell object with computed properties.
 */
export interface CellProperties extends CellMeta {
  row: number;
  col: number;
  instance: Handsontable;
  visualRow: number;
  visualCol: number;
  prop: string | number;
}
