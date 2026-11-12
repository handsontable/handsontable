import { ColumnSorting, Config } from 'handsontable/plugins/columnSorting';
import type { Config as MultiConfig } from 'handsontable/plugins/multiColumnSorting';
import type { Endpoint } from 'handsontable/plugins/columnSummary';
import type { Action as UndoAction } from 'handsontable/plugins/undoRedo';
import type { RangeType } from 'handsontable/plugins/copyPaste';
import type { DetailedSettings } from 'handsontable/plugins/nestedHeaders';
import { arAr } from 'handsontable/i18n';
import { Settings as ExportSettings } from 'handsontable/plugins/exportFile';
import Handsontable from 'handsontable';

export function sortBy(plugin: ColumnSorting, config: Config, other: MultiConfig): Config[] {
  plugin.sort([config, other]);

  return [config];
}

export function shadowed(Config: number): number {
  return Config + 1;
}

export function lastRow(endpoint: Endpoint): number {
  return endpoint.destinationRow ?? 0;
}

export const lastAction: UndoAction | null = null;

export const copied: RangeType = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 };

export const header: DetailedSettings = { label: 'Orders', colspan: 2 };

export const exportSettings: ExportSettings = {};

Handsontable.languages.registerLanguageDictionary(arAr);
