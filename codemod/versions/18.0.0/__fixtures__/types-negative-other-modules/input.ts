import { HotTable } from '@handsontable/react-wrapper';
import * as Plugins from 'handsontable/plugins/columnSorting';
import type { CellValue, Settings, Config } from './grid-types';
import type { SimpleCellCoords } from 'other-grid/common';
import { Settings as SortSettings } from 'other-grid/plugins/columnSorting';

export * from 'handsontable';
export * from 'handsontable/plugins/columnSorting';

const core = require('handsontable');
const { Core } = require('handsontable/base');
const lazy = () => import('handsontable');

namespace Handsontable {
  export type CellCoords = { row: number; col: number };
  export type CellRange = { from: CellCoords; to: CellCoords };
}

export type Corner = Handsontable.CellCoords;

export type Span = Handsontable.CellRange;

export type Sorting = typeof Plugins.ColumnSorting;

export const sample: [CellValue, Settings, Config, SimpleCellCoords, SortSettings] | null = null;

export { HotTable, core, Core, lazy };
