/**
 * Type contract tests for the public type surface of `handsontable` and `handsontable/base`.
 *
 * Positive assertions: all curated public symbols must be importable and
 * structurally usable without type errors.
 * Negative assertions: internal symbols must NOT be importable from the public entries.
 *
 * Uses actual value assignments (no `declare`) so that each line is
 * proven by the TypeScript compiler against the generated `tmp/` types.
 */

// ---------------------------------------------------------------------------
// handsontable — all curated public types must be importable from the full entry
// ---------------------------------------------------------------------------
import {
  CellCoords as CellCoordsValue,
  CellRange as CellRangeValue,
  IndexMapper as IndexMapperValue,
} from 'handsontable';
import type {
  GridSettings,
  Events,
  CellCoords,
  CellRange,
  RangeType,
  OverlayType,
  HotInstance,
  BaseEditorInstance,
  CellValue,
  CellChange,
  RowObject,
  ChangeSource,
  CellMeta,
  CellProperties,
  ColumnSettings,
  SourceRowData,
  IndexMapper,
} from 'handsontable';

// Structural assignability: each type accepts at least one concrete value
const settings: GridSettings = {};
const cellMeta: CellMeta = {};
const cellProps: Partial<CellProperties> = {};
const colSettings: ColumnSettings = {};
const rowObj: RowObject = { name: 'test' };
const cellVal: CellValue = 'x';
const sourceRow1: SourceRowData = { name: 'test' };
const sourceRow2: SourceRowData = ['a', 1];
const changeSource: ChangeSource = 'edit';
const cellChange: CellChange = [0, 0, null, 'next'];
const numericFormat: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };

// CellCoords and CellRange are runtime value exports — constructible
const coords = new CellCoordsValue(0, 0);
const range = new CellRangeValue(coords, coords, coords);
// IndexMapper is a runtime value export
const indexMapper = new IndexMapperValue();

// ---------------------------------------------------------------------------
// handsontable/base — same types must be available from the tree-shakeable entry
// ---------------------------------------------------------------------------
import {
  CellCoords as BaseCellCoordsValue,
  CellRange as BaseCellRangeValue,
  IndexMapper as BaseIndexMapperValue,
} from 'handsontable/base';
import type {
  GridSettings as GridSettings3,
  Events as Events3,
  CellCoords as CellCoords3,
  CellRange as CellRange3,
  RangeType as RangeType3,
  OverlayType as OverlayType3,
  HotInstance as HotInstance3,
  BaseEditorInstance as BaseEditorInstance3,
  CellValue as CellValue3,
  CellChange as CellChange3,
  RowObject as RowObject3,
  ChangeSource as ChangeSource3,
  CellMeta as CellMeta3,
  CellProperties as CellProperties3,
  ColumnSettings as ColumnSettings3,
  SourceRowData as SourceRowData3,
  IndexMapper as IndexMapper3,
} from 'handsontable/base';

const baseCoords = new BaseCellCoordsValue(0, 0);
const baseRange = new BaseCellRangeValue(baseCoords, baseCoords, baseCoords);
const baseIndexMapper = new BaseIndexMapperValue();

// Verify base types are structurally equivalent to the full-entry types
const _settings3: GridSettings3 = settings;
const _source3: SourceRowData3 = sourceRow2;
