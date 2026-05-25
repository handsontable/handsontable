import { isDefined, stringify } from '../../../helpers/mixed';
import { isKeyValueObject } from '../../../helpers/object';
import { throwWithCause } from '../../../helpers/errors';
import DataProvider from '../dataProvider';
import BaseType from './_base';
import {
  buildSummaryFormula,
  normalizeFormula,
  isFormulaValue,
  colIndexToLetter,
} from './xlsx/formula-utils';
import {
  getCssStyleFromElement,
  getAlignmentFromClassName,
  getAlignmentFromMeta,
  getBorderFromMeta,
  getFontFromMeta,
  getFillFromMeta,
  getDropdownValidation,
  cssColorToArgb,
  clearStyleCaches,
  type CellMeta,
  type CssStyle,
} from './xlsx/cell-style';
import {
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  getDateNumFmt,
  getTimeNumFmt,
} from './xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from './xlsx/numeric-utils';
import type { HotInstance } from '../../../core/types';

/**
 * A cell value that ExcelJS accepts: a primitive, a formula object, or null.
 */
type ExcelCellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | { formula: string; result?: string | number | boolean | null }
  | { sharedFormula: string; result?: string | number | boolean | null };

interface ExcelJsCell {
  value: ExcelCellValue;
  numFmt: string;
  alignment: object;
  border: object;
  font: object;
  fill: object;
  protection: { locked: boolean };
  dataValidation: object;
  note: string;
}

interface ExcelJsRow {
  getCell(colNumber: number): ExcelJsCell;
  height: number;
  hidden: boolean;
  commit(): void;
}

interface ExcelJsColumn {
  width: number;
  hidden: boolean;
}

interface ExcelJsView {
  rightToLeft?: boolean;
  state?: string;
  xSplit?: number;
  ySplit?: number;
}

interface ExcelJsWorksheet {
  getRow(rowNumber: number): ExcelJsRow;
  getColumn(colNumber: number): ExcelJsColumn;
  getCell(rowNumber: number, colNumber: number): ExcelJsCell;
  mergeCells(startRow: number, startCol: number, endRow: number, endCol: number): void;
  addConditionalFormatting(descriptor: { ref: string; rules: unknown[] }): void;
  protect(password: string, options?: Record<string, boolean>): void;
  state: string;
  views: ExcelJsView[];
}

interface ExcelJsWorkbook {
  addWorksheet(name: string): ExcelJsWorksheet;
  worksheets: Array<{ name: string }>;
  xlsx: {
    writeBuffer(options?: object): Promise<Uint8Array>;
  };
}

/** Descriptor for a merge cell, in data-array coordinate space. */
interface MergeDescriptor {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/** Descriptor for a ColumnSummary destination, in data-array coordinate space. */
interface ColumnSummaryDescriptor {
  type: string;
  destRow: number;
  destCol: number;
  sourceCol: number;
  sourceRanges: [number, number][];
}

/** One entry in the `conditionalFormatting` option array. */
interface ConditionalFormattingDescriptor {
  rows?: [number, number];
  cols?: [number, number];
  rules: unknown[];
}

/** An entry in a nested-header layer returned by DataProvider#getNestedColumnHeaders. */
interface NestedHeaderEntry {
  label: string | null;
  colspan: number;
  className?: string;
}

/**
 * Sheet-level context object passed through from `#populateWorksheet` to the
 * per-row and per-cell writing helpers.
 */
interface SheetContext {
  exportFormulas: boolean;
  formulasSeparator: string;
  dataRowOffset: number;
  dataColOffset: number;
  excludedHiddenRows: Set<number> | null;
  excludedHiddenCols: Set<number> | null;
  summaryMap: Map<string, ColumnSummaryDescriptor>;
  sourceData: unknown[][] | null;
  hasRowHeaders: boolean;
  headerFill: object | null;
  headerBorder: object | null;
  hasReadOnlyCells: boolean;
  rootDocument: Document;
  rootWindow: Window;
  validationMap: Map<string, string>;
  cellsMeta: CellMeta[][];
  cellElements: Array<Array<HTMLElement | null>>;
  rowHeaders: Array<string | number | null>;
  rowsHeights: number[];
}

interface XlsxEngine {
  Workbook: new () => ExcelJsWorkbook;
}

interface XlsxSheetConfig {
  instance: HotInstance;
  name?: string;
  [key: string]: unknown;
}

// Approximate number of pixels occupied by one Excel column-width unit (character width
// of the "Normal" style font at the default font size). Used to convert pixel widths
// from Handsontable into the unitless width values expected by ExcelJS.
const PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT = 7;

// Conversion factor from CSS pixels to typographic points (1 pt = 1/72 in; 1 px = 1/96 in,
// so 1 px = 72/96 = 0.75 pt). Used to convert Handsontable row heights (pixels) to the
// point-based row heights expected by ExcelJS.
const PIXELS_TO_POINTS_RATIO = 0.75;

// Default width (in Excel column-width units) assigned to the frozen row-header column
// when row headers are exported. Chosen to comfortably fit typical row-index numbers.
const ROW_HEADER_DEFAULT_WIDTH = 5;

/** Typed view of the options object used internally within the Xlsx exporter. */
interface XlsxOptions extends Record<string, unknown> {
  exportFormulas?: boolean;
  headerStyle?: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null;
  conditionalFormatting?: ConditionalFormattingDescriptor[];
}

/**
 * @private
 */
class Xlsx extends BaseType {
  /**
   * Marks this formatter as binary (non-stringifiable).
   *
   * @returns {boolean}
   */
  static get BINARY() {
    return true;
  }

  get binary() {
    return true;
  }

  /**
   * Default options for exporting XLSX format.
   *
   * @returns {object}
   */
  static get DEFAULT_OPTIONS(): {
    mimeType: string;
    fileExtension: string;
    bom: boolean;
    engine: XlsxEngine | null;
    compression: boolean | number | null;
    conditionalFormatting: ConditionalFormattingDescriptor[];
    exportFormulas: boolean;
    headerStyle: { backgroundColor: string; border: { style: string } } | null;
    } {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
      bom: false,
      engine: null,
      // DEFLATE compression: true = level 6, number 1–9 = that level, falsy = no compression.
      compression: null,
      // Array of { rows?, cols?, rules } conditional formatting descriptors.
      conditionalFormatting: [],
      // When true, HyperFormula formula cells and ColumnSummary destinations are exported as live
      // Excel formulas. When false (default) the pre-calculated static values are exported.
      exportFormulas: false,
      // Style applied to column and row header cells. `backgroundColor` accepts any CSS hex color
      // string. `border` sets the border style on all four sides; set to `null` to suppress it.
      // Set the whole option to `null` to export headers with no styling at all.
      headerStyle: { backgroundColor: '#F2F2F2', border: { style: 'thin' } },
    };
  }

  /**
   * Builds an XLSX workbook and returns its binary buffer.
   *
   * When the `sheets` option is provided the workbook contains one worksheet per entry,
   * each driven by its own Handsontable instance. Otherwise a single worksheet named
   * `'Sheet1'` is produced from the primary DataProvider.
   *
   * @returns {Promise<Uint8Array>}
   */
  async export(): Promise<Uint8Array> {
    const engine = this.options.engine as unknown as XlsxEngine | null;

    if (!engine || typeof engine.Workbook !== 'function') {
      throwWithCause(
        'Missing or invalid ExcelJS engine. Pass the ExcelJS module via the `engines` option ' +
        'in the exportFile plugin settings: `exportFile: { engines: { xlsx: ExcelJS } }`.'
      );
    }

    // Clear style caches for all documents involved in this export. In multi-sheet
    // mode each sheet may come from a different Handsontable instance living in a
    // different document (e.g. an iframe), so every distinct document must be cleared.
    const sheets = this.options.sheets as unknown as XlsxSheetConfig[] | null | undefined;
    const docsToClear = sheets && sheets.length > 0
      ? new Set(sheets.map(s => s.instance.rootDocument))
      : new Set([this.dataProvider.hot.rootDocument]);

    docsToClear.forEach(doc => clearStyleCaches(doc as Document));

    const workbook = new engine.Workbook();

    if (sheets && sheets.length > 0) {
      // multi-sheet mode
      const usedSheetNames = new Set();

      sheets.forEach((sheetConfig) => {
        const dp = new DataProvider(sheetConfig.instance);
        // Apply the same legacy-alias promotion that _mergeOptions does for top-level
        // options: if the caller passed the deprecated `columnHeaders` on a per-sheet
        // config without also passing `colHeaders`, promote it so `dataProvider.js`
        // (which only reads `colHeaders`) picks it up correctly.
        const normalizedSheetConfig = ('columnHeaders' in sheetConfig && !('colHeaders' in sheetConfig))
          ? { ...sheetConfig, colHeaders: sheetConfig.columnHeaders }
          : sheetConfig;
        const sheetOptions = { ...this.options, ...normalizedSheetConfig };

        dp.setOptions(sheetOptions);

        const baseName = sheetConfig.name || 'Sheet';
        let name = baseName;
        let suffix = 1;

        while (usedSheetNames.has(name)) {
          name = `${baseName}${suffix}`;
          suffix += 1;
        }

        usedSheetNames.add(name);

        const worksheet = workbook.addWorksheet(name);

        this.#populateWorksheet(workbook, worksheet, dp, sheetOptions);
      });
    } else {
      // single-sheet mode
      const worksheet = workbook.addWorksheet('Sheet1');

      this.#populateWorksheet(workbook, worksheet, this.dataProvider, this.options);
    }

    return workbook.xlsx.writeBuffer(this.#getWriteOptions());
  }

  /**
   * Populates a single ExcelJS worksheet from the given DataProvider.
   *
   * Extracts the data writing logic shared between single-sheet and multi-sheet exports.
   *
   * @param {object} workbook The ExcelJS workbook.
   * @param {object} worksheet The ExcelJS worksheet to populate.
   * @param {DataProvider} dataProvider DataProvider configured for this sheet.
   * @param {object} options Merged options for this sheet.
   * @returns {number} Number of data rows written.
   */
  #populateWorksheet(
    workbook: ExcelJsWorkbook, worksheet: ExcelJsWorksheet, dataProvider: DataProvider,
    options: XlsxOptions
  ): number {
    const data = dataProvider.getData();
    const cellsMeta = dataProvider.getCellsMeta();
    const validationMap = this.#buildValidationSheet(workbook, cellsMeta);
    const cellElements = dataProvider.getCellElements();
    const columnHeaders = dataProvider.getColumnHeaders();
    const columnHeadersClassNames = dataProvider.getColumnHeadersClassNames();
    const rowHeaders = dataProvider.getRowHeaders();
    const columnsWidths = dataProvider.getColumnsWidths() as number[];
    const rowsHeights = dataProvider.getRowsHeights() as number[];
    const mergeCells = dataProvider.getMergeCells();
    const frozenRows = dataProvider.getFrozenRows();
    const frozenColumns = dataProvider.getFrozenColumns();
    const nestedColumnHeaders = dataProvider.getNestedColumnHeaders();
    const isRtl = dataProvider.getLayoutDirection() === 'rtl';
    const { exportFormulas } = options;

    // Build a fast O(1) lookup: "dataRowIndex:dataColIndex" → summary descriptor.
    // Always built so the protection pre-scan can identify ColumnSummary destination
    // cells; the formula-writing path also uses this map when exportFormulas is true.
    const summaryMap = new Map();
    const columnSummaries = dataProvider.getColumnSummaries();

    columnSummaries.forEach((summary: ColumnSummaryDescriptor) => {
      summaryMap.set(`${summary.destRow}:${summary.destCol}`, summary);
    });

    const sourceData = exportFormulas ? dataProvider.getSourceData() : null;
    const formulasSeparator = exportFormulas ? dataProvider.getFormulasSeparator() : ',';
    const hasColumnHeaders = columnHeaders.length > 0;
    const hasRowHeaders = rowHeaders.length > 0;
    const useNestedHeaders = nestedColumnHeaders !== null && hasColumnHeaders;

    let headerRowCount = 0;

    if (useNestedHeaders) {
      headerRowCount = nestedColumnHeaders.length;
    } else if (hasColumnHeaders) {
      headerRowCount = 1;
    }

    const dataRowOffset = headerRowCount + 1;
    const dataColOffset = hasRowHeaders ? 2 : 1;

    const excludedHiddenRows = exportFormulas ? dataProvider.getExcludedHiddenRows() : null;
    const excludedHiddenCols = exportFormulas ? dataProvider.getExcludedHiddenColumns() : null;

    const hiddenRowIndices = dataProvider.getHiddenRowDataIndices();
    const hiddenColIndices = dataProvider.getHiddenColumnDataIndices();

    const { rootDocument, rootWindow } = dataProvider.hot;

    this.#applyColumnWidths(worksheet, columnsWidths, hasRowHeaders);

    if (hiddenColIndices.length > 0) {
      this.#applyHiddenColumns(worksheet, hiddenColIndices, hasRowHeaders);
    }
    this.#applyWorksheetViews(worksheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl);

    const headerFill = this.#buildHeaderFill(options.headerStyle);
    const headerBorder = this.#buildHeaderBorder(options.headerStyle);

    if (useNestedHeaders) {
      this.#writeNestedColumnHeaders(
        worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );
      this.#applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
    } else if (hasColumnHeaders) {
      this.#writeColumnHeaders(
        worksheet, columnHeaders, columnHeadersClassNames, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );
    }

    // Pre-scan: only write cell.protection when the sheet actually contains cells
    // that should be locked in Excel. Two reasons to skip it entirely:
    //
    // 1. When ColumnSummary is active, its destination cells (and any adjacent label
    //    cells marked readOnly) are readOnly only to prevent in-grid editing. Locking
    //    those cells in Excel surprises users and adds no value, so protection is
    //    suppressed whenever ColumnSummary is present.
    //
    // 2. Setting protection on every cell — even { locked: false } — causes ExcelJS to
    //    initialise font/fill/border to sentinel values, which adds noise to the file
    //    and breaks styling assertions in tests.
    const hasColumnSummary = summaryMap.size > 0;
    const hasReadOnlyCells = !hasColumnSummary &&
      cellsMeta.some((row: unknown[]) =>
        row.some((meta: unknown) => (meta as Record<string, unknown>)?.readOnly === true));

    const context = {
      exportFormulas,
      formulasSeparator,
      dataRowOffset,
      dataColOffset,
      excludedHiddenRows,
      excludedHiddenCols,
      summaryMap,
      sourceData,
      hasRowHeaders,
      headerFill,
      headerBorder,
      hasReadOnlyCells,
      rootDocument,
      rootWindow,
      validationMap,
      cellsMeta,
      cellElements,
      rowHeaders,
      rowsHeights,
    };

    this.#writeDataRows(worksheet, data, context);

    if (hiddenRowIndices.length > 0) {
      this.#applyHiddenRows(worksheet, hiddenRowIndices, dataRowOffset);
    }

    if (hasReadOnlyCells) {
      // Protect the worksheet so that locked cells become read-only in Excel.
      // No password is set — users can unprotect at any time.
      // The permissive options keep non-editing actions (select, sort, filter,
      // resize) available so the spreadsheet remains usable.
      worksheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatColumns: true,
        formatRows: true,
        sort: true,
        autoFilter: true,
      });
    }

    mergeCells.forEach((merge: MergeDescriptor) => {
      const startRow = merge.row + dataRowOffset;
      const startCol = merge.col + dataColOffset;
      const endRow = startRow + merge.rowspan - 1;
      const endCol = startCol + merge.colspan - 1;

      worksheet.mergeCells(startRow, startCol, endRow, endCol);
    });

    const { conditionalFormatting } = options;

    if (conditionalFormatting && conditionalFormatting.length > 0) {
      this.#applyConditionalFormatting(
        worksheet,
        conditionalFormatting,
        dataRowOffset,
        dataColOffset,
        data.length,
        data[0]?.length ?? 0
      );
    }

    return data.length;
  }

  /**
   * Iterates the exported data rows and writes each to the worksheet.
   *
   * Handles row heights, row-header cells, and per-cell content and styling.
   * Delegates per-cell writing to {@link Xlsx##writeRowCells}.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array[]} data 2D data array from DataProvider.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeDataRows(worksheet: ExcelJsWorksheet, data: unknown[][], context: SheetContext): void {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const rowData = data[rowIndex];
      const excelRowNumber = rowIndex + context.dataRowOffset;
      const row = worksheet.getRow(excelRowNumber);

      if (isDefined(context.rowsHeights[rowIndex])) {
        row.height = context.rowsHeights[rowIndex] * PIXELS_TO_POINTS_RATIO;
      }

      if (context.hasRowHeaders) {
        const rowHeaderCell = row.getCell(1);

        rowHeaderCell.value = context.rowHeaders[rowIndex] ?? null;

        if (context.headerFill) {
          rowHeaderCell.fill = context.headerFill;
        }

        if (context.headerBorder) {
          rowHeaderCell.border = context.headerBorder;
        }
      }

      this.#writeRowCells(row, rowData, rowIndex, context);

      row.commit();
    }
  }

  /**
   * Writes all data cells in a single row to the worksheet.
   *
   * Resolves each cell's value and number format, then applies styling via
   * {@link Xlsx##writeCellStyling}.
   *
   * @param {object} row The ExcelJS row object.
   * @param {Array} rowData Cell values for this row.
   * @param {number} rowIndex 0-based data-array row index.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeRowCells(row: ExcelJsRow, rowData: unknown[], rowIndex: number, context: SheetContext): void {
    for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
      const cellValue = rowData[colIndex];
      const cell = row.getCell(colIndex + context.dataColOffset);
      const meta = context.cellsMeta[rowIndex][colIndex];
      const summary = context.summaryMap.get(`${rowIndex}:${colIndex}`);
      const sourceValue = context.sourceData?.[rowIndex][colIndex];
      const { value, numFmt } = this.#resolveCellValue(cellValue, meta, sourceValue, summary, context);

      cell.value = value;

      if (numFmt) {
        cell.numFmt = numFmt;
      }

      const cssStyle = getCssStyleFromElement(
        context.cellElements[rowIndex][colIndex], meta.className, context.rootDocument, context.rootWindow
      );

      this.#writeCellStyling(cell, meta, cssStyle, context);

      if (context.hasReadOnlyCells) {
        cell.protection = { locked: meta.readOnly === true };
      }
    }
  }

  /**
   * Applies all visual style properties from cell meta and computed CSS to an ExcelJS cell.
   *
   * Handles alignment, borders, font, fill, dropdown validation, and cell comments.
   * Protection is handled by the caller because it depends on a sheet-level flag.
   *
   * @param {object} cell The ExcelJS cell object.
   * @param {object|undefined} meta Cell meta object.
   * @param {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
   *           fontColor: string|null, backgroundColor: string|null }|null} cssStyle
   *   Computed CSS style from `getCssStyleFromElement`, or `null`.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeCellStyling(
    cell: ExcelJsCell, meta: CellMeta, cssStyle: CssStyle | null, context: SheetContext
  ): void {
    const alignment = getAlignmentFromMeta(meta);

    if (alignment) {
      cell.alignment = alignment;
    }

    const border = getBorderFromMeta(meta);

    if (border) {
      cell.border = border;
    }

    const font = getFontFromMeta(meta, cssStyle);

    if (font) {
      cell.font = font;
    }

    const fill = getFillFromMeta(meta, cssStyle);

    if (fill) {
      cell.fill = fill;
    }

    const rangeRef = Array.isArray(meta.source)
      ? (context.validationMap.get(JSON.stringify(meta.source)) ?? null)
      : null;
    const dropdownValidation = getDropdownValidation(meta, rangeRef);

    if (dropdownValidation) {
      cell.dataValidation = dropdownValidation;
    }

    if (meta.comment?.value) {
      cell.note = String(meta.comment.value);
    }
  }

  /**
   * Resolves the final ExcelJS cell value and optional number format for a data cell.
   *
   * Handles (in priority order):
   * 1. ColumnSummary formula destinations (when `exportFormulas` is `true`).
   * 2. HyperFormula formula cells (when `exportFormulas` is `true`).
   * 3. Date cells (ISO 8601 string → serial number).
   * 4. Time cells (time string → fractional day serial).
   * 5. Checkbox cells (boolean from `checkedTemplate` comparison).
   * 6. Multiselect cells (comma-separated string).
   * 7. All other cells (numeric-aware or stringified).
   *
   * @param {*} cellValue Pre-calculated display value from `getData()`.
   * @param {object} meta Cell meta object.
   * @param {*} sourceValue Raw source value from `getSourceDataAtCell()` (may be a formula string).
   * @param {object|undefined} summary ColumnSummary descriptor, or `undefined` for non-summary cells.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   * @returns {{ value: *, numFmt: string|null }}
   */
  #resolveCellValue(
    cellValue: unknown,
    meta: CellMeta,
    sourceValue: unknown,
    summary: ColumnSummaryDescriptor | undefined,
    context: SheetContext
  ): { value: ExcelCellValue; numFmt: string | null } {
    const {
      exportFormulas, formulasSeparator, dataRowOffset, dataColOffset,
      excludedHiddenRows, excludedHiddenCols,
    } = context;

    if (summary && exportFormulas) {
      const formula = buildSummaryFormula(summary, dataRowOffset, dataColOffset);
      const fallback = this.#getCellValue(cellValue, meta);

      return {
        value: formula ? { ...formula, result: cellValue as string | number | boolean | null } : fallback,
        numFmt: null,
      };
    }

    if (exportFormulas && isFormulaValue(sourceValue)) {
      return {
        value: {
          formula: normalizeFormula(
            sourceValue, formulasSeparator, dataRowOffset - 1, dataColOffset - 1,
            excludedHiddenRows, excludedHiddenCols
          ),
        },
        numFmt: null,
      };
    }

    if (meta.type === 'date' || meta.type === 'intl-date') {
      const serial = parseIsoStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, numFmt: getDateNumFmt() };
      }
    }

    if (meta.type === 'time' || meta.type === 'intl-time') {
      const serial = parseTimeStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, numFmt: getTimeNumFmt() };
      }
    }

    if (meta.type === 'checkbox') {
      return { value: this.#getCheckboxValue(cellValue, meta), numFmt: null };
    }

    if (meta.type === 'multiselect') {
      return { value: this.#getMultiSelectExportValue(cellValue), numFmt: null };
    }

    if (meta.type === 'numeric') {
      return {
        value: this.#getCellValue(cellValue, meta),
        numFmt: intlNumFormatToExcelNumFmt(meta.numericFormat, meta.locale),
      };
    }

    return { value: this.#getCellValue(cellValue, meta), numFmt: null };
  }

  /**
   * Converts a raw cell value to an ExcelJS-compatible value.
   *
   * @param {*} value Raw cell value.
   * @param {object} meta Cell meta object.
   * @returns {null|number|string}
   */
  #getCellValue(value: unknown, meta: CellMeta): null | number | string {
    if (value === null || value === undefined) {
      return null;
    }

    if (meta.type === 'numeric') {
      if (typeof value === 'number') {
        return value;
      }

      const numericValue = Number(value);

      return Number.isNaN(numericValue) ? stringify(value) : numericValue;
    }

    return stringify(value);
  }

  /**
   * Returns the boolean export value for a checkbox cell.
   *
   * @param {*} value Raw cell value.
   * @param {object} meta Cell meta object.
   * @returns {boolean}
   */
  #getCheckboxValue(value: unknown, meta: CellMeta): boolean {
    const checkedTemplate = meta.checkedTemplate ?? true;

    return value === checkedTemplate;
  }

  /**
   * Converts a multiselect cell value to a comma-separated display string.
   *
   * @param {*} value Raw multiselect cell value (expected to be an array).
   * @returns {string|null}
   */
  #getMultiSelectExportValue(value: unknown): string | null {
    if (!Array.isArray(value)) {
      return value === null || value === undefined ? null : stringify(value);
    }

    if (value.length === 0) {
      return null;
    }

    return value.map(item => (item !== null && typeof item === 'object' ? item.value : item)).join(', ');
  }

  /**
   * Builds an ExcelJS solid fill object from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` / has no `backgroundColor`, so
   * callers can skip applying a fill entirely (no default ExcelJS fill sentinel is set).
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderFill(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): object | null {
    if (!headerStyle?.backgroundColor) {
      return null;
    }

    return {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: cssColorToArgb(headerStyle.backgroundColor) },
    };
  }

  /**
   * Builds an ExcelJS border object (all four sides) from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` or has no `border` sub-option.
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderBorder(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): object | null {
    if (!headerStyle?.border) {
      return null;
    }

    const { style = 'thin', color } = headerStyle.border;
    const side = color ? { style, color: { argb: cssColorToArgb(color) } } : { style };

    return { top: side, bottom: side, left: side, right: side };
  }

  /**
   * Builds the options object passed to `workbook.xlsx.writeBuffer()`.
   *
   * The `compression` option enables DEFLATE compression: `true` uses the default
   * level 6; a number 1–9 sets the JSZip `compressionOptions.level` (1 = fastest,
   * 9 = smallest). Falsy or omitted leaves ExcelJS to use no compression.
   *
   * @returns {object}
   */
  #getWriteOptions(): object {
    const { compression } = this.options;

    let level = null;

    if (compression === true) {
      level = 6;
    } else if (typeof compression === 'number' && compression >= 1 && compression <= 9) {
      level = compression;
    }

    if (level === null) {
      return {};
    }

    return {
      zip: {
        compression: 'DEFLATE',
        compressionOptions: { level },
      },
    };
  }

  /**
   * Applies conditional formatting rules to the worksheet.
   *
   * Each descriptor in `cfRules` may specify a `rows` and/or `cols` range
   * (0-based, relative to the exported data — the same coordinate space as
   * `getDataAtCell`). Both are optional and default to the full data range.
   * The `rules` array is passed directly to ExcelJS's `addConditionalFormatting`.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array} cfRules Array of `{ rows?, cols?, rules }` descriptors.
   * @param {number} dataRowOffset 1-based Excel row where data starts.
   * @param {number} dataColOffset 1-based Excel column where data starts.
   * @param {number} dataRows Total number of exported data rows.
   * @param {number} dataCols Total number of exported data columns.
   */
  #applyConditionalFormatting(
    worksheet: ExcelJsWorksheet, cfRules: ConditionalFormattingDescriptor[],
    dataRowOffset: number, dataColOffset: number, dataRows: number, dataCols: number
  ): void {
    if (dataRows === 0 || dataCols === 0) {
      return;
    }

    cfRules.forEach(({ rows, cols, rules }) => {
      if (!rules || rules.length === 0) {
        return;
      }

      const startRow = (rows ? rows[0] : 0) + dataRowOffset;
      const endRow = (rows ? rows[1] : dataRows - 1) + dataRowOffset;
      const startCol = (cols ? cols[0] : 0) + dataColOffset;
      const endCol = (cols ? cols[1] : dataCols - 1) + dataColOffset;

      worksheet.addConditionalFormatting({
        ref: this.#buildRangeRef(startRow, startCol, endRow, endCol),
        rules,
      });
    });
  }

  /**
   * Builds an Excel cell-range reference string (e.g. `'B2:E7'`) from 1-based
   * row and column indices.
   *
   * @param {number} startRow 1-based start row.
   * @param {number} startCol 1-based start column.
   * @param {number} endRow 1-based end row.
   * @param {number} endCol 1-based end column.
   * @returns {string}
   */
  #buildRangeRef(startRow: number, startCol: number, endRow: number, endCol: number): string {
    return `${colIndexToLetter(startCol)}${startRow}:${colIndexToLetter(endCol)}${endRow}`;
  }

  /**
   * Sets column widths on the worksheet, converting pixel values to Excel
   * character-width units.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number[]} widths Column widths in pixels, in data-column order.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyColumnWidths(worksheet: ExcelJsWorksheet, widths: number[], hasRowHeaders: boolean): void {
    if (hasRowHeaders) {
      worksheet.getColumn(1).width = ROW_HEADER_DEFAULT_WIDTH;
    }

    const offset = hasRowHeaders ? 1 : 0;

    for (let index = 0; index < widths.length; index++) {
      worksheet.getColumn(index + 1 + offset).width =
        Math.max(widths[index] / PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, 1);
    }
  }

  /**
   * Marks the specified Excel columns as hidden.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number[]} hiddenColIndices 0-based data-column indices to hide.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyHiddenColumns(worksheet: ExcelJsWorksheet, hiddenColIndices: number[], hasRowHeaders: boolean): void {
    const offset = hasRowHeaders ? 1 : 0;

    hiddenColIndices.forEach((dataColIndex) => {
      worksheet.getColumn(dataColIndex + 1 + offset).hidden = true;
    });
  }

  /**
   * Marks the specified Excel rows as hidden.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number[]} hiddenRowIndices 0-based data-row indices to hide.
   * @param {number} dataRowOffset 1-based Excel row number where data row 0 starts.
   */
  #applyHiddenRows(worksheet: ExcelJsWorksheet, hiddenRowIndices: number[], dataRowOffset: number): void {
    hiddenRowIndices.forEach((dataRowIndex) => {
      worksheet.getRow(dataRowIndex + dataRowOffset).hidden = true;
    });
  }

  /**
   * Configures the worksheet view, combining frozen panes and RTL direction settings.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number} frozenRows Number of frozen data rows.
   * @param {number} frozenColumns Number of frozen data columns.
   * @param {number} headerRowCount Number of header rows prepended before data rows.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {boolean} isRtl Whether the table layout direction is right-to-left.
   */
  #applyWorksheetViews(
    worksheet: ExcelJsWorksheet, frozenRows: number, frozenColumns: number,
    headerRowCount: number, hasRowHeaders: boolean, isRtl: boolean
  ): void {
    const hasFrozenPanes = frozenRows > 0 || frozenColumns > 0;

    if (!hasFrozenPanes && !isRtl) {
      return;
    }

    const view: ExcelJsView = {};

    if (isRtl) {
      view.rightToLeft = true;
    }

    if (hasFrozenPanes) {
      view.state = 'frozen';
      view.xSplit = frozenColumns + (hasRowHeaders ? 1 : 0);
      view.ySplit = frozenRows + headerRowCount;
    }

    worksheet.views = [view];
  }

  /**
   * Writes the column-header row to the worksheet, applying alignment derived from
   * each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array} columnHeaders Header values.
   * @param {string[]} classNames Per-header className strings (same order as `columnHeaders`).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended (leaves cell A1 empty).
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill ExcelJS fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder ExcelJS border object for header cells, or `null` for no border.
   */
  #writeColumnHeaders(
    worksheet: ExcelJsWorksheet, columnHeaders: Array<string | number | null>,
    classNames: string[], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: object | null, headerBorder: object | null
  ): void {
    const headerRow = worksheet.getRow(1);

    if (hasRowHeaders) {
      const cornerCell = headerRow.getCell(1);

      cornerCell.value = '';

      if (headerFill) {
        cornerCell.fill = headerFill;
      }

      if (headerBorder) {
        cornerCell.border = headerBorder;
      }
    }

    for (let index = 0; index < columnHeaders.length; index++) {
      const cell = headerRow.getCell(index + dataColOffset);

      cell.value = columnHeaders[index] ?? null;

      const alignment = getAlignmentFromClassName(classNames[index]);

      if (alignment) {
        cell.alignment = alignment;
      }

      if (headerFill) {
        cell.fill = headerFill;
      }

      if (headerBorder) {
        cell.border = headerBorder;
      }
    }

    headerRow.commit();
  }

  /**
   * Writes multi-row nested column headers to the worksheet, applying alignment derived
   * from each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill ExcelJS fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder ExcelJS border object for header cells, or `null` for no border.
   */
  #writeNestedColumnHeaders(
    worksheet: ExcelJsWorksheet, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: object | null, headerBorder: object | null
  ): void {
    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const row = worksheet.getRow(layerIndex + 1);

      if (hasRowHeaders && layerIndex === 0) {
        const cornerCell = row.getCell(1);

        cornerCell.value = '';

        if (headerFill) {
          cornerCell.fill = headerFill;
        }

        if (headerBorder) {
          cornerCell.border = headerBorder;
        }
      }

      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        const cell = row.getCell(colPos);

        cell.value = header.label ?? null;

        const alignment = getAlignmentFromClassName(header.className);

        if (alignment) {
          cell.alignment = alignment;
        }

        if (headerFill) {
          cell.fill = headerFill;
        }

        if (headerBorder) {
          cell.border = headerBorder;
        }

        colPos += header.colspan;
      });

      row.commit();
    }
  }

  /**
   * Merges spanning cells in nested header rows.
   *
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  #applyNestedHeaderMerges(
    worksheet: ExcelJsWorksheet, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number
  ): void {
    if (hasRowHeaders && nestedColumnHeaders.length > 1) {
      worksheet.mergeCells(1, 1, nestedColumnHeaders.length, 1);
    }

    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const excelRow = layerIndex + 1;
      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        if (header.colspan > 1) {
          worksheet.mergeCells(excelRow, colPos, excelRow, colPos + header.colspan - 1);
        }

        colPos += header.colspan;
      });
    }
  }

  /**
   * Creates a `veryHidden` worksheet containing all unique dropdown/autocomplete
   * source arrays as columns. Returns a map from `JSON.stringify(source)` to an
   * Excel range-reference string pointing at that column.
   *
   * If no dropdown or autocomplete cells with array sources are found, returns an
   * empty map and does not add any worksheet to the workbook.
   *
   * @private
   * @param {object} workbook The ExcelJS workbook.
   * @param {Array[]} cellsMeta 2D meta array from DataProvider.
   * @returns {Map<string, string>} Map from source JSON key to range reference.
   */
  #buildValidationSheet(workbook: ExcelJsWorkbook, cellsMeta: CellMeta[][]): Map<string, string> {
    const sourceMap = new Map();

    for (let rowIndex = 0; rowIndex < cellsMeta.length; rowIndex++) {
      for (let colIndex = 0; colIndex < cellsMeta[rowIndex].length; colIndex++) {
        const meta = cellsMeta[rowIndex][colIndex];
        const isDropdown = meta.type === 'dropdown' || meta.type === 'autocomplete';

        if (isDropdown && Array.isArray(meta.source) && meta.source.length > 0) {
          const key = JSON.stringify(meta.source);

          if (!sourceMap.has(key)) {
            sourceMap.set(key, meta.source);
          }
        }
      }
    }

    if (sourceMap.size === 0) {
      return new Map();
    }

    const existingNames = new Set(workbook.worksheets.map((ws: { name: string }) => ws.name));
    let sheetName = '_HotValidation';
    let suffix = 1;

    while (existingNames.has(sheetName)) {
      sheetName = `_HotValidation${suffix}`;
      suffix += 1;
    }

    const validationSheet = workbook.addWorksheet(sheetName);

    validationSheet.state = 'veryHidden';

    const validationMap = new Map();
    let colNumber = 1;

    sourceMap.forEach((source, key) => {
      for (let rowNumber = 0; rowNumber < source.length; rowNumber++) {
        const item = source[rowNumber];

        validationSheet.getCell(rowNumber + 1, colNumber).value = isKeyValueObject(item)
          ? String(item.value)
          : String(item);
      }

      const colLetter = colIndexToLetter(colNumber);
      const escapedName = sheetName.replaceAll('\'', '\'\'');
      const rangeRef = `'${escapedName}'!$${colLetter}$1:$${colLetter}$${source.length}`;

      validationMap.set(key, rangeRef);
      colNumber += 1;
    });

    return validationMap;
  }
}

export default Xlsx;
