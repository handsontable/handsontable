import { isDefined, stringify } from '../../../helpers/mixed';
import { isKeyValueObject } from '../../../helpers/object';
import DataProvider from '../dataProvider';
import BaseType from './_base';
import { normalizeExportOptions } from '../utils';
import {
  buildSummaryFormula,
  normalizeFormula,
  isFormulaValue,
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
  parseIsoDateTimeStringToSerial,
  intlDateFmtToExcelNumFmt,
  intlTimeFmtToExcelNumFmt,
  intlDateTimeFmtToExcelNumFmt,
} from './xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from './xlsx/numeric-utils';
import { detectXlsxEngine } from '../../../utils/xlsxEngine/detect';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { SheetBuilder } from '../../../utils/xlsxEngine/builder';
import { colIndexToLetter, toRangeRef } from '../../../utils/xlsxEngine/cellRef';
import {
  PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT,
  POINTS_PER_PIXEL as PIXELS_TO_POINTS_RATIO,
} from '../../../utils/xlsxEngine/units';
import {
  createWorkbookSnapshot,
  type CellFormula,
  type CellSnapshot,
  type CellStyleSnapshot,
  type CellValidationSnapshot,
  type CellValue,
  type SheetSnapshot,
  type WorkbookSnapshot,
} from '../../../utils/xlsxEngine/model';
import type { HotInstance } from '../../../core/types';

/**
 * The longest worksheet name the XLSX format accepts. A longer one is truncated by Excel itself,
 * and by ExcelJS with a console warning.
 */
const SHEET_NAME_MAX_LENGTH = 31;

/**
 * The characters a worksheet name may not contain: `* ? : / \ [ ]`.
 */
const ILLEGAL_SHEET_NAME_CHARS = /[*?:/\\[\]]/g;

/**
 * The name used when sanitization leaves nothing behind (a sheet named `"[*]"`, say).
 */
const FALLBACK_SHEET_NAME = 'Sheet';

/**
 * The name the XLSX format reserves for a workbook's change history.
 */
const RESERVED_SHEET_NAME = 'History';

/**
 * The base name of the very hidden helper sheet carrying the dropdown source lists.
 */
const VALIDATION_SHEET_NAME = '_HotValidation';

/**
 * Turns a user-supplied sheet name into one the format accepts: illegal characters removed, leading
 * and trailing single quotes stripped, the reserved `History` renamed, and an empty result replaced.
 * The reserved name is matched in any case: ExcelJS rejects the exact `History` only, but Excel
 * reserves the name case-insensitively, the same way it compares names for duplicates.
 *
 * This is the only place the export enforces the rules, and it has to: ExcelJS answers each of them
 * with a thrown `Error`, so a grid whose sheet name carries a colon — a date, `Q1: Sales` — used to
 * abandon the whole export rather than exporting under a slightly different name.
 */
function sanitizeSheetName(baseName: string): string {
  // Trim on BOTH sides of the quote strip. ExcelJS tests the name it is handed, so `" 'Q1' "` with
  // the trim last still reaches it as `"'Q1'"` — quotes at the ends, and rejected.
  const stripped = baseName
    .replace(ILLEGAL_SHEET_NAME_CHARS, '')
    .trim()
    .replace(/^'+/, '')
    .replace(/'+$/, '')
    .trim();

  if (stripped === '') {
    return FALLBACK_SHEET_NAME;
  }

  return stripped.toLowerCase() === RESERVED_SHEET_NAME.toLowerCase() ? `${stripped}_` : stripped;
}

/**
 * Cuts a sanitized sheet name down to `maxLength`, dropping any single quote the cut left at the
 * end. An interior quote is legal, a trailing one is not — and ExcelJS checks for it before its own
 * truncation, so it would reject a name only this cut had made end in one.
 */
function truncateSheetName(name: string, maxLength: number): string {
  const sliced = name.slice(0, maxLength).replace(/'+$/, '');

  return sliced === '' ? FALLBACK_SHEET_NAME : sliced;
}

/**
 * Narrows a pre-calculated display value to the primitives a cached formula result may carry.
 *
 * ExcelJS throws `I could not understand type of value` for anything else, so an object or an array
 * left in a cell by a custom renderer would abandon the export from inside the summary branch.
 */
function toPrimitiveResult(value: unknown): CellValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return null;
}

/**
 * Resolves the Excel number format a cell's meta describes, independently of the value the cell
 * holds. A formula cell resolves the same format a value cell of that type would, so a column of
 * live formulas keeps the column's own format instead of reaching the file unformatted — which the
 * import then reads back as `text`.
 */
function resolveMetaNumFmt(meta: CellMeta): string | null {
  switch (meta.type) {
    case 'intl-datetime':
      return intlDateTimeFmtToExcelNumFmt(meta.dateTimeFormat, meta.locale);
    case 'date':
    case 'intl-date':
      return intlDateFmtToExcelNumFmt(meta.dateFormat, meta.locale);
    case 'time':
    case 'intl-time':
      return intlTimeFmtToExcelNumFmt(meta.timeFormat, meta.locale);
    case 'numeric':
      return intlNumFormatToExcelNumFmt(meta.numericFormat, meta.locale);
    default:
      return null;
  }
}

/**
 * The fill shape a header cell carries in the neutral cell model.
 */
type HeaderFill = NonNullable<NonNullable<CellSnapshot['style']>['fill']>;

/**
 * The border shape a header cell carries in the neutral cell model.
 */
type HeaderBorder = NonNullable<NonNullable<CellSnapshot['style']>['border']>;

/**
 * Descriptor for a merge cell, in data-array coordinate space.
 */
interface MergeDescriptor {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * Descriptor for a ColumnSummary destination, in data-array coordinate space.
 */
interface ColumnSummaryDescriptor {
  type: string;
  destRow: number;
  destCol: number;
  sourceCol: number;
  sourceRanges: [number, number][];
}

/**
 * One entry in the `conditionalFormatting` option array.
 */
interface ConditionalFormattingDescriptor {
  rows?: [number, number];
  cols?: [number, number];
  rules: unknown[];
}

/**
 * An entry in a nested-header layer returned by DataProvider#getNestedColumnHeaders.
 */
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
  headerFill: HeaderFill | null;
  headerBorder: HeaderBorder | null;
  hasReadOnlyCells: boolean;
  rootDocument: Document;
  rootWindow: Window;
  validationMap: Map<string, string>;
  cellsMeta: CellMeta[][];
  cellElements: Array<Array<HTMLElement | null>>;
  rowHeaders: Array<string | number | null>;
  rowsHeights: number[];
}

interface XlsxSheetConfig {
  instance: HotInstance;
  name?: string;
  [key: string]: unknown;
}

// Default width (in Excel column-width units) assigned to the frozen row-header column
// when row headers are exported. Chosen to comfortably fit typical row-index numbers.
const ROW_HEADER_DEFAULT_WIDTH = 5;

/**
 * Typed view of the options object used internally within the Xlsx exporter.
 */
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

  /**
   * Returns true to indicate that XLSX data should be treated as binary output.
   */
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
    engine: object | null;
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
      // DEFLATE compression: null (the default) and true = level 6, a number 1–9 = that level,
      // false = stored. The default has always been DEFLATE: before the option was mapped
      // explicitly, an absent `zip` option left JSZip on its own DEFLATE default.
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
    const detected = detectXlsxEngine(this.options.engine, 'exportFile');

    // Clear style caches for all documents involved in this export. In multi-sheet
    // mode each sheet may come from a different Handsontable instance living in a
    // different document (e.g. an iframe), so every distinct document must be cleared.
    const sheets = this.options.sheets as unknown as XlsxSheetConfig[] | null | undefined;
    const docsToClear = sheets && sheets.length > 0
      ? new Set(sheets.map(s => s.instance.rootDocument))
      : new Set([this.dataProvider.hot.rootDocument]);

    docsToClear.forEach(doc => clearStyleCaches(doc as Document));

    const workbook = createWorkbookSnapshot();

    workbook.compression = this.#getCompressionLevel();

    // Every name the workbook takes, lower-cased: ExcelJS compares names case-insensitively and
    // throws on a duplicate. The `_HotValidation` helper sheets share the set, so a data sheet
    // carrying that name can never collide with one.
    const usedSheetNames = new Set<string>();

    if (sheets && sheets.length > 0) {
      // multi-sheet mode
      sheets.forEach((sheetConfig) => {
        const dp = new DataProvider(sheetConfig.instance);
        // Promote the deprecated `columnHeaders` alias on the per-sheet config before it is merged
        // with the already-normalized top-level options, which carry `colHeaders` either way.
        const sheetOptions = { ...this.options, ...normalizeExportOptions(sheetConfig) };

        dp.setOptions(sheetOptions);

        const name = this.#uniqueSheetName(sheetConfig.name || 'Sheet', usedSheetNames);

        this.#populateWorksheet(workbook, name, dp, sheetOptions, usedSheetNames);
      });
    } else {
      // single-sheet mode
      const name = this.#uniqueSheetName('Sheet1', usedSheetNames);

      this.#populateWorksheet(workbook, name, this.dataProvider, this.options, usedSheetNames);
    }

    const dropped = new DroppedFeatures();
    const bytes = await detected.adapter.write(workbook, detected.module, dropped);

    dropped.warn(detected.kind);

    return bytes;
  }

  /**
   * Returns a sheet name the XLSX format accepts and the workbook does not already use, and records
   * it as used.
   *
   * The name is sanitized first, then truncated, then de-duplicated — in that order. Truncating
   * last would let two distinct 35-character names that differ only past character 31 collide
   * *after* the de-duplication had already passed them, which ExcelJS answers by throwing. The
   * counter is made room for inside the 31 characters for the same reason. Comparison is
   * case-insensitive because ExcelJS's own duplicate check is.
   */
  #uniqueSheetName(baseName: string, usedSheetNames: Set<string>): string {
    const sanitized = sanitizeSheetName(baseName);
    let name = truncateSheetName(sanitized, SHEET_NAME_MAX_LENGTH);
    let suffix = 1;

    while (usedSheetNames.has(name.toLowerCase())) {
      const counter = String(suffix);

      name = `${truncateSheetName(sanitized, SHEET_NAME_MAX_LENGTH - counter.length)}${counter}`;
      suffix += 1;
    }

    usedSheetNames.add(name.toLowerCase());

    return name;
  }

  /**
   * Populates a single worksheet snapshot from the given DataProvider and pushes it into
   * the workbook snapshot, followed by its dropdown-source helper sheet.
   *
   * Extracts the data writing logic shared between single-sheet and multi-sheet exports.
   *
   * `usedSheetNames` is the workbook-wide set of lower-cased names already taken; it is passed
   * through so the dropdown-source helper sheet is named from the same set as the data sheets.
   *
   * @param {object} workbook The neutral workbook snapshot.
   * @param {string} name The worksheet name.
   * @param {DataProvider} dataProvider DataProvider configured for this sheet.
   * @param {object} options Merged options for this sheet.
   * @returns {number} Number of data rows written.
   */
  #populateWorksheet(
    workbook: WorkbookSnapshot, name: string, dataProvider: DataProvider,
    options: XlsxOptions, usedSheetNames: Set<string>
  ): number {
    const sheet = new SheetBuilder(name);
    const data = dataProvider.getData();
    const cellsMeta = dataProvider.getCellsMeta();
    const { validationMap, sheet: validationSheet } = this.#buildValidationSheet(usedSheetNames, cellsMeta);
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
    const exportFormulas: boolean = options.exportFormulas ?? false;

    // Build a fast O(1) lookup: "dataRowIndex:dataColIndex" → summary descriptor.
    // Always built so the protection pre-scan can identify ColumnSummary destination
    // cells; the formula-writing path also uses this map when exportFormulas is true.
    const summaryMap = new Map();
    const columnSummaries = dataProvider.getColumnSummaries();

    columnSummaries.forEach((summaryRaw: object) => {
      const summary = summaryRaw as ColumnSummaryDescriptor;

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

    this.#applyColumnWidths(sheet, columnsWidths, hasRowHeaders);

    if (hiddenColIndices.length > 0) {
      this.#applyHiddenColumns(sheet, hiddenColIndices, hasRowHeaders);
    }
    this.#applyWorksheetViews(sheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl);

    const headerFill = this.#buildHeaderFill(options.headerStyle);
    const headerBorder = this.#buildHeaderBorder(options.headerStyle);

    if (useNestedHeaders) {
      this.#writeNestedColumnHeaders(
        sheet, nestedColumnHeaders, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );
      this.#applyNestedHeaderMerges(sheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
    } else if (hasColumnHeaders) {
      this.#writeColumnHeaders(
        sheet, columnHeaders, columnHeadersClassNames, hasRowHeaders, dataColOffset, headerFill, headerBorder
      );
    }

    // Pre-scan: only write cell protection when the sheet actually contains cells
    // that should be locked in Excel. Two reasons to skip it entirely:
    //
    // 1. When ColumnSummary is active, its destination cells (and any adjacent label
    //    cells marked readOnly) are readOnly only to prevent in-grid editing. Locking
    //    those cells in Excel surprises users and adds no value, so protection is
    //    suppressed whenever ColumnSummary is present.
    //
    // 2. Setting protection on every cell — even { locked: false } — causes ExcelJS to
    //    initialize font/fill/border to sentinel values, which adds noise to the file
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

    this.#writeDataRows(sheet, data, context);

    if (hiddenRowIndices.length > 0) {
      this.#applyHiddenRows(sheet, hiddenRowIndices, dataRowOffset);
    }

    if (hasReadOnlyCells) {
      // Protect the worksheet so that locked cells become read-only in Excel.
      // No password is set — users can unprotect at any time.
      // The permissive options keep non-editing actions (select, sort, filter,
      // resize) available so the spreadsheet remains usable.
      sheet.protect('', {
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

      sheet.merge(startRow, startCol, startRow + merge.rowspan - 1, startCol + merge.colspan - 1);
    });

    const { conditionalFormatting } = options;

    if (conditionalFormatting && conditionalFormatting.length > 0) {
      this.#applyConditionalFormatting(
        sheet,
        conditionalFormatting,
        dataRowOffset,
        dataColOffset,
        data.length,
        data[0]?.length ?? 0
      );
    }

    workbook.sheets.push(sheet.toSnapshot());

    if (validationSheet) {
      workbook.sheets.push(validationSheet);
    }

    return data.length;
  }

  /**
   * Iterates the exported data rows and writes each to the sheet.
   *
   * Handles row heights, row-header cells, and per-cell content and styling.
   * Delegates per-cell writing to {@link Xlsx##writeRowCells}.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} data 2D data array from DataProvider.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeDataRows(sheet: SheetBuilder, data: unknown[][], context: SheetContext): void {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const rowData = data[rowIndex];
      const excelRowNumber = rowIndex + context.dataRowOffset;

      if (isDefined(context.rowsHeights[rowIndex])) {
        sheet.setRowHeight(excelRowNumber, context.rowsHeights[rowIndex] * PIXELS_TO_POINTS_RATIO);
      }

      if (context.hasRowHeaders) {
        const rowHeaderCell = sheet.cell(excelRowNumber, 1);

        rowHeaderCell.value = context.rowHeaders[rowIndex] ?? null;
        this.#applyHeaderStyle(rowHeaderCell, null, context.headerFill, context.headerBorder);
      }

      this.#writeRowCells(sheet, excelRowNumber, rowData, rowIndex, context);
    }
  }

  /**
   * Writes all data cells in a single row to the sheet, at the 1-based Excel row number the
   * caller resolved for it.
   *
   * Resolves each cell's value and number format, then applies styling via
   * {@link Xlsx##writeCellStyling}.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} rowData Cell values for this row.
   * @param {number} rowIndex 0-based data-array row index.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeRowCells(
    sheet: SheetBuilder, excelRowNumber: number, rowData: unknown[], rowIndex: number, context: SheetContext
  ): void {
    for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
      const cellValue = rowData[colIndex];
      const cell = sheet.cell(excelRowNumber, colIndex + context.dataColOffset);
      const meta = context.cellsMeta[rowIndex][colIndex];
      const summary = context.summaryMap.get(`${rowIndex}:${colIndex}`);
      const sourceValue = context.sourceData?.[rowIndex][colIndex];
      const { value, formula, numFmt } = this.#resolveCellValue(cellValue, meta, sourceValue, summary, context);

      cell.value = value;
      cell.formula = formula;
      cell.numFmt = numFmt;

      const cssStyle = getCssStyleFromElement(
        context.cellElements[rowIndex][colIndex], meta.className, context.rootDocument, context.rootWindow
      );

      this.#writeCellStyling(cell, meta, cssStyle, context);

      if (context.hasReadOnlyCells) {
        cell.locked = meta.readOnly === true;
      }
    }
  }

  /**
   * Applies all visual style properties from cell meta and computed CSS to a model cell.
   *
   * Handles alignment, borders, font, fill, dropdown validation, and cell comments.
   * Protection is handled by the caller because it depends on a sheet-level flag.
   *
   * @param {object} cell The model cell snapshot.
   * @param {object|undefined} meta Cell meta object.
   * @param {{ fontBold: boolean, fontItalic: boolean, fontUnderline: boolean,
   *           fontColor: string|null, backgroundColor: string|null }|null} cssStyle
   *   Computed CSS style from `getCssStyleFromElement`, or `null`.
   * @param {object} context Sheet-level context passed through from `#populateWorksheet`.
   */
  #writeCellStyling(
    cell: CellSnapshot, meta: CellMeta, cssStyle: CssStyle | null, context: SheetContext
  ): void {
    const alignment = getAlignmentFromMeta(meta);
    const border = getBorderFromMeta(meta);
    const font = getFontFromMeta(meta, cssStyle);
    const fill = getFillFromMeta(meta, cssStyle);

    if (alignment || border || font || fill) {
      cell.style = { alignment, border, font, fill };
    }

    const rangeRef = Array.isArray(meta.source)
      ? (context.validationMap.get(JSON.stringify(meta.source)) ?? null)
      : null;
    const dropdownValidation = getDropdownValidation(meta, rangeRef);

    if (dropdownValidation) {
      cell.validation = dropdownValidation;
    }

    if (meta.comment?.value) {
      cell.comment = String(meta.comment.value);
    }
  }

  /**
   * Resolves the final model cell value, formula and optional number format for a data cell.
   *
   * Handles (in priority order):
   * 1. ColumnSummary formula destinations (when `exportFormulas` is `true`).
   * 2. HyperFormula formula cells (when `exportFormulas` is `true`) — written with the number
   *    format their column's meta describes and with the pre-calculated value cached as the
   *    formula's `result`.
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
   * @returns {{ value: *, formula: object|null, numFmt: string|null }}
   */
  #resolveCellValue(
    cellValue: unknown,
    meta: CellMeta,
    sourceValue: unknown,
    summary: ColumnSummaryDescriptor | undefined,
    context: SheetContext
  ): { value: CellValue; formula: CellFormula | null; numFmt: string | null } {
    const {
      exportFormulas, formulasSeparator, dataRowOffset, dataColOffset,
      excludedHiddenRows, excludedHiddenCols,
    } = context;

    if (summary && exportFormulas) {
      const formula = buildSummaryFormula(summary, dataRowOffset, dataColOffset);
      const fallback = this.#getCellValue(cellValue, meta);

      return formula
        ? { value: null, formula: { text: formula.formula, result: toPrimitiveResult(cellValue) }, numFmt: null }
        : { value: fallback, formula: null, numFmt: null };
    }

    if (exportFormulas && isFormulaValue(sourceValue)) {
      return {
        value: null,
        formula: {
          text: normalizeFormula(
            sourceValue, formulasSeparator, dataRowOffset - 1, dataColOffset - 1,
            excludedHiddenRows ?? undefined, excludedHiddenCols ?? undefined
          ),
          result: toPrimitiveResult(cellValue),
        },
        numFmt: resolveMetaNumFmt(meta),
      };
    }

    if (meta.type === 'intl-datetime') {
      const serial = parseIsoDateTimeStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, formula: null, numFmt: resolveMetaNumFmt(meta) };
      }
    }

    if (meta.type === 'date' || meta.type === 'intl-date') {
      const serial = parseIsoStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, formula: null, numFmt: resolveMetaNumFmt(meta) };
      }
    }

    if (meta.type === 'time' || meta.type === 'intl-time') {
      const serial = parseTimeStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, formula: null, numFmt: resolveMetaNumFmt(meta) };
      }
    }

    if (meta.type === 'checkbox') {
      return { value: this.#getCheckboxValue(cellValue, meta), formula: null, numFmt: null };
    }

    if (meta.type === 'multiselect') {
      return { value: this.#getMultiSelectExportValue(cellValue), formula: null, numFmt: null };
    }

    if (meta.type === 'numeric') {
      return { value: this.#getCellValue(cellValue, meta), formula: null, numFmt: resolveMetaNumFmt(meta) };
    }

    return { value: this.#getCellValue(cellValue, meta), formula: null, numFmt: null };
  }

  /**
   * Converts a raw cell value to a neutral model `CellValue`.
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

    return value
      .map(item => (item !== null && typeof item === 'object'
        ? String((item as { value: unknown }).value)
        : String(item)))
      .join(', ');
  }

  /**
   * Builds a solid fill object from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` / has no `backgroundColor`, so
   * callers can skip applying a fill entirely (no default engine fill sentinel is set).
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderFill(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): HeaderFill | null {
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
   * Builds a border object (all four sides) from a `headerStyle` option value.
   *
   * Returns `null` when `headerStyle` is `null` or has no `border` sub-option.
   *
   * @param {object|null|undefined} headerStyle The `headerStyle` option value.
   * @returns {object|null}
   */
  #buildHeaderBorder(
    headerStyle: { backgroundColor?: string; border?: { style?: string; color?: string } | null } | null | undefined
  ): HeaderBorder | null {
    if (!headerStyle?.border) {
      return null;
    }

    const { style = 'thin', color } = headerStyle.border;
    const side = color ? { style, color: { argb: cssColorToArgb(color) } } : { style };

    return { top: side, bottom: side, left: side, right: side };
  }

  /**
   * Applies the header fill, border and optional alignment to a header cell.
   */
  #applyHeaderStyle(
    cell: CellSnapshot, alignment: CellStyleSnapshot['alignment'],
    fill: HeaderFill | null, border: HeaderBorder | null
  ): void {
    if (!alignment && !fill && !border) {
      return;
    }

    cell.style = { alignment: alignment ?? null, font: null, fill, border };
  }

  /**
   * Maps the `compression` option to the neutral level: `false` = stored, a number 1–9 = that
   * DEFLATE level, anything else (`true`, `null`, `undefined`) = DEFLATE level 6. Only an explicit
   * `false` turns compression off: the default has been DEFLATE since the option existed, and an
   * unset option must keep producing the same file size.
   */
  #getCompressionLevel(): false | number {
    const { compression } = this.options;

    if (compression === false) {
      return false;
    }

    if (typeof compression === 'number' && compression >= 1 && compression <= 9) {
      return compression;
    }

    return 6;
  }

  /**
   * Applies conditional formatting rules to the sheet.
   *
   * Each descriptor in `cfRules` may specify a `rows` and/or `cols` range
   * (0-based, relative to the exported data — the same coordinate space as
   * `getDataAtCell`). Both are optional and default to the full data range.
   * The `rules` array is carried through to the engine unchanged.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} cfRules Array of `{ rows?, cols?, rules }` descriptors.
   * @param {number} dataRowOffset 1-based Excel row where data starts.
   * @param {number} dataColOffset 1-based Excel column where data starts.
   * @param {number} dataRows Total number of exported data rows.
   * @param {number} dataCols Total number of exported data columns.
   */
  #applyConditionalFormatting(
    sheet: SheetBuilder, cfRules: ConditionalFormattingDescriptor[],
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

      sheet.addConditionalFormatting(toRangeRef(startRow, startCol, endRow, endCol), rules);
    });
  }

  /**
   * Sets column widths on the sheet, converting pixel values to Excel
   * character-width units.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} widths Column widths in pixels, in data-column order.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyColumnWidths(sheet: SheetBuilder, widths: number[], hasRowHeaders: boolean): void {
    if (hasRowHeaders) {
      sheet.setColWidth(1, ROW_HEADER_DEFAULT_WIDTH);
    }

    const offset = hasRowHeaders ? 1 : 0;

    for (let index = 0; index < widths.length; index++) {
      sheet.setColWidth(index + 1 + offset, Math.max(widths[index] / PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, 1));
    }
  }

  /**
   * Marks the specified Excel columns as hidden.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} hiddenColIndices 0-based data-column indices to hide.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyHiddenColumns(sheet: SheetBuilder, hiddenColIndices: number[], hasRowHeaders: boolean): void {
    const offset = hasRowHeaders ? 1 : 0;

    hiddenColIndices.forEach((dataColIndex) => {
      sheet.hideCol(dataColIndex + 1 + offset);
    });
  }

  /**
   * Marks the specified Excel rows as hidden.
   *
   * @param {object} sheet The sheet builder.
   * @param {number[]} hiddenRowIndices 0-based data-row indices to hide.
   * @param {number} dataRowOffset 1-based Excel row number where data row 0 starts.
   */
  #applyHiddenRows(sheet: SheetBuilder, hiddenRowIndices: number[], dataRowOffset: number): void {
    hiddenRowIndices.forEach((dataRowIndex) => {
      sheet.hideRow(dataRowIndex + dataRowOffset);
    });
  }

  /**
   * Configures the sheet view, combining frozen panes and RTL direction settings.
   *
   * @param {object} sheet The sheet builder.
   * @param {number} frozenRows Number of frozen data rows.
   * @param {number} frozenColumns Number of frozen data columns.
   * @param {number} headerRowCount Number of header rows prepended before data rows.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {boolean} isRtl Whether the table layout direction is right-to-left.
   */
  #applyWorksheetViews(
    sheet: SheetBuilder, frozenRows: number, frozenColumns: number,
    headerRowCount: number, hasRowHeaders: boolean, isRtl: boolean
  ): void {
    sheet.setRtl(isRtl);

    if (frozenRows > 0 || frozenColumns > 0) {
      sheet.freeze(frozenColumns + (hasRowHeaders ? 1 : 0), frozenRows + headerRowCount);
    }
  }

  /**
   * Writes the column-header row to the sheet, applying alignment derived from
   * each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array} columnHeaders Header values.
   * @param {string[]} classNames Per-header className strings (same order as `columnHeaders`).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended (leaves cell A1 empty).
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill Fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder Border object for header cells, or `null` for no border.
   */
  #writeColumnHeaders(
    sheet: SheetBuilder, columnHeaders: Array<string | number | null>,
    classNames: string[], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: HeaderFill | null, headerBorder: HeaderBorder | null
  ): void {
    if (hasRowHeaders) {
      const cornerCell = sheet.cell(1, 1);

      cornerCell.value = '';
      this.#applyHeaderStyle(cornerCell, null, headerFill, headerBorder);
    }

    for (let index = 0; index < columnHeaders.length; index++) {
      const cell = sheet.cell(1, index + dataColOffset);

      cell.value = columnHeaders[index] ?? null;
      this.#applyHeaderStyle(
        cell, getAlignmentFromClassName(classNames[index]),
        headerFill, headerBorder
      );
    }
  }

  /**
   * Writes multi-row nested column headers to the sheet, applying alignment derived
   * from each header's `className` where configured, and optional background fill and border.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   * @param {object|null} headerFill Fill object for header cells, or `null` for no fill.
   * @param {object|null} headerBorder Border object for header cells, or `null` for no border.
   */
  #writeNestedColumnHeaders(
    sheet: SheetBuilder, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number, headerFill: HeaderFill | null, headerBorder: HeaderBorder | null
  ): void {
    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const rowNumber = layerIndex + 1;

      if (hasRowHeaders && layerIndex === 0) {
        const cornerCell = sheet.cell(rowNumber, 1);

        cornerCell.value = '';
        this.#applyHeaderStyle(cornerCell, null, headerFill, headerBorder);
      }

      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        const cell = sheet.cell(rowNumber, colPos);

        cell.value = header.label ?? null;
        this.#applyHeaderStyle(
          cell, getAlignmentFromClassName(header.className),
          headerFill, headerBorder
        );

        colPos += header.colspan;
      });
    }
  }

  /**
   * Merges spanning cells in nested header rows.
   *
   * @param {object} sheet The sheet builder.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  #applyNestedHeaderMerges(
    sheet: SheetBuilder, nestedColumnHeaders: NestedHeaderEntry[][], hasRowHeaders: boolean,
    dataColOffset: number
  ): void {
    if (hasRowHeaders && nestedColumnHeaders.length > 1) {
      sheet.merge(1, 1, nestedColumnHeaders.length, 1);
    }

    for (let layerIndex = 0; layerIndex < nestedColumnHeaders.length; layerIndex++) {
      const layerHeaders = nestedColumnHeaders[layerIndex];
      const excelRow = layerIndex + 1;
      let colPos = dataColOffset;

      layerHeaders.forEach((header) => {
        if (header.colspan > 1) {
          sheet.merge(excelRow, colPos, excelRow, colPos + header.colspan - 1);
        }

        colPos += header.colspan;
      });
    }
  }

  /**
   * Creates a `veryHidden` sheet containing all unique dropdown/autocomplete source arrays found
   * in `cellsMeta`, the 2D cell-meta array of the sheet being exported, one array per column.
   * Returns a map from `JSON.stringify(source)` to an Excel range-reference string pointing at
   * that column, together with the sheet snapshot the caller pushes into the workbook after the
   * data sheet.
   *
   * The helper sheet's name goes through `#uniqueSheetName` against the same `usedSheetNames` set
   * every data sheet is named from, so a grid exported under the name `_HotValidation` can never
   * end up sharing its name with its own helper sheet — and two helper sheets in a multi-sheet
   * export cannot collide either. The data sheet is already recorded in that set by the time this
   * runs, even though it is pushed into the workbook only afterwards.
   *
   * If no dropdown or autocomplete cells with array sources are found, returns an
   * empty map and a `null` sheet.
   *
   * @private
   */
  #buildValidationSheet(
    usedSheetNames: Set<string>, cellsMeta: CellMeta[][]
  ): { validationMap: Map<string, string>; sheet: SheetSnapshot | null } {
    const sourceMap = new Map<string, unknown[]>();

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
      return { validationMap: new Map(), sheet: null };
    }

    const sheetName = this.#uniqueSheetName(VALIDATION_SHEET_NAME, usedSheetNames);
    const builder = new SheetBuilder(sheetName);

    builder.setState('veryHidden');

    const validationMap = new Map<string, string>();
    let colNumber = 1;

    sourceMap.forEach((source, key) => {
      for (let rowNumber = 0; rowNumber < source.length; rowNumber++) {
        const item = source[rowNumber];

        builder.cell(rowNumber + 1, colNumber).value = isKeyValueObject(item)
          ? String((item as { value: unknown }).value)
          : String(item);
      }

      const colLetter = colIndexToLetter(colNumber);
      const escapedName = sheetName.replaceAll('\'', '\'\'');
      const rangeRef = `'${escapedName}'!$${colLetter}$1:$${colLetter}$${source.length}`;

      validationMap.set(key, rangeRef);
      colNumber += 1;
    });

    return { validationMap, sheet: builder.toSnapshot() };
  }
}

export default Xlsx;
