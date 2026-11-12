import type { CellCoords, SelectOptionsObject, ThemeConfig } from 'handsontable';
import type { DataProviderFetchOptions } from 'handsontable/plugins/dataProvider';
import Handsontable, { IndexMapper } from 'handsontable';

interface CellRange {
  label: string;
}

export let coords: CellCoords;

export const range = new Handsontable.CellRange(new Handsontable.CellCoords(0, 0), new Handsontable.CellCoords(1, 1));

export let area: Handsontable.CellRange;

export type Constructor = typeof Handsontable.CellCoords;

export function pick(options: SelectOptionsObject, theme: ThemeConfig): Handsontable.GridSettings {
  return { data: [[options, theme]] };
}

export interface Marker extends CellCoords {
  label: string;
}

// TODO(handsontable-codemod 18.0.0/ns-customborders-borderoptions): Use BorderSettings from "handsontable/plugins/customBorders" instead.
export let borders: Handsontable.plugins.CustomBorders.BorderOptions;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['columnSorting']` (import type { GridSettings } from 'handsontable').
export let sorting: Handsontable.plugins.ColumnSorting.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable').
export let menu: Handsontable.plugins.ContextMenu.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['undo']` (import type { GridSettings } from 'handsontable').
export let undo: Handsontable.plugins.UndoRedo.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): The TouchScroll plugin has no typed option in 18.0, so there is no replacement type.
export let touch: Handsontable.plugins.TouchScroll.Settings;

// TODO(handsontable-codemod 18.0.0/ns-numericformatoptions): Removed in 18.0, so use `Intl.NumberFormatOptions` instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
export let numeric: Handsontable.NumericFormatOptions;

export let provider: DataProviderFetchOptions;

export let hot: Handsontable.Core;

export const mapper = new IndexMapper();

export let mapperType: IndexMapper;

// TODO(handsontable-codemod 18.0.0/ns-eventmanager): Not public API, and removed from the Handsontable typings in 18.0.
export const manager = new Handsontable.EventManager(hot);
