import Handsontable from 'handsontable';

interface CellRange {
  label: string;
}

export let coords: Handsontable.CellCoords;

export const range = new Handsontable.CellRange(new Handsontable.CellCoords(0, 0), new Handsontable.CellCoords(1, 1));

export let area: Handsontable.CellRange;

export type Constructor = typeof Handsontable.CellCoords;

export function pick(options: Handsontable.SelectOptionsObject, theme: Handsontable.ThemeConfig): Handsontable.GridSettings {
  return { data: [[options, theme]] };
}

export interface Marker extends Handsontable.CellCoords {
  label: string;
}

export let borders: Handsontable.plugins.CustomBorders.BorderOptions;

export let sorting: Handsontable.plugins.ColumnSorting.Settings;

export let menu: Handsontable.plugins.ContextMenu.Settings;

export let undo: Handsontable.plugins.UndoRedo.Settings;

export let touch: Handsontable.plugins.TouchScroll.Settings;

export let numeric: Handsontable.NumericFormatOptions;

export let provider: Handsontable.plugins.DataProvider.Options;

export let hot: Handsontable.Core;

export const mapper = new Handsontable.RecordTranslation.IndexMapper();

export let mapperType: Handsontable.RecordTranslation.IndexMapper;

export const manager = new Handsontable.EventManager(hot);

export let notice: Handsontable.plugins.Notification.Settings;
