import type { HotInstance } from '../../core/types';
import { extractText } from '../../utils/textExtractor';
import { normalizeExportOptions, expandNestedHeaderLayers } from './utils';
import { toFormulaLiteral, toOoxmlErrorCode } from './types/xlsx/formula-utils';
import type { SummaryEndpoint } from '../columnSummary/columnSummary';

interface MergeCellDescriptor {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

interface NestedHeaderTreeNodeData {
  columnIndex: number;
  origColspan: number;
  headerClassNames: string[];
  label: string;
}

interface NestedHeaderSettings {
  isRoot: boolean;
  colspan: number;
  headerClassNames: string[];
  label: string;
}

type NestedHeadersPluginWithState = {
  getStateManager(): { getHeaderTreeNodeData(layer: number, col: number): NestedHeaderTreeNodeData | null | undefined };
};

type NestedHeadersPluginWithSettings = {
  getHeaderSettings(layer: number, col: number): NestedHeaderSettings | null | undefined;
};

/**
 * The size of the array a formula spills, in cells, as `ExportDataProvider#getArrayFormulaSizes()`
 * reports it.
 */
export interface ArrayFormulaSize {
  rows: number;
  cols: number;
  exported: boolean;
}

/**
 * The cell address HyperFormula takes.
 */
interface EngineCellAddress {
  sheet: number;
  row: number;
  col: number;
}

/**
 * Reads the exact size of the array whose master sits at `address` from HyperFormula's array
 * mapping. The mapping is `@internal` in HyperFormula (3.3.0 answers an `ArrayFormulaVertex` with
 * `width` and `height`), so every step is duck-typed and anything unexpected answers `null`.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {object} address The master's engine address.
 * @returns {{ rows: number, cols: number }|null}
 */
function readMappedArraySize(engine: object, address: EngineCellAddress): { rows: number; cols: number } | null {
  const { arrayMapping } = engine as { arrayMapping?: { getArrayByCorner?: unknown } };

  if (typeof arrayMapping?.getArrayByCorner !== 'function') {
    return null;
  }

  const vertex = (arrayMapping.getArrayByCorner as (address: EngineCellAddress) => unknown).call(arrayMapping, address);
  const { width, height } = (vertex ?? {}) as { width?: unknown; height?: unknown };

  if (typeof width !== 'number' || typeof height !== 'number' || width < 1 || height < 1) {
    return null;
  }

  return { rows: height, cols: width };
}

/**
 * Estimates the size of the array whose master sits at `address` by walking right, then down, over
 * the cells the engine types `ARRAY`. The fallback for `readMappedArraySize()`; it can
 * over-count when another array spills next to the master.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {object} address The master's engine address.
 * @returns {{ rows: number, cols: number }}
 */
function walkArraySize(
  engine: {
    getCellType(address: EngineCellAddress): unknown;
    getSheetDimensions(sheetId: number): { width: number; height: number };
  },
  address: EngineCellAddress
): { rows: number; cols: number } {
  const { sheet, row, col } = address;
  const { width, height } = engine.getSheetDimensions(sheet);
  const isSpilled = (r: number, c: number) => engine.getCellType({ sheet, row: r, col: c }) === 'ARRAY';
  let cols = 1;
  let rows = 1;

  while (col + cols < width && isSpilled(row, col + cols)) {
    cols += 1;
  }

  while (row + rows < height && isSpilled(row + rows, col)) {
    rows += 1;
  }

  return { rows, cols };
}

/**
 * Whether the engine indexes `hfStart … hfStart + length - 1` of one axis land, in that order, on
 * consecutive positions of the exported matrix, starting at the master's own position.
 *
 * @param {object} syncer The Formulas plugin's syncer of the axis.
 * @param {number} hfStart The master's engine index.
 * @param {number} length The spill length along the axis.
 * @param {Map<number, number>} positions Visual index to exported position.
 * @param {number} visualStart The master's visual index.
 * @returns {boolean}
 */
function spillsInPlace(
  syncer: { getVisualIndexFromHfIndex(hfIndex: number): number },
  hfStart: number, length: number, positions: Map<number, number>, visualStart: number
): boolean {
  const start = positions.get(visualStart);

  if (start === undefined) {
    return false;
  }

  for (let offset = 1; offset < length; offset++) {
    if (positions.get(syncer.getVisualIndexFromHfIndex(hfStart + offset)) !== start + offset) {
      return false;
    }
  }

  return true;
}

/**
 * @private
 */
class ExportDataProvider {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  declare hot: HotInstance;
  /**
   * Format type class options.
   *
   * @type {object}
   */
  options: Record<string, unknown> = {};

  /**
   * Initializes the data provider with a reference to the Handsontable instance used to retrieve data for export.
   */
  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
  }

  /**
   * Set options for data provider.
   *
   * @param {object} options Object with specified options.
   */
  setOptions(options: Record<string, unknown>) {
    this.options = normalizeExportOptions(options);
  }

  /**
   * Builds a 2D array by calling `getCellValue(rowIndex, colIndex)` for every visible
   * cell in the export range, honouring hidden-row and hidden-column exclusions.
   *
   * @private
   * @param {Function} getCellValue Called for each visible cell; its return value is
   *   pushed into the row array.
   * @returns {Array[]}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _extractDataMatrix<T = any>(getCellValue: (row: number, col: number) => T): T[][] {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const data = [];

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (options.exportHiddenRows === false && this._isHiddenRow(rowIndex)) {
        continue;
      }

      const row = [];

      for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
        if (options.exportHiddenColumns === false && this._isHiddenColumn(colIndex)) {
          continue;
        }
        row.push(getCellValue(rowIndex, colIndex));
      }

      data.push(row);
    }

    return data;
  }

  /**
   * Get table data based on provided settings to the class constructor.
   *
   * @returns {Array}
   */
  getData() {
    return this._extractDataMatrix((row: number, col: number) => this.hot.getDataAtCell(row, col));
  }

  /**
   * Gets list of row headers.
   *
   * @returns {Array}
   */
  getRowHeaders(): Array<string | number | null> {
    const headers: Array<string | number | null> = [];

    if (this.options.rowHeaders) {
      const { startRow, endRow } = this._getDataRange();
      const rowHeaders = this.hot.getRowHeader() as Array<string | number | null>;

      for (let row = startRow; row <= endRow; row++) {
        if (this.options.exportHiddenRows === false && this._isHiddenRow(row)) {
          continue;
        }
        headers.push(extractText(this.hot, rowHeaders[row], 'ExportFile.rowHeader'));
      }
    }

    return headers;
  }

  /**
   * Gets list of columns headers.
   *
   * @returns {Array}
   */
  getColumnHeaders() {
    const headers: string[] = [];

    if (this.options.colHeaders) {
      const { startCol, endCol } = this._getDataRange();
      const colHeaders = this.hot.getColHeader();

      for (let column = startCol; column <= endCol; column++) {
        if (this.options.exportHiddenColumns === false && this._isHiddenColumn(column)) {
          continue;
        }
        headers.push(extractText(this.hot, colHeaders[column], 'ExportFile.columnHeader'));
      }
    }

    return headers;
  }

  /**
   * Gets the column header rows for a text format, top header layer first.
   *
   * With the NestedHeaders plugin enabled, every header layer becomes one row and a group label is
   * repeated once per column it spans, so the rows have the same column count as the data. Without
   * the plugin the single row is the bottom-most header list from {@link ExportDataProvider#getColumnHeaders}.
   *
   * Hidden-column and range handling follow {@link ExportDataProvider#getNestedColumnHeaders}: a group
   * shrinks to its exported columns, and a column whose group root lies before the range start gets
   * an empty label on that layer.
   *
   * @returns {string[][]} One row per header layer, or an empty array when `colHeaders` is off.
   */
  getColumnHeaderRows(): string[][] {
    if (!this.options.colHeaders) {
      return [];
    }

    const nestedLayers = this.getNestedColumnHeaders();

    if (nestedLayers === null) {
      return [this.getColumnHeaders()];
    }

    return expandNestedHeaderLayers(nestedLayers);
  }

  /**
   * Get data range object based on settings provided in the class constructor.
   *
   * @private
   * @returns {object} Returns object with keys `startRow`, `startCol`, `endRow` and `endCol`.
   */
  _getDataRange() {
    const cols = this.hot.countCols() - 1;
    const rows = this.hot.countRows() - 1;
    let [startRow = 0, startCol = 0, endRow = rows, endCol = cols] =
      (this.options as Record<string, unknown>).range as number[];

    startRow = Math.max(startRow, 0);
    startCol = Math.max(startCol, 0);
    endRow = Math.min(endRow, rows);
    endCol = Math.min(endCol, cols);

    return { startRow, startCol, endRow, endCol };
  }

  /**
   * Get raw source data (formulas) based on provided settings to the class constructor.
   *
   * Mirrors {@link ExportDataProvider#getData} but uses `getSourceDataAtCell` so that cells
   * containing HyperFormula formulas return the raw formula string (e.g. `'=SUM(A1:A3)'`)
   * rather than the calculated value.
   *
   * The matrix is walked by visual index, while `getSourceDataAtCell` takes a physical row (and a
   * visual column), so the row is translated first. Without it, a sorted, moved, trimmed or
   * filtered grid paired a cell with another record's formula.
   *
   * @returns {Array}
   */
  getSourceData() {
    return this._extractDataMatrix((row, col) => this.hot.getSourceDataAtCell(this.hot.toPhysicalRow(row), col));
  }

  /**
   * Gets, for every cell of the export range, the OOXML error code of the value the Formulas
   * plugin's engine holds for it (`#DIV/0!` for `=1/0`), or `null` when the value is not an error
   * with such a code. Every entry is `null` when the Formulas plugin is absent or disabled.
   *
   * The answer comes from the engine's own cell value, not from the displayed text, which cannot
   * tell the error `#N/A` from the text a formula such as `="#N/A"` answers, and which the
   * engine's language translates. The XLSX export reads it with and without `exportFormulas`:
   * a formula exported live caches the code as its result, and any other cell whose value is an
   * error (a typed `#N/A`, or a formula exported as its value) is written as the code.
   *
   * @returns {Array[]}
   */
  getFormulaErrorCodes(): (string | null)[][] {
    const formulasPlugin = this.hot.getPlugin('formulas');
    const engine = formulasPlugin?.isEnabled() ? formulasPlugin.engine : null;
    const { sheetId, rowAxisSyncer, columnAxisSyncer } = formulasPlugin ?? {};

    if (!engine || sheetId === null || sheetId === undefined || !rowAxisSyncer || !columnAxisSyncer) {
      return this._extractDataMatrix(() => null);
    }

    return this._extractDataMatrix((row, col) => toOoxmlErrorCode(engine.getCellValue({
      sheet: sheetId,
      row: rowAxisSyncer.getHfIndexFromVisualIndex(row),
      col: columnAxisSyncer.getHfIndexFromVisualIndex(col),
    })));
  }

  /**
   * Gets the workbook-scoped named expressions of the Formulas plugin's engine, in the engine's
   * order, each with its definition: the formula text (`=Sheet1!$A$1:$A$3`), or, for a name defined
   * with a constant, that constant spelled as a formula literal (`5`, `"text"`, `TRUE()`). The
   * definition is `null` when the constant cannot be spelled. A name scoped to a sheet is left out.
   * Empty when the Formulas plugin is absent or disabled.
   *
   * @returns {Array<{ name: string, formula: string|null }>}
   */
  getNamedExpressions(): Array<{ name: string; formula: string | null }> {
    const formulasPlugin = this.hot.getPlugin('formulas');
    const engine = formulasPlugin?.isEnabled() ? formulasPlugin.engine : null;

    if (!engine) {
      return [];
    }

    return engine.listNamedExpressions().map((name: string) => {
      const formula = engine.getNamedExpressionFormula(name);

      return {
        name,
        formula: formula === undefined ? toFormulaLiteral(engine.getNamedExpressionValue?.(name)) : formula,
      };
    });
  }

  /**
   * Gets the Formulas plugin's engine and the name of the engine sheet it binds this grid to, or
   * `null` when the plugin is absent or disabled. Grids of one export may share an engine; the
   * engine object tells them apart.
   *
   * @returns {{ engine: object, sheetName: string }|null}
   */
  getFormulasBinding(): { engine: object; sheetName: string } | null {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin?.isEnabled() || !formulasPlugin.engine || formulasPlugin.sheetName === null) {
      return null;
    }

    return { engine: formulasPlugin.engine, sheetName: formulasPlugin.sheetName };
  }

  /**
   * Gets, for every cell of the export range, the size of the array the Formulas plugin's engine
   * spills from it, or `null` when the cell is not the master of an array (the engine types it
   * `ARRAYFORMULA`: a spilling function such as `SEQUENCE`, or `ARRAYFORMULA(…)`). Every entry is
   * `null` when the Formulas plugin is absent or disabled.
   *
   * HyperFormula has no public API for the spill range. The size is read from the engine's array
   * mapping (`arrayMapping.getArrayByCorner()`), which holds the exact size of every array. That
   * mapping is `@internal` in HyperFormula and may change between 3.x releases, so it is
   * duck-typed and, when it is missing or answers an unexpected shape, the size is estimated by
   * walking right, then down, from the master over the cells the engine types `ARRAY`, bounded by
   * the sheet's dimensions. The walk is only an estimate: a spilled cell next to the master can
   * belong to another array (a `=SEQUENCE(3)` in B1 spills into B2, right of a master in A2), so
   * it can over-count, and the export refuses a ref that overlaps an earlier one
   * (`types/xlsx.ts`). `isCellPartOfArray()` cannot drive the walk: it is `true` for a
   * neighboring array's master too.
   *
   * `exported` tells whether every spilled row and column lands in the exported matrix right
   * after the master, so the spill keeps its shape in the file. It is `false` when the spill
   * crosses a trimmed row, a hidden row or column the export leaves out, or the `range` edge.
   *
   * @returns {Array[]}
   */
  getArrayFormulaSizes(): (ArrayFormulaSize | null)[][] {
    const formulasPlugin = this.hot.getPlugin('formulas');
    const engine = formulasPlugin?.isEnabled() ? formulasPlugin.engine : null;
    const { sheetId, rowAxisSyncer, columnAxisSyncer } = formulasPlugin ?? {};

    if (!engine || sheetId === null || sheetId === undefined || !rowAxisSyncer || !columnAxisSyncer) {
      return this._extractDataMatrix(() => null);
    }

    const { startRow, endRow, startCol, endCol } = this._getDataRange();
    const exportedRows = this.#getExportedPositions(startRow, endRow, this.options.exportHiddenRows === false
      ? (row: number) => this._isHiddenRow(row) : () => false);
    const exportedCols = this.#getExportedPositions(startCol, endCol, this.options.exportHiddenColumns === false
      ? (col: number) => this._isHiddenColumn(col) : () => false);

    return this._extractDataMatrix((row, col) => {
      const address = {
        sheet: sheetId,
        row: rowAxisSyncer.getHfIndexFromVisualIndex(row),
        col: columnAxisSyncer.getHfIndexFromVisualIndex(col),
      };

      if (address.row < 0 || address.col < 0 || engine.getCellType(address) !== 'ARRAYFORMULA') {
        return null;
      }

      const { rows, cols } = readMappedArraySize(engine, address) ?? walkArraySize(engine, address);
      const hfRow = address.row;
      const hfCol = address.col;
      const exported = spillsInPlace(rowAxisSyncer, hfRow, rows, exportedRows, row)
        && spillsInPlace(columnAxisSyncer, hfCol, cols, exportedCols, col);

      return { rows, cols, exported };
    });
  }

  /**
   * Maps every visual index of one axis the exported matrix holds to its position in the matrix.
   *
   * @param {number} start The first visual index of the export range.
   * @param {number} end The last visual index of the export range.
   * @param {Function} isLeftOut Whether the export leaves a visual index out.
   * @returns {Map<number, number>}
   */
  #getExportedPositions(start: number, end: number, isLeftOut: (index: number) => boolean): Map<number, number> {
    const positions = new Map<number, number>();

    for (let index = start; index <= end; index++) {
      if (!isLeftOut(index)) {
        positions.set(index, positions.size);
      }
    }

    return positions;
  }

  /**
   * Returns the rows the exported data matrix leaves out, as the row indexes the formulas'
   * references use, so the formula normalizer can shift every reference below them up.
   *
   * With the Formulas plugin on, a reference names an engine row, and the engine keeps every row,
   * in the grid's order, trimmed and filtered-out ones included. The set then holds the engine
   * index of every row with no visual index (trimmed or filtered out, which the syncer answers with
   * `-1`), plus the hidden rows when
   * `exportHiddenRows` is `false`. Without the plugin, a formula is the text the user typed, so
   * only the hidden rows are left out, by physical index.
   *
   * @returns {Set<number>}
   */
  getExcludedHiddenRows(): Set<number> {
    const result = new Set<number>();
    const excludeHidden = this.options.exportHiddenRows === false;
    const rowAxisSyncer = this.#getEngineRowAxisSyncer();

    const { startRow, endRow } = this._getDataRange();
    const isExcludedHidden = (visualRow: number) => excludeHidden && visualRow >= startRow && visualRow <= endRow
      && this._isHiddenRow(visualRow);

    if (rowAxisSyncer) {
      const engineRows = this.hot.rowIndexMapper.getNumberOfIndexes();

      for (let hfRow = 0; hfRow < engineRows; hfRow++) {
        const visualRow = rowAxisSyncer.getVisualIndexFromHfIndex(hfRow);

        if (visualRow < 0 || isExcludedHidden(visualRow)) {
          result.add(hfRow);
        }
      }

      return result;
    }

    if (!excludeHidden) {
      return result;
    }

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (this._isHiddenRow(rowIndex)) {
        result.add(this.hot.toPhysicalRow(rowIndex));
      }
    }

    return result;
  }

  /**
   * Returns the Formulas plugin's row axis syncer when the plugin is on, or `null`.
   *
   * @returns {object|null}
   */
  #getEngineRowAxisSyncer(): { getVisualIndexFromHfIndex(hfIndex: number): number } | null {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin?.isEnabled() || !formulasPlugin.engine) {
      return null;
    }

    return formulasPlugin.rowAxisSyncer ?? null;
  }

  /**
   * Returns the set of physical HOT column indices that are hidden and excluded from the
   * exported data matrix (i.e. `exportHiddenColumns` is `false` and the column is hidden).
   *
   * Returns an empty set when `exportHiddenColumns` is `true` or `'hide'`, because in
   * those cases all columns are included in the data matrix and no formula-offset
   * adjustment is needed.
   *
   * Used by the formula normalizer to adjust per-reference column offsets when building
   * live Excel formulas from HyperFormula formula strings.
   *
   * @returns {Set<number>}
   */
  getExcludedHiddenColumns(): Set<number> {
    const result = new Set<number>();

    if (this.options.exportHiddenColumns !== false) {
      return result;
    }

    const { startCol, endCol } = this._getDataRange();

    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      if (this._isHiddenColumn(colIndex)) {
        result.add(this.hot.toPhysicalColumn(colIndex));
      }
    }

    return result;
  }

  /**
   * Returns the 0-based data-array row indices for rows that are hidden in
   * Handsontable and are included in the exported data matrix.
   *
   * Only returns a non-empty array when `exportHiddenRows` is `'hide'`.
   * When `true`, all rows are visible in Excel. When `false`, hidden rows
   * are omitted entirely and there is nothing to mark as hidden.
   *
   * @returns {number[]}
   */
  getHiddenRowDataIndices() {
    if (this.options.exportHiddenRows !== 'hide') {
      return [];
    }

    const { startRow, endRow } = this._getDataRange();
    const result = [];
    let dataIndex = 0;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (this._isHiddenRow(rowIndex)) {
        result.push(dataIndex);
      }
      dataIndex += 1;
    }

    return result;
  }

  /**
   * Returns the 0-based data-array column indices for columns that are hidden in
   * Handsontable and are included in the exported data matrix.
   *
   * Only returns a non-empty array when `exportHiddenColumns` is `'hide'`.
   * When `true`, all columns are visible in Excel. When `false`, hidden columns
   * are omitted entirely and there is nothing to mark as hidden.
   *
   * @returns {number[]}
   */
  getHiddenColumnDataIndices() {
    if (this.options.exportHiddenColumns !== 'hide') {
      return [];
    }

    const { startCol, endCol } = this._getDataRange();
    const result = [];
    let dataIndex = 0;

    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      if (this._isHiddenColumn(colIndex)) {
        result.push(dataIndex);
      }
      dataIndex += 1;
    }

    return result;
  }

  /**
   * Gets the function argument separator used by the HyperFormula engine, if active.
   *
   * Returns `','` when the Formulas plugin is absent or disabled, since that is the
   * separator OOXML (Excel) always expects.
   *
   * @returns {string}
   */
  getFormulasSeparator(): string {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin || !formulasPlugin.isEnabled()) {
      return ',';
    }

    return (formulasPlugin.engine?.getConfig()?.functionArgSeparator as string | undefined) ?? ',';
  }

  /**
   * Gets cell meta for all cells in the export range.
   *
   * Returns a 2D array of cell meta objects with the same structure as {@link ExportDataProvider#getData}.
   * Each entry corresponds to the cell at the same position in the data array.
   *
   * @returns {Array}
   */
  getCellsMeta(): Record<string, unknown>[][] {
    // The transient read resolves the full dynamic meta (hooks + `cells`) without storing
    // anything - an export walks the whole range, and the eager `getCellMeta` would permanently
    // materialize one meta object per exported cell. The returned transients are complete
    // snapshots (prototype cascade + extension), safe for read-only serialization.
    return this._extractDataMatrix(
      (row: number, col: number): Record<string, unknown> => this.hot.getCellMetaTransient(row, col)
    );
  }

  /**
   * Gets rendered DOM elements for all cells in the export range.
   *
   * Returns a 2D array of `HTMLElement | null` values with the same structure as
   * {@link ExportDataProvider#getCellsMeta}. An entry is `null` when the cell is outside
   * the rendered viewport (virtualised grid).
   *
   * @returns {Array}
   */
  getCellElements() {
    return this._extractDataMatrix((row: number, col: number) => this.hot.getCell(row, col));
  }

  /**
   * Gets the merged cells configuration filtered to the current export range.
   *
   * Returned coordinates are 0-based data-array indices (matching the same coordinate
   * space as {@link ExportDataProvider#getData}). Hidden rows/columns excluded from the export
   * are accounted for: the row/col offsets are compressed and the rowspan/colspan values
   * are reduced to cover only the exported cells within the merge span.
   *
   * Merges whose top-left cell is excluded, or that collapse to a single cell after
   * exclusion, are omitted from the result.
   *
   * @returns {Array}
   */
  getMergeCells() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const mergeCellsPlugin = this.hot.getPlugin('mergeCells');

    if (!mergeCellsPlugin || !mergeCellsPlugin.isEnabled()) {
      return [];
    }

    const mergedCells = mergeCellsPlugin.mergedCellsCollection!.mergedCells;
    const result: MergeCellDescriptor[] = [];
    const excludeHiddenRows = this.options.exportHiddenRows === false;
    const excludeHiddenCols = this.options.exportHiddenColumns === false;
    const rowIncluded = (r: number) => !excludeHiddenRows || !this._isHiddenRow(r);
    const colIncluded = (c: number) => !excludeHiddenCols || !this._isHiddenColumn(c);

    mergedCells.forEach((merge: MergeCellDescriptor) => {
      const mergeEndRow = merge.row + merge.rowspan - 1;
      const mergeEndCol = merge.col + merge.colspan - 1;

      // Skip merges fully outside the export range.
      if (merge.row < startRow || mergeEndRow > endRow ||
          merge.col < startCol || mergeEndCol > endCol) {
        return;
      }

      // Skip merges whose top-left cell is excluded.
      if (!rowIncluded(merge.row) || !colIncluded(merge.col)) {
        return;
      }

      // Data-array position of the merge's top-left cell.
      const dataRow = this._countVisibleBefore(merge.row, startRow, rowIncluded);
      const dataCol = this._countVisibleBefore(merge.col, startCol, colIncluded);

      // Effective span after removing excluded rows/columns inside the merge.
      const dataRowspan = this._countVisibleBefore(mergeEndRow + 1, merge.row, rowIncluded);
      const dataColspan = this._countVisibleBefore(mergeEndCol + 1, merge.col, colIncluded);

      // A 1×1 result is not a merge.
      if (dataRowspan <= 1 && dataColspan <= 1) {
        return;
      }

      result.push({
        row: dataRow,
        col: dataCol,
        rowspan: dataRowspan,
        colspan: dataColspan,
      });
    });

    return result;
  }

  /**
   * Gets widths (in pixels) for all visible columns in the export range.
   *
   * Returns values in the same column order as {@link ExportDataProvider#getData}.
   *
   * @returns {Array}
   */
  getColumnsWidths(): number[] {
    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const widths: number[] = [];

    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      if (options.exportHiddenColumns === false && this._isHiddenColumn(colIndex)) {
        continue;
      }

      // `getColWidth()` returns 0 for hidden columns (the HiddenColumns plugin
      // overrides `modifyColWidth` to zero out the rendered width). Use the
      // configured width from column meta so the Excel column has a usable size
      // when the user unhides it.
      const width = this._isHiddenColumn(colIndex)
        ? this._getNaturalColWidth(colIndex)
        : this.hot.getColWidth(colIndex);

      widths.push(width);
    }

    return widths;
  }

  /**
   * Gets heights (in pixels) for all visible rows in the export range.
   *
   * Returns values in the same row order as {@link ExportDataProvider#getData}.
   *
   * @returns {Array}
   */
  getRowsHeights(): number[] {
    const { startRow, endRow } = this._getDataRange();
    const options = this.options;
    const heights: number[] = [];

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (options.exportHiddenRows === false && this._isHiddenRow(rowIndex)) {
        continue;
      }

      // `getRowHeight()` returns 0 for hidden rows (the HiddenRows plugin
      // overrides `modifyRowHeight` to zero out the rendered height). Use the
      // configured height from settings so the Excel row has a usable size
      // when the user unhides it.
      const height = this._isHiddenRow(rowIndex)
        ? this._getNaturalRowHeight(rowIndex)
        : this.hot.getRowHeight(rowIndex);

      heights.push(height);
    }

    return heights;
  }

  /**
   * Gets the number of exported rows that sit in the frozen band (`fixedRowsTop` setting).
   *
   * Counts only the rows among the first `fixedRowsTop` visual rows that the export writes:
   * rows outside the `range` option are skipped, and so are hidden rows when
   * `exportHiddenRows` is `false`. This keeps the sheet's frozen pane on the same rows
   * that are frozen on screen.
   *
   * @returns {number}
   */
  getFrozenRows() {
    const { startRow, endRow } = this._getDataRange();

    return this.#countExportedInFrozenBand(
      this.hot.getSettings().fixedRowsTop || 0, startRow, endRow,
      (row: number) => this.options.exportHiddenRows !== false || !this._isHiddenRow(row)
    );
  }

  /**
   * Gets the number of exported columns that sit in the frozen band (`fixedColumnsStart` setting).
   *
   * Counts only the columns among the first `fixedColumnsStart` visual columns that the export
   * writes: columns outside the `range` option are skipped, and so are hidden columns when
   * `exportHiddenColumns` is `false`. This keeps the sheet's frozen pane on the same columns
   * that are frozen on screen.
   *
   * @returns {number}
   */
  getFrozenColumns() {
    const { startCol, endCol } = this._getDataRange();

    return this.#countExportedInFrozenBand(
      this.hot.getSettings().fixedColumnsStart || 0, startCol, endCol,
      (column: number) => this.options.exportHiddenColumns !== false || !this._isHiddenColumn(column)
    );
  }

  /**
   * Counts the exported indexes inside a frozen band that starts at visual index 0.
   *
   * @param {number} frozenCount Size of the frozen band, in visual indexes.
   * @param {number} start First visual index of the export range.
   * @param {number} end Last visual index of the export range.
   * @param {Function} isExported Returns `true` when the visual index is written to the file.
   * @returns {number}
   */
  #countExportedInFrozenBand(
    frozenCount: number, start: number, end: number, isExported: (index: number) => boolean
  ): number {
    const bandEnd = Math.min(frozenCount - 1, end);
    let count = 0;

    for (let index = start; index <= bandEnd; index++) {
      if (isExported(index)) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Gets nested column header data from the NestedHeaders plugin for the current export range.
   *
   * Returns `null` when the NestedHeaders plugin is not enabled. Otherwise returns an array
   * of layers, where each layer is an array of `{ label, colspan, className }` objects
   * representing the visible column headers in that layer. Hidden columns (when
   * `exportHiddenColumns` is `false`) are excluded and their colspan contribution is removed
   * from spanning headers.
   *
   * @returns {Array[]|null}
   */
  getNestedColumnHeaders() {
    const nestedHeadersPlugin = this.hot.getPlugin('nestedHeaders');

    // `enabled` is the live state; `isEnabled()` only answers whether the settings ask for the plugin.
    // Today the two never disagree while the plugin has layers, so this check is defensive.
    if (!nestedHeadersPlugin || !nestedHeadersPlugin.enabled) {
      return null;
    }

    const layersCount = nestedHeadersPlugin.getLayersCount();

    // This guard is what fixes a runtime `disablePlugin()`: it clears the plugin's state, so the
    // plugin reports zero layers while the settings still carry `nestedHeaders`. Taking the nested
    // path then exported no column headers at all.
    if (layersCount === 0) {
      return null;
    }
    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const includeHidden = !!options.exportHiddenColumns;
    const layers = [];

    for (let layer = 0; layer < layersCount; layer++) {
      const layerHeaders: Array<{ label: string; colspan: number; className: string }> = [];
      let col = startCol;

      while (col <= endCol) {
        if (!includeHidden && this._isHiddenColumn(col)) {
          col += 1;
          continue;
        }

        if (includeHidden) {
          col = this._appendNestedHeaderWithHidden(nestedHeadersPlugin, layer, col, endCol, layerHeaders);
        } else {
          col = this._appendNestedHeaderWithoutHidden(nestedHeadersPlugin, layer, col, endCol, layerHeaders);
        }
      }

      layers.push(layerHeaders);
    }

    return layers;
  }

  /**
   * Gets the label of the nested header whose span starts at the given column, as the grid displays it.
   *
   * The label is read through `getColHeader()`, so the `modifyColumnHeaderValue` hook applies to it the
   * same way it applies to the rendered header and to the flat header row. Call it for the root column of
   * a span only: for a column inside a span, `getColHeader()` resolves the covering header and returns
   * its label again.
   *
   * @param {number} col The visual index of the column the header span starts at.
   * @param {number} layer The header layer index, `0` for the top layer.
   * @returns {string}
   */
  _getNestedHeaderLabel(col: number, layer: number) {
    const label = this.hot.getColHeader(col, layer);

    return extractText(this.hot, Array.isArray(label) ? '' : label ?? '', 'ExportFile.columnHeader');
  }

  /**
   * Appends a nested header entry for a single column when hidden columns are included in the export.
   *
   * @param {object} nestedHeadersPlugin The NestedHeaders plugin instance.
   * @param {number} layer The header layer index.
   * @param {number} col The current column index.
   * @param {number} endCol The last column index of the export range.
   * @param {Array} layerHeaders The array to push the header entry into.
   * @returns {number} The next column index to process.
   */
  _appendNestedHeaderWithHidden(
    nestedHeadersPlugin: NestedHeadersPluginWithState, layer: number, col: number,
    endCol: number, layerHeaders: Array<{ label: string; colspan: number; className: string }>
  ) {
    // When including hidden columns, the NestedHeaders state matrix has been
    // modified by the HiddenColumns plugin: hidden span roots are replaced with
    // placeholders and their colspan is transferred to the next visible column.
    // Use the tree node data instead, which preserves the original columnIndex
    // and origColspan regardless of the hidden state.
    const treeNodeData = nestedHeadersPlugin.getStateManager().getHeaderTreeNodeData(layer, col);

    if (!treeNodeData || treeNodeData.columnIndex === col) {
      // This column is the root of its span (or has no tree node → single column).
      const origColspan = treeNodeData?.origColspan ?? 1;
      // Clamp to the export range end.
      const effectiveColspan = Math.min(origColspan, endCol - col + 1);
      // headerClassNames is an array of strings produced by the settings normalizer
      // from the user-supplied `headerClassName` string.
      const className = (treeNodeData?.headerClassNames ?? []).join(' ');

      layerHeaders.push({
        label: treeNodeData ? this._getNestedHeaderLabel(col, layer) : '',
        colspan: effectiveColspan,
        className,
      });

      return col + origColspan;
    }

    // This column is inside a span whose root is before startCol. Emit a
    // single-column placeholder to keep the column count correct.
    layerHeaders.push({ label: '', colspan: 1, className: '' });

    return col + 1;
  }

  /**
   * Appends a nested header entry for a single column when hidden columns are excluded from the export.
   *
   * @param {object} nestedHeadersPlugin The NestedHeaders plugin instance.
   * @param {number} layer The header layer index.
   * @param {number} col The current column index.
   * @param {number} endCol The last column index of the export range.
   * @param {Array} layerHeaders The array to push the header entry into.
   * @returns {number} The next column index to process.
   */
  _appendNestedHeaderWithoutHidden(
    nestedHeadersPlugin: NestedHeadersPluginWithSettings & NestedHeadersPluginWithState, layer: number,
    col: number, endCol: number, layerHeaders: Array<{ label: string; colspan: number; className: string }>
  ) {
    const settings = nestedHeadersPlugin.getHeaderSettings(layer, col);

    if (!settings || settings.isRoot) {
      // The span has to be walked to its real end. With the HiddenColumns plugin, the root's
      // `colspan` is already reduced by the number of hidden columns in the span, but those hidden
      // columns still occupy index positions inside it. Walking only `colspan` columns from the root
      // stops early when a hidden column sits strictly inside the span: the group comes out too
      // narrow and its last columns are read as continuation cells with an empty label. The tree node
      // keeps the original span (`columnIndex` + `origColspan`) whatever is hidden.
      const treeNodeData = settings ? nestedHeadersPlugin.getStateManager().getHeaderTreeNodeData(layer, col) : null;
      // The state matrix and the header tree are built from the same settings, so a span root always
      // has a tree node. A column without one is exported as a single column, never through the
      // reduced `colspan` above.
      const spanEnd = treeNodeData
        ? treeNodeData.columnIndex + treeNodeData.origColspan
        : col + 1;
      let visibleColspan = 0;

      for (let spanCol = col; spanCol < spanEnd && spanCol <= endCol; spanCol++) {
        if (!this._isHiddenColumn(spanCol)) {
          visibleColspan += 1;
        }
      }

      // headerClassNames is an array of strings produced by the settings normalizer
      // from the user-supplied `headerClassName` string.
      const className = (settings?.headerClassNames ?? []).join(' ');

      layerHeaders.push({
        label: settings ? this._getNestedHeaderLabel(col, layer) : '',
        colspan: visibleColspan,
        className,
      });

      return spanEnd;
    }

    // Continuation cell of a span that started at an earlier column.
    // This can only occur when startCol falls inside a span — emit a
    // single-column placeholder so the export column count stays correct.
    layerHeaders.push({ label: '', colspan: 1, className: '' });

    return col + 1;
  }

  /**
   * Gets `headerClassName` values for all visible column headers in the export range.
   *
   * Returns values in the same column order as {@link ExportDataProvider#getColumnHeaders}.
   * An empty string is returned for columns that have no `headerClassName` configured.
   *
   * @returns {string[]}
   */
  getColumnHeadersClassNames(): string[] {
    if (!this.options.colHeaders) {
      return [];
    }

    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const classNames: string[] = [];

    for (let col = startCol; col <= endCol; col++) {
      if (options.exportHiddenColumns === false && this._isHiddenColumn(col)) {
        continue;
      }

      const headerClassName = this.hot.getColumnMeta(col).headerClassName;

      let resolvedClassName = '';

      if (Array.isArray(headerClassName)) {
        resolvedClassName = headerClassName.join(' ');
      } else if (typeof headerClassName === 'string') {
        resolvedClassName = headerClassName;
      }

      classNames.push(resolvedClassName);
    }

    return classNames;
  }

  /**
   * Gets the layout direction the Handsontable instance renders in. `isRtl()` resolves
   * `layoutDirection: 'inherit'` against the page, so a grid on a right-to-left page exports a
   * right-to-left sheet, and the import compares against the same answer.
   *
   * @returns {'ltr'|'rtl'}
   */
  getLayoutDirection() {
    return this.hot.isRtl() ? 'rtl' : 'ltr';
  }

  /**
   * Gets column summary endpoint descriptors from the ColumnSummary plugin, translated
   * into the coordinate space of the exported data array.
   *
   * Returns an empty array when the plugin is absent or disabled.
   * Each descriptor contains:
   *
   * - `destRow` / `destCol` — 0-based indices into `getData()` identifying the destination cell.
   * - `type` — lowercase summary type (`'sum'`, `'min'`, `'max'`, `'count'`, `'average'`, `'custom'`).
   * - `sourceCol` — 0-based data-array column index of the source column.
   * - `sourceRanges` — array of `[startDataRow, endDataRow]` pairs (inclusive, 0-based) covering
   *   the source rows after hidden-row exclusion and range clamping.
   *
   * @returns {Array}
   */
  getColumnSummaries() {
    const plugin = this.hot.getPlugin('columnSummary');

    if (!plugin || !plugin.isEnabled()) {
      return [];
    }

    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const allEndpoints = plugin.endpoints!.getAllEndpoints();

    // First pass: collect all destination data-row indices so we can exclude every
    // summary destination from every formula's source range.  Without this, multiple
    // summary rows would reference each other and create circular references in Excel
    // (e.g. SUM at row 6 references MIN at row 7, and MIN at row 7 references SUM at row 6).
    const allDestRows = new Set<number>();

    (allEndpoints as unknown as SummaryEndpoint[]).forEach((endpoint: SummaryEndpoint) => {
      if (endpoint.destinationRow === undefined) {
        return;
      }

      const destRow = this._physicalRowToDataIndex(endpoint.destinationRow, startRow, endRow);

      if (destRow !== null) {
        allDestRows.add(destRow);
      }
    });

    // Second pass: translate each endpoint into an export-coordinate summary descriptor.
    const summaries: object[] = [];

    (allEndpoints as unknown as SummaryEndpoint[]).forEach((endpoint: SummaryEndpoint) => {
      const summary = this._transformEndpointToSummary(
        endpoint, startRow, endRow, startCol, endCol, allDestRows
      );

      if (summary !== null) {
        summaries.push(summary);
      }
    });

    return summaries;
  }

  /**
   * Translates a single ColumnSummary endpoint into an export-coordinate summary descriptor.
   *
   * Converts physical row/column indices to 0-based data-array positions, builds the
   * compacted source-range array (merging consecutive indices), and excludes all
   * destination rows supplied in `allDestRows` to prevent circular Excel formula chains.
   *
   * Returns `null` when the endpoint falls outside the export range or produces no
   * valid source rows after filtering.
   *
   * @private
   * @param {object} endpoint ColumnSummary endpoint object from `getAllEndpoints()`.
   * @param {number} startRow First visual row of the export range.
   * @param {number} endRow Last visual row of the export range.
   * @param {number} startCol First visual column of the export range.
   * @param {number} endCol Last visual column of the export range.
   * @param {Set<number>} allDestRows Data-array row indices of all summary destinations.
   * @returns {object|null}
   */
  _transformEndpointToSummary(
    endpoint: SummaryEndpoint, startRow: number, endRow: number,
    startCol: number, endCol: number, allDestRows: Set<number>
  ) {
    if (endpoint.destinationRow === undefined || endpoint.destinationColumn === undefined) {
      return null;
    }

    const destRow = this._physicalRowToDataIndex(endpoint.destinationRow, startRow, endRow);
    const destCol = this._physicalColToDataIndex(endpoint.destinationColumn, startCol, endCol);

    if (destRow === null || destCol === null) {
      return null;
    }

    const physSourceCol = endpoint.sourceColumn ?? endpoint.destinationColumn;
    const sourceCol = this._physicalColToDataIndex(physSourceCol, startCol, endCol);

    if (sourceCol === null) {
      return null;
    }

    // Convert physical row ranges to sequential data-row-index ranges, merging
    // consecutive indices so the resulting array stays compact.
    const physRanges = endpoint.ranges || [[0, this.hot.countRows() - 1]];
    const sourceRanges: [number, number][] = [];

    physRanges.forEach((range: number[]) => {
      const physStart = range[0];
      const physEnd = range[1] !== undefined ? range[1] : range[0];

      for (let physRow = physStart; physRow <= physEnd; physRow++) {
        const dataIdx = this._physicalRowToDataIndex(physRow, startRow, endRow);

        if (dataIdx === null || allDestRows.has(dataIdx)) {
          continue;
        }

        if (sourceRanges.length > 0) {
          const lastRange = sourceRanges[sourceRanges.length - 1];

          if (lastRange[1] + 1 === dataIdx) {
            lastRange[1] = dataIdx; // extend existing range
            continue;
          }
        }

        sourceRanges.push([dataIdx, dataIdx]);
      }
    });

    if (sourceRanges.length === 0) {
      return null;
    }

    return {
      destRow,
      destCol,
      type: String(endpoint.type || 'sum').toLowerCase(),
      sourceCol,
      sourceRanges,
    };
  }

  /**
   * Counts the number of indices in `[start, end)` for which `isIncluded` returns `true`.
   *
   * Used by {@link ExportDataProvider#_physicalRowToDataIndex} and
   * {@link ExportDataProvider#_physicalColToDataIndex} to compute the 0-based data-array
   * position of a visual index by counting the visible indices that precede it.
   *
   * @private
   * @param {number} end Exclusive upper bound (the target visual index).
   * @param {number} start Inclusive lower bound of the export range.
   * @param {Function} isIncluded Returns `true` for indices that appear in the exported data.
   * @returns {number}
   */
  _countVisibleBefore(end: number, start: number, isIncluded: (i: number) => boolean) {
    let count = 0;

    for (let i = start; i < end; i++) {
      if (isIncluded(i)) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Converts a physical row index to a 0-based index into the exported data array.
   *
   * Returns `null` if the row is outside the export range, is hidden and hidden rows
   * are not being exported, or has no visual equivalent.
   *
   * @private
   * @param {number} physRow Physical row index.
   * @param {number} startRow First visual row of the export range.
   * @param {number} endRow Last visual row of the export range.
   * @returns {number|null}
   */
  _physicalRowToDataIndex(physRow: number, startRow: number, endRow: number) {
    const visualRow = this.hot.toVisualRow(physRow);

    if (visualRow === null || visualRow < startRow || visualRow > endRow) {
      return null;
    }

    if (this.options.exportHiddenRows === false && this._isHiddenRow(visualRow)) {
      return null;
    }

    return this._countVisibleBefore(
      visualRow, startRow, (r: number) => this.options.exportHiddenRows !== false || !this._isHiddenRow(r)
    );
  }

  /**
   * Converts a physical column index to a 0-based index into the exported data array.
   *
   * Returns `null` if the column is outside the export range, is hidden and hidden
   * columns are not being exported, or has no visual equivalent.
   *
   * @private
   * @param {number} physCol Physical column index.
   * @param {number} startCol First visual column of the export range.
   * @param {number} endCol Last visual column of the export range.
   * @returns {number|null}
   */
  _physicalColToDataIndex(physCol: number, startCol: number, endCol: number) {
    const visualCol = this.hot.toVisualColumn(physCol);

    if (visualCol === null || visualCol < startCol || visualCol > endCol) {
      return null;
    }

    if (this.options.exportHiddenColumns === false && this._isHiddenColumn(visualCol)) {
      return null;
    }

    return this._countVisibleBefore(
      visualCol, startCol, (c: number) => this.options.exportHiddenColumns !== false || !this._isHiddenColumn(c)
    );
  }

  /**
   * Returns the natural (pre-hiding) width in pixels for a hidden column.
   *
   * `getColWidth()` returns 0 for hidden columns because the HiddenColumns plugin
   * overrides the `modifyColWidth` hook. This method reads the configured width
   * from the cell meta or the `colWidths` setting, bypassing that hook.
   *
   * @private
   * @param {number} colIndex Visual column index.
   * @returns {number}
   */
  _getNaturalColWidth(colIndex: number): number {
    const { defaultColumnWidth } = this.hot.getSettings();
    const fallback: number = (defaultColumnWidth as number | undefined) ?? 50;
    const width = this.hot._getColWidthFromSettings(colIndex);

    return Number.isFinite(width) ? width as number : fallback;
  }

  /**
   * Returns the natural (pre-hiding) height in pixels for a hidden row.
   *
   * `getRowHeight()` returns 0 for hidden rows because the HiddenRows plugin
   * overrides the `modifyRowHeight` hook. This method reads the configured height
   * directly from the `rowHeights` setting, bypassing that hook.
   *
   * @private
   * @param {number} rowIndex Visual row index.
   * @returns {number}
   */
  _getNaturalRowHeight(rowIndex: number): number {
    const settings = this.hot.getSettings();
    const { rowHeights, defaultRowHeight } = settings;
    const fallback: number = (defaultRowHeight as number | undefined) ?? 23;

    if (Array.isArray(rowHeights)) {
      return (rowHeights[rowIndex] as number | undefined) ?? fallback;
    } else if (typeof rowHeights === 'function') {
      return (rowHeights(rowIndex) as number | undefined) ?? fallback;
    } else if (typeof rowHeights === 'number') {
      return rowHeights;
    }

    return fallback;
  }

  /**
   * Check if row at specified row index is hidden.
   *
   * @private
   * @param {number} row Row index.
   * @returns {boolean}
   */
  _isHiddenRow(row: number) {
    return this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(row));
  }

  /**
   * Check if column at specified column index is hidden.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  _isHiddenColumn(column: number) {
    return this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(column));
  }
}

export default ExportDataProvider;
