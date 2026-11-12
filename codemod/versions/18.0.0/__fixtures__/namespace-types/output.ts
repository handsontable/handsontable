import type { CellCoords, SelectOptionsObject, ThemeConfig } from 'handsontable';
import type { BorderSettings } from 'handsontable/plugins/customBorders';
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

export let borders: BorderSettings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['columnSorting']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
export let sorting: Handsontable.plugins.ColumnSorting.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
export let menu: Handsontable.plugins.ContextMenu.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['undo']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
export let undo: Handsontable.plugins.UndoRedo.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): The TouchScroll plugin has no typed option in 18.0, so there is no replacement type. Use `GridSettings`, which accepts any key, or read the settings from the plugin instance.
export let touch: Handsontable.plugins.TouchScroll.Settings;

// TODO(handsontable-codemod 18.0.0/ns-numericformatoptions): Removed in 18.0 with no replacement. The `numericFormat` option is typed `object`. Use `Intl.NumberFormatOptions`. The Numbro.js `pattern` and `culture` keys no longer apply.
export let numeric: Handsontable.NumericFormatOptions;

export let provider: DataProviderFetchOptions;

export let hot: Handsontable.Core;

export const mapper = new IndexMapper();

export let mapperType: IndexMapper;

// TODO(handsontable-codemod 18.0.0/ns-eventmanager): Removed from the Handsontable typings in 18.0. It is not public API. The runtime still sets Handsontable.EventManager, so JavaScript code keeps working.
export const manager = new Handsontable.EventManager(hot);
