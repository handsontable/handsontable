import numbro from 'numbro';

// These types represent default known values, but users can extend with their own, leading to the need for assertions.
// Using type arguments (ex `_GridSettings<CellValue, CellType, SourceData>`) would solve this and provide very strict
// type-checking, but adds a lot of noise for no benefit in the most common use cases.

/**
 * A cell value, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
 */
export type CellValue = any;

/**
 * A cell change represented by `[row, column, prevValue, nextValue]`.
 */
export type CellChange = [number, string | number, CellValue, CellValue];

/**
 * A row object, one of the two ways to supply data to the table, the alternative being an array of values.
 * Row objects can have any data assigned to them, not just column data, and can define a `__children` array for nested rows.
 */
export interface RowObject {
  [prop: string]: any;
}

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

export interface SimpleCellCoords {
  row: number;
  col: number;
}

export interface RangeType {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

/**
 * The default sources for which the table triggers hooks.
 */
export type ChangeSource = 'auto' | 'edit' | 'loadData' | 'populateFromArray' | 'spliceCol' |
                           'spliceRow' | 'timeValidate' | 'dateValidate' | 'validateCells' |
                           'Autofill.fill' | 'ContextMenu.clearColumns' | 'ContextMenu.columnLeft' |
                           'ContextMenu.columnRight' | 'ContextMenu.removeColumn' |
                           'ContextMenu.removeRow' | 'ContextMenu.rowAbove' | 'ContextMenu.rowBelow' |
                           'CopyPaste.paste' | 'UndoRedo.redo' | 'UndoRedo.undo' | 'ColumnSummary.set' |
                           'ColumnSummary.reset';

export interface LabelOptions {
  property?: string;
  position?: 'before' | 'after';
  value?: string | (() => string);
}

export interface NumericFormatOptions {
  pattern: string | numbro.Format;
  culture?: string;
}

export interface ColumnDataGetterSetterFunction {
  (row: RowObject | CellValue[]): CellValue;
  (row: RowObject | CellValue[], value: CellValue): void;
}
