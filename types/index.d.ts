import {
  CellType as HyperFormulaCellType,
  ConfigParams,
  HyperFormula,
} from 'hyperformula';
import { default as _CellCoords } from './3rdparty/walkontable/src/cell/coords';
import { default as _CellRange } from './3rdparty/walkontable/src/cell/range';
import { OverlayType } from './3rdparty/walkontable/src';
import Core from './core';
import {
  GridSettings as _GridSettings,
  ColumnSettings as _ColumnSettings,
  CellSettings as _CellSettings,
  CellMeta as _CellMeta,
  CellProperties as _CellProperties,
} from './settings';

import {
  CellValue as _CellValue,
} from './common';

// import { AutoColumnSize as AutoColumnSizePlugin } from './plugins/autoColumnSize';
// import { Autofill as AutofillPlugin } from './plugins/autofill';
// import { AutoRowSize as AutoRowSizePlugin } from './plugins/autoRowSize';
// import { BasePlugin } from './plugins/base';
// import { BindRowsWithHeaders as BindRowsWithHeadersPlugin } from './plugins/bindRowsWithHeaders';
// import { CollapsibleColumns as CollapsibleColumnsPlugin } from './plugins/collapsibleColumns';
// import { ColumnSorting as ColumnSortingPlugin } from './plugins/columnSorting';
// import { ColumnSummary as ColumnSummaryPlugin } from './plugins/columnSummary';

/**
 * @internal
 * Omit properties K from T
 */
type Omit<T, K extends keyof T> = Pick<T, ({ [P in keyof T]: P } & { [P in K]: never } & { [x: string]: never, [x: number]: never })[keyof T]>;
// type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>; // TS >= 2.8

declare namespace Handsontable {

  // These types represent default known values, but users can extend with their own, leading to the need for assertions.
  // Using type arguments (ex `_GridSettings<CellValue, CellType, SourceData>`) would solve this and provide very strict
  // type-checking, but adds a lot of noise for no benefit in the most common use cases.

  /**
   * A cell value, which can be anything to support custom cell data types, but by default is `string | number | boolean | undefined`.
   */
  type CellValue = any;


  /**
   * A cell change represented by `[row, column, prevValue, nextValue]`.
   */
  type CellChange = [number, string | number, CellValue, CellValue];

  /**
   * A row object, one of the two ways to supply data to the table, the alternative being an array of values.
   * Row objects can have any data assigned to them, not just column data, and can define a `__children` array for nested rows.
   */
  type RowObject = { [prop: string]: any };

  /**
   * An object containing possible options to use in SelectEditor.
   */
  type SelectOptionsObject = { [prop: string]: string };

  /**
   * A single row of source data, which can be represented as an array of values, or an object with key/value pairs.
   */
  type SourceRowData = RowObject | CellValue[];

  /**
   * The default sources for which the table triggers hooks.
   */
  type ChangeSource = 'auto' | 'edit' | 'loadData' | 'populateFromArray' | 'spliceCol' | 'spliceRow' | 'timeValidate' | 'dateValidate' | 'validateCells' | 'Autofill.fill' | 'ContextMenu.clearColumns' | 'ContextMenu.columnLeft' | 'ContextMenu.columnRight' | 'ContextMenu.removeColumn' | 'ContextMenu.removeRow' | 'ContextMenu.rowAbove' | 'ContextMenu.rowBelow' | 'CopyPaste.paste' | 'UndoRedo.redo' | 'UndoRedo.undo' | 'ColumnSummary.set' | 'ColumnSummary.reset';
  /**
   * The default cell type aliases the table has built-in.
   */
  type CellType = 'autocomplete' | 'checkbox' | 'date' | 'dropdown' | 'handsontable' | 'numeric' | 'password' | 'text' | 'time';

  /**
   * The default editor aliases the table has built-in.
   */
  type EditorType = 'autocomplete' | 'checkbox' | 'date' | 'dropdown' | 'handsontable' | 'mobile' | 'password' | 'select' | 'text';

  /**
   * The default renderer aliases the table has built-in.
   */
  type RendererType = 'autocomplete' | 'checkbox' | 'html' | 'numeric' | 'password' | 'text';

  /**
   * The default validator aliases the table has built-in.
   */
  type ValidatorType = 'autocomplete' | 'date' | 'numeric' | 'time';

  interface GridSettings extends _GridSettings {};
  interface CellProperties extends _CellProperties {};
  interface CellMeta extends _CellMeta {};
}

declare class Handsontable extends Core {
  static baseVersion: string;
  static buildDate: string;
  static packageName: 'handsontable';
  static version: string;
  // static cellTypes: Handsontable.CellTypes;
  // static languages: Handsontable.I18n.Internationalization;
  // static dom: Handsontable.Dom;
  // static editors: Handsontable.Editors;
  // static helper: Handsontable.Helper;
  // static hooks: Handsontable.Hooks.Methods;
  // static plugins: Handsontable.Plugins;
  // static renderers: Handsontable.Renderers;
  // static validators: Handsontable.Validators;
  static Core: typeof Core;
  // static EventManager: Handsontable.EventManager;
  static DefaultSettings: _GridSettings;
}

export default Handsontable;
