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

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['columnSorting']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let sorting: Handsontable.plugins.ColumnSorting.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let menu: Handsontable.plugins.ContextMenu.Settings;

// TODO(handsontable-codemod 18.0.0/ns-plugin-settings): Use `GridSettings['undo']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let undo: Handsontable.plugins.UndoRedo.Settings;

// TODO(handsontable-codemod 18.0.0/ns-boolean-settings): Use `boolean`. `GridSettings` has no typed key for this option in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let touch: Handsontable.plugins.TouchScroll.Settings;

// TODO(handsontable-codemod 18.0.0/ns-numericformatoptions): Removed in 18.0, so use `Intl.NumberFormatOptions` instead. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let numeric: Handsontable.NumericFormatOptions;

export let provider: DataProviderFetchOptions;

export let hot: Handsontable.Core;

export const mapper = new IndexMapper();

export let mapperType: IndexMapper;

// TODO(handsontable-codemod 18.0.0/ns-eventmanager): There is no public type for EventManager in 18.0, and using it fails with TS18046. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export const manager = new Handsontable.EventManager(hot);

// TODO(handsontable-codemod 18.0.0/ns-notification-settings): Use `boolean | NotificationConfig` (from 'handsontable/plugins/notification').`GridSettings` has... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let notice: Handsontable.plugins.Notification.Settings;
