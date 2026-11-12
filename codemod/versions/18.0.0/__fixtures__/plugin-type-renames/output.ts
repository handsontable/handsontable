import { ColumnSorting, ColumnSortingConfig } from 'handsontable/plugins/columnSorting';
import type { ColumnSortingConfig as MultiConfig } from 'handsontable/plugins/columnSorting';
import type { SummaryEndpoint } from 'handsontable/plugins/columnSummary';
import type { UndoRedoAction as UndoAction } from 'handsontable/plugins/undoRedo';
import type { RangeType } from 'handsontable';
import type { NestedHeaderSettings } from 'handsontable/plugins/nestedHeaders';
import { arAR } from 'handsontable/i18n';
import { ExportFileSettings as ExportSettings } from 'handsontable/plugins/exportFile';
import Handsontable from 'handsontable';

export function sortBy(plugin: ColumnSorting, config: ColumnSortingConfig, other: MultiConfig): ColumnSortingConfig[] {
  plugin.sort([config, other]);

  return [config];
}

export function shadowed(Config: number): number {
  return Config + 1;
}

export function lastRow(endpoint: SummaryEndpoint): number {
  return endpoint.destinationRow ?? 0;
}

export const lastAction: UndoAction | null = null;

export const copied: RangeType = { startRow: 0, startCol: 0, endRow: 1, endCol: 1 };

export const header: NestedHeaderSettings = { label: 'Orders', colspan: 2 };

export const exportSettings: ExportSettings = {};

Handsontable.languages.registerLanguageDictionary(arAR);
