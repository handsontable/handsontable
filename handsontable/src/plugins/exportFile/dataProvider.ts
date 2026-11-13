import type { HotInstance } from '../../core/types';
import { extractText } from '../../utils/textExtractor';
import { expandNestedHeaderLayers } from './utils';
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
 * The size of the array a formula spills, in cells, as `ExportDataProvider#getEngineCellFacts()`
 * reports it.
 */
export interface ArrayFormulaSize {
  rows: number;
  cols: number;
  exported: boolean;
  /**
   * The size before the trailing empty rows and columns were trimmed off, present only when the
   * trim changed it. A CSE array keeps it: Excel never resizes a CSE ref, and the engine's empty
   * value also marks an empty cell the formula references.
   */
  untrimmed?: { rows: number; cols: number; exported: boolean };
}

/**
 * The size of an array, in cells.
 */
interface SpillSize {
  rows: number;
  cols: number;
}

/**
 * An array's size before and after `trimEmptyTail()`.
 */
interface SpillSizes {
  trimmed: SpillSize;
  untrimmed: SpillSize;
}

/**
 * What the Formulas plugin's engine holds for one cell, as `ExportDataProvider#getEngineCellFacts()`
 * reports it: the OOXML error code of its value (`null` when the value is not an error with one),
 * the finite number or boolean the engine computed for it (`null` for a value the user typed, a
 * computed text, or an error), and the size of the array it spills (`null` unless it is the master
 * of an array and the sizes were asked for).
 */
export interface EngineCellFacts {
  errorCode: string | null;
  computedValue: number | boolean | null;
  arraySize: ArrayFormulaSize | null;
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
 * Drops the trailing rows, then the trailing columns, of a `rows` x `cols` array whose every cell
 * `isEmpty()` answers `true` for, keeping at least one row and one column.
 *
 * @param {number} rows The array's height.
 * @param {number} cols The array's width.
 * @param {Function} isEmpty Whether the cell at an offset from the master is empty.
 * @returns {{ rows: number, cols: number }}
 */
function trimEmptyTail(
  rows: number, cols: number, isEmpty: (rowOffset: number, colOffset: number) => boolean
): { rows: number; cols: number } {
  let height = rows;
  let width = cols;
  const isEmptyRow = (row: number) => Array.from({ length: width }, (_, col) => col).every(col => isEmpty(row, col));
  // Only the rows that stay count for a column.
  const isEmptyCol = (col: number) => Array.from({ length: height }, (_, row) => row).every(row => isEmpty(row, col));

  while (height > 1 && isEmptyRow(height - 1)) {
    height -= 1;
  }

  while (width > 1 && isEmptyCol(width - 1)) {
    width -= 1;
  }

  return { rows: height, cols: width };
}

/**
 * Reads the size of the array whose master sits at `address` from HyperFormula's array mapping.
 * The mapping is `@internal` in HyperFormula (3.3.0 answers an `ArrayFormulaVertex` with `width`,
 * `height`, and the computed `array`), so every step is duck-typed and anything unexpected answers
 * `null`.
 *
 * The mapping holds the room the engine reserved, which is the exact size for `SEQUENCE`, but the
 * size of the input for `FILTER`: the engine pads the result with its empty value, a symbol
 * (`=FILTER(A1:A6,A1:A6>3)` reserves 6 rows for 3). Both sizes are answered: the reserved one, and
 * the one with the trailing rows and columns that hold only that symbol trimmed off. The caller
 * picks: a dynamic array takes the trimmed size, since a result whose real last values are empty
 * cells is trimmed too, which Excel corrects when it recalculates. A CSE array keeps the reserved
 * size, since Excel never resizes a CSE ref and the symbol also marks an empty referenced cell
 * (`=ARRAYFORMULA(IF(A1:A4>2,B1:B4,B1:B4))` over empty B3:B4). An error result (`FILTER` that
 * matches nothing) holds no values and keeps the reserved size either way.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {object} address The master's engine address.
 * @returns {{ trimmed: object, untrimmed: object }|null}
 */
function readMappedArraySize(engine: object, address: EngineCellAddress): SpillSizes | null {
  const { arrayMapping } = engine as { arrayMapping?: { getArrayByCorner?: unknown } };

  if (typeof arrayMapping?.getArrayByCorner !== 'function') {
    return null;
  }

  const vertex = (arrayMapping.getArrayByCorner as (address: EngineCellAddress) => unknown).call(arrayMapping, address);
  const { width, height, array } = (vertex ?? {}) as { width?: unknown; height?: unknown; array?: { raw?: unknown } };

  if (typeof width !== 'number' || typeof height !== 'number' || width < 1 || height < 1) {
    return null;
  }

  const values = typeof array?.raw === 'function' ? (array.raw as () => unknown).call(array) : null;

  const untrimmed = { rows: height, cols: width };

  if (!Array.isArray(values)) {
    return { trimmed: untrimmed, untrimmed };
  }

  return {
    trimmed: trimEmptyTail(height, width, (row, col) => {
      const valueRow: unknown = values[row];

      return Array.isArray(valueRow) && typeof valueRow[col] === 'symbol';
    }),
    untrimmed,
  };
}

/**
 * Estimates the size of the array whose master sits at `address` by walking right, then down, over
 * the cells the engine types `ARRAY`, and answers that size and the one with the trailing rows and
 * columns whose every value is empty trimmed off, as `readMappedArraySize()` does with the room the
 * engine reserves. The fallback for `readMappedArraySize()`; it can over-count when another array
 * spills next to the master.
 *
 * @param {object} engine The Formulas plugin's engine.
 * @param {object} address The master's engine address.
 * @returns {{ trimmed: object, untrimmed: object }}
 */
function walkArraySize(
  engine: {
    getCellType(address: EngineCellAddress): unknown;
    getCellValue(address: EngineCellAddress): unknown;
    getSheetDimensions(sheetId: number): { width: number; height: number };
  },
  address: EngineCellAddress
): SpillSizes {
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

  return {
    trimmed: trimEmptyTail(rows, cols, (rowOffset, colOffset) => engine
      .getCellValue({ sheet, row: row + rowOffset, col: col + colOffset }) === null),
    untrimmed: { rows, cols },
  };
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
    this.options = options;
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
   * Gets the named expressions of the Formulas plugin's engine, each with its definition: the
   * formula text (`=Sheet1!$A$1:$A$3`), or, for a name defined with a constant, that constant
   * spelled as a formula literal (`5`, `"text"`, `TRUE()`). The definition is `null` when the
   * constant cannot be spelled. `scope` is `null` for a workbook-scoped name and the engine sheet
   * name for a name scoped to a sheet; the workbook names come first, in the engine's order, then
   * each sheet's names, in the engine's sheet order. Empty when the Formulas plugin is absent or
   * disabled.
   *
   * @returns {Array<{ name: string, formula: string|null, scope: string|null }>}
   */
  getNamedExpressions(): Array<{ name: string; formula: string | null; scope: string | null }> {
    const formulasPlugin = this.hot.getPlugin('formulas');
    const engine = formulasPlugin?.enabled ? formulasPlugin.engine : null;

    if (!engine) {
      return [];
    }

    // A name defined with a constant is read as a value, which the engine refuses while the Formulas plugin
    // holds its recalculation (`batchEvaluation`).
    formulasPlugin!.flushEngineEvaluation();

    const read = (scope: string | null, sheetId?: number) => (name: string) => {
      const formula = engine.getNamedExpressionFormula(name, sheetId);

      return {
        name,
        formula: formula === undefined ? toFormulaLiteral(engine.getNamedExpressionValue?.(name, sheetId)) : formula,
        scope,
      };
    };
    const names = engine.listNamedExpressions().map(read(null));

    (engine.getSheetNames?.() ?? []).forEach((sheetName: string) => {
      const sheetId = engine.getSheetId(sheetName);

      if (sheetId !== undefined) {
        engine.listNamedExpressions(sheetId).forEach((name: string) => names.push(read(sheetName, sheetId)(name)));
      }
    });

    return names;
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

    if (!formulasPlugin?.enabled || !formulasPlugin.engine || formulasPlugin.sheetName === null) {
      return null;
    }

    return { engine: formulasPlugin.engine, sheetName: formulasPlugin.sheetName };
  }

  /**
   * Gets, for every cell of the export range, what the Formulas plugin's engine holds for it, in ONE
   * pass that reads each cell's type and value once: the OOXML error code of its value, the number
   * or boolean the engine computed for it, and, when `withArraySizes` is `true`, the size of the
   * array it spills. An entry is `null` when the engine holds nothing to report for the cell (an
   * empty cell, a typed text or number), when the engine has no row or column for it (the syncer
   * answers `-1`). Without the Formulas plugin, or with it disabled, the answer is `null` itself:
   * no matrix is built.
   *
   * The error code comes from the engine's own cell value, not from the displayed text, which
   * cannot tell the error `#N/A` from the text a formula such as `="#N/A"` answers, and which the
   * engine's language translates. It is read for every cell, a typed `#N/A` (`VALUE`) included:
   * the XLSX export writes a cell whose value is an error as that code, with and without
   * `exportFormulas`.
   *
   * The computed value is read for a formula cell, an array formula and the cells an array spills
   * (`ARRAY`), when the value is a finite number or a boolean. The XLSX export writes such a cell
   * with the engine's type, so a computed number in a text column is not written as text, which a
   * reader that takes cached values without recalculating would not count (`=SUM()` over a spill).
   *
   * The array size is read for a cell the engine types `ARRAYFORMULA` (a spilling function such as
   * `SEQUENCE`, or `ARRAYFORMULA(…)`). HyperFormula has no public API for the spill range. The size
   * is read from the engine's array mapping (`arrayMapping.getArrayByCorner()`), which holds the
   * room the engine reserved for every array. For `FILTER` that is the size of its input, padded with
   * the engine's empty value, so the trailing rows and columns holding only that value are trimmed
   * off (`readMappedArraySize()`); when that changes the size, the reserved one is kept as
   * `untrimmed`, which the XLSX export uses for a CSE array (`ARRAYFORMULA(…)`), whose ref Excel
   * never resizes. That mapping is `@internal` in HyperFormula and may change between
   * 3.x releases, so it is duck-typed and, when it is missing or answers an unexpected shape, the
   * size is estimated by walking right, then down, from the master over the cells the engine types
   * `ARRAY`, bounded by the sheet's dimensions. The walk is only an estimate: a spilled cell next to
   * the master can belong to another array (a `=SEQUENCE(3)` in B1 spills into B2, right of a master
   * in A2), so it can over-count, and the export refuses a ref that overlaps an earlier one
   * (`types/xlsx.ts`). `isCellPartOfArray()` cannot drive the walk: it is `true` for a neighboring
   * array's master too. `exported` tells whether every spilled row and column lands in the exported
   * matrix right after the master, so the spill keeps its shape in the file. It is `false` when the
   * spill crosses a trimmed row, a hidden row or column the export leaves out, or the `range` edge.
   *
   * @param {boolean} withArraySizes Whether to read the array sizes (`exportFormulas`).
   * @returns {Array[]|null}
   */
  getEngineCellFacts(withArraySizes: boolean): (EngineCellFacts | null)[][] | null {
    const formulasPlugin = this.hot.getPlugin('formulas');
    const engine = formulasPlugin?.enabled ? formulasPlugin.engine : null;
    const { sheetId, rowAxisSyncer, columnAxisSyncer } = formulasPlugin ?? {};

    if (!engine || sheetId === null || sheetId === undefined || !rowAxisSyncer || !columnAxisSyncer) {
      return null;
    }

    // The values are read from the engine, which refuses that while the Formulas plugin holds its
    // recalculation (`batchEvaluation`).
    formulasPlugin!.flushEngineEvaluation();

    let exportedRows: Map<number, number> | null = null;
    let exportedCols: Map<number, number> | null = null;

    if (withArraySizes) {
      const { startRow, endRow, startCol, endCol } = this._getDataRange();

      exportedRows = this.#getExportedPositions(startRow, endRow, this.options.exportHiddenRows === false
        ? (row: number) => this._isHiddenRow(row) : () => false);
      exportedCols = this.#getExportedPositions(startCol, endCol, this.options.exportHiddenColumns === false
        ? (col: number) => this._isHiddenColumn(col) : () => false);
    }

    return this._extractDataMatrix((row, col): EngineCellFacts | null => {
      const address = {
        sheet: sheetId,
        row: rowAxisSyncer.getHfIndexFromVisualIndex(row),
        col: columnAxisSyncer.getHfIndexFromVisualIndex(col),
      };

      // A row or column the engine does not hold (`-1`): asking the engine would throw.
      if (address.row < 0 || address.col < 0) {
        return null;
      }

      const cellType = engine.getCellType(address);

      if (cellType === 'EMPTY') {
        return null;
      }

      const value = engine.getCellValue(address);
      const errorCode = toOoxmlErrorCode(value);
      const computedValue = cellType !== 'VALUE'
        && ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean') ? value : null;
      let arraySize: ArrayFormulaSize | null = null;

      if (exportedRows !== null && exportedCols !== null && cellType === 'ARRAYFORMULA') {
        const { trimmed, untrimmed } = readMappedArraySize(engine, address) ?? walkArraySize(engine, address);
        const isExported = ({ rows, cols }: SpillSize) => (
          spillsInPlace(rowAxisSyncer, address.row, rows, exportedRows, row)
          && spillsInPlace(columnAxisSyncer, address.col, cols, exportedCols, col)
        );

        arraySize = { ...trimmed, exported: isExported(trimmed) };

        if (trimmed.rows !== untrimmed.rows || trimmed.cols !== untrimmed.cols) {
          arraySize.untrimmed = { ...untrimmed, exported: isExported(untrimmed) };
        }
      }

      if (errorCode === null && computedValue === null && arraySize === null) {
        return null;
      }

      return { errorCode, computedValue, arraySize };
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
   * `-1`), plus the hidden rows when `exportHiddenRows` is `false`, plus, when `withOutsideRange` is
   * `true`, every row outside the `range` option (the defined names are moved by it; cell formulas
   * are not). Without the plugin, a formula is the text the user typed, so only the hidden rows are
   * left out, by physical index.
   *
   * @param {boolean} [withOutsideRange=false] Whether to add the engine rows outside `range`.
   * @returns {Set<number>}
   */
  getExcludedHiddenRows(withOutsideRange = false): Set<number> {
    const { startRow, endRow } = this._getDataRange();
    const excludeHidden = this.options.exportHiddenRows === false;
    const syncer = this.#getEngineAxisSyncer('row');

    if (syncer) {
      return this.#collectExcludedEngineIndexes(
        syncer, this.hot.rowIndexMapper.getNumberOfIndexes(), startRow, endRow, withOutsideRange,
        visualRow => excludeHidden && this._isHiddenRow(visualRow),
      );
    }

    const result = new Set<number>();

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
   * Returns the columns the exported data matrix leaves out, as the column indexes the formulas'
   * references use, so the formula normalizer can shift every reference right of them left.
   *
   * With the Formulas plugin on, a reference names an engine column, and the engine's column order
   * follows the visual one (a moved column moves in the engine too). The set then holds the engine
   * index of every column with no visual index, plus the hidden columns when `exportHiddenColumns`
   * is `false`, plus, when `withOutsideRange` is `true`, every column outside the `range` option.
   * Without the plugin, only the hidden columns are left out, by physical index.
   *
   * @param {boolean} [withOutsideRange=false] Whether to add the engine columns outside `range`.
   * @returns {Set<number>}
   */
  getExcludedHiddenColumns(withOutsideRange = false): Set<number> {
    const { startCol, endCol } = this._getDataRange();
    const excludeHidden = this.options.exportHiddenColumns === false;
    const syncer = this.#getEngineAxisSyncer('column');

    if (syncer) {
      return this.#collectExcludedEngineIndexes(
        syncer, this.hot.columnIndexMapper.getNumberOfIndexes(), startCol, endCol, withOutsideRange,
        visualColumn => excludeHidden && this._isHiddenColumn(visualColumn),
      );
    }

    const result = new Set<number>();

    if (!excludeHidden) {
      return result;
    }

    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      if (this._isHiddenColumn(colIndex)) {
        result.add(this.hot.toPhysicalColumn(colIndex));
      }
    }

    return result;
  }

  /**
   * Walks every engine index of one axis and collects the ones the export leaves out: an index
   * with no visual index, one outside `start`…`end` when `withOutsideRange` is `true`, and one
   * inside the range that `isHidden` answers `true` for.
   *
   * @param {object} syncer The Formulas plugin's axis syncer.
   * @param {number} count The number of engine indexes of the axis.
   * @param {number} start The first visual index of the export range.
   * @param {number} end The last visual index of the export range.
   * @param {boolean} withOutsideRange Whether an index outside the range is left out.
   * @param {Function} isHidden Whether a visual index inside the range is a hidden one left out.
   * @returns {Set<number>}
   */
  #collectExcludedEngineIndexes(
    syncer: { getVisualIndexFromHfIndex(hfIndex: number): number },
    count: number,
    start: number,
    end: number,
    withOutsideRange: boolean,
    isHidden: (visualIndex: number) => boolean,
  ): Set<number> {
    const result = new Set<number>();

    for (let hfIndex = 0; hfIndex < count; hfIndex++) {
      const visualIndex = syncer.getVisualIndexFromHfIndex(hfIndex);
      const inRange = visualIndex >= start && visualIndex <= end;

      if (visualIndex < 0 || (withOutsideRange && !inRange) || (inRange && isHidden(visualIndex))) {
        result.add(hfIndex);
      }
    }

    return result;
  }

  /**
   * Returns the Formulas plugin's row or column axis syncer when the plugin is on, or `null`.
   *
   * @param {'row'|'column'} axis The axis.
   * @returns {object|null}
   */
  #getEngineAxisSyncer(axis: 'row' | 'column'): { getVisualIndexFromHfIndex(hfIndex: number): number } | null {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin?.enabled || !formulasPlugin.engine) {
      return null;
    }

    return (axis === 'row' ? formulasPlugin.rowAxisSyncer : formulasPlugin.columnAxisSyncer) ?? null;
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

    if (!formulasPlugin?.enabled) {
      return ',';
    }

    return (formulasPlugin.engine?.getConfig()?.functionArgSeparator as string | undefined) ?? ',';
  }

  /**
   * Gets the decimal separator of the HyperFormula engine's number literals, if active.
   *
   * Returns `'.'` when the Formulas plugin is absent or disabled, since that is the
   * separator OOXML (Excel) always expects.
   *
   * @returns {string}
   */
  getFormulasDecimalSeparator(): string {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin?.enabled) {
      return '.';
    }

    return (formulasPlugin.engine?.getConfig()?.decimalSeparator as string | undefined) ?? '.';
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

    // `enabled`, not `isEnabled()`: a plugin the license key leaves out keeps its setting but never ran, so it
    // has no merged cells collection to read.
    if (!mergeCellsPlugin || !mergeCellsPlugin.enabled) {
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

    if (!plugin?.enabled) {
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
   * from the settings (`rowHeights` and `minRowHeights`), bypassing that hook.
   *
   * @private
   * @param {number} rowIndex Visual row index.
   * @returns {number}
   */
  _getNaturalRowHeight(rowIndex: number): number {
    const { defaultRowHeight } = this.hot.getSettings();
    const fallback: number = (defaultRowHeight as number | undefined) ?? 23;
    const height = this.hot._getRowHeightFromSettings(rowIndex);

    return Number.isFinite(height) ? height as number : fallback;
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
