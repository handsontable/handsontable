/**
 * Re-exports of core settings types for external consumers.
 * Wrappers and user code can import from 'handsontable/settings'.
 */
import type Handsontable from './base';
import type { CommentObject } from './plugins/comments';
import type { FiltersColumnSettings } from './plugins/filters';
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

/**
 * The function shape of the `columns[].data` option. Called with the source row alone to read the
 * cell value, and with the source row and a value to write it.
 */
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

export type {
  GridSettings,
  SourceDataValidatorFn,
  SanitizerContext,
  TextExtractorContext,
  PasteClipboardData,
} from './core/settings';

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
 * The names of the hook callbacks that `GridSettings` declares: every `before*`, `after*` and
 * `modify*` option, plus the few hooks that do not follow that naming (`construct`, `init`,
 * `hasExternalDataSource`, `dialogFocusNextElement`, `dialogFocusPreviousElement`).
 *
 * Derived from the keys rather than from the callback shape, because options such as `renderer`,
 * `validator`, and `cells` are functions too but are not hooks. The `hookSettingKeys` unit test keeps
 * this in step with `REGISTERED_HOOKS`.
 */
export type HookSettingKey = Extract<
  keyof RemoveIndexSignature<GridSettings>,
  `before${string}` | `after${string}` | `modify${string}` | 'construct' | 'init' | 'hasExternalDataSource' |
  'dialogFocusNextElement' | 'dialogFocusPreviousElement'
>;

/**
 * Removes the hook callbacks from a settings type. Hooks run from the grid-level settings only, so a
 * column-level type must not offer them.
 *
 * Pass a type whose index signature is already stripped (see `RemoveIndexSignature`). Like that helper,
 * it lives in core because the wrappers' declaration compiler predates the `as` key remapping.
 */
export type OmitHooks<T> = {
  [K in keyof T as K extends HookSettingKey ? never : K]: T[K]
};

/**
 * Column settings inherit grid settings but overload the meaning of `data` to be specific to each column.
 *
 * The base type is `RemoveIndexSignature<GridSettings>`, not `GridSettings` itself: `Omit` over a type
 * with a string index signature collapses every named option into the bare signature (all reads become
 * `any`, autocomplete disappears). Stripping first keeps each option's real type — `readOnly` resolves
 * to `boolean`, `checkedTemplate` to `unknown`, and so on — through `ColumnSettings`, `CellMeta`, and
 * `CellProperties`. The `_strippedWidthTyped`/`_columnNamedOptionsTyped` type tests guard this.
 */
export interface ColumnSettings extends Omit<RemoveIndexSignature<GridSettings>, 'data'> {
  // Keeps column and cell meta extensible with arbitrary plugin keys. Declared here with the SAME
  // value type as the `[key: string]: any` on `GridSettings` — the base signature no longer reaches
  // this type once `RemoveIndexSignature` strips it. NOTE: never change this to `unknown`; two
  // signatures with different value types in one prototype chain make TypeScript drop the `this`
  // binding on nested `handsontable.getValue` — contextual typing widens `this` to `{}`. The
  // `_hotColumnGetValueFn` type test guards against that.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  data?: string | number | ColumnDataGetterSetterFunction;
  // `false` hides that column's filter UI, and an object carries the column's own
  // `availableConditions`. The other grid-level settings are ignored there, so they are not accepted.
  filters?: boolean | FiltersColumnSettings;
}

/**
 * Additional cell-specific meta data.
 *
 * `filters` is re-declared with the GRID type: `ColumnSettings` narrows it to `boolean` for what a
 * user may WRITE per column, but cell meta inherits the grid-level value through the prototype
 * chain, so a read can return the `FiltersSettings` object. An extending interface cannot widen a
 * property, hence the `Omit` - over `RemoveIndexSignature`, for the reason `ColumnSettings` gives.
 */
export interface CellMeta extends Omit<RemoveIndexSignature<ColumnSettings>, 'filters'> {
  // Same signature as on `ColumnSettings`, which `RemoveIndexSignature` strips; see the NOTE there.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  filters?: GridSettings['filters'];
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
