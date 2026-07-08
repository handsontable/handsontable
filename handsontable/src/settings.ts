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
 * A cell change represented by `[row, prop, oldValue, newValue]`.
 * `prop` is a property name, a column index, or a {@link ColumnDataGetterSetterFunction} when
 * `columns[].data` is a function.
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
 * Removes the `[key: string]: any` / `[key: number]: any` index signature from a type while keeping
 * every named property.
 *
 * `GridSettings` carries a broad index signature so that arbitrary plugin/meta keys are allowed. That
 * signature widens `keyof GridSettings` to `string | number`, which makes `Omit`/`Pick` collapse to a
 * bare index signature and drop every named option. Stripping it first keeps the named options — and
 * their IDE autocomplete — intact through such transforms.
 */
export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
};

/**
 * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
 */
export interface ColumnSettings extends Omit<RemoveIndexSignature<GridSettings>, 'data'> {
  data?: string | number | ColumnDataGetterSetterFunction;

  // The named grid options above come from `RemoveIndexSignature<GridSettings>` so that `Omit` keeps
  // them (and their IDE autocomplete) instead of collapsing to a bare index signature.
  //
  // The index signature below must stay `any` — the exact value type inherited from `GridSettings`.
  // A `[key: string]: unknown` here makes TypeScript drop the `this` binding on nested
  // `handsontable.getValue` (contextual typing widens `this` to `{}`). The `_hotColumnGetValueFn`
  // type test guards against changing it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
