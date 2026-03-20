import { isDefined, stringify } from '../../../helpers/mixed';
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
} from './xlsx/cell-style';
import {
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  getDateNumFmt,
  getTimeNumFmt,
} from './xlsx/date-utils';
import { intlNumFormatToExcelNumFmt } from './xlsx/numeric-utils';

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
  static get DEFAULT_OPTIONS() {
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
  async export() {
    const { engine } = this.options;

    if (!engine || typeof engine.Workbook !== 'function') {
      throwWithCause(
        'Missing or invalid ExcelJS engine. Pass the ExcelJS module as `engine` ' +
        'in the exportFile plugin settings: `exportFile: { engine: ExcelJS }`.'
      );
    }

    // Clear style caches for all documents involved in this export. In multi-sheet
    // mode each sheet may come from a different Handsontable instance living in a
    // different document (e.g. an iframe), so every distinct document must be cleared.
    const { sheets } = this.options;
    const docsToClear = sheets && sheets.length > 0
      ? new Set(sheets.map(s => s.instance.rootDocument))
      : new Set([this.dataProvider.hot.rootDocument]);

    docsToClear.forEach(doc => clearStyleCaches(doc));

    const workbook = new engine.Workbook();

    if (sheets && sheets.length > 0) {
      // multi-sheet mode
      const usedSheetNames = new Set();

      sheets.forEach((sheetConfig) => {
        const dp = new DataProvider(sheetConfig.instance);
        const sheetOptions = { ...this.options, ...sheetConfig };

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

        this.#populateWorksheet(worksheet, dp, sheetOptions);
      });
    } else {
      // single-sheet mode
      const worksheet = workbook.addWorksheet('Sheet1');

      this.#populateWorksheet(worksheet, this.dataProvider, this.options);
    }

    return workbook.xlsx.writeBuffer(this.#getWriteOptions());
  }

  /**
   * Populates a single ExcelJS worksheet from the given DataProvider.
   *
   * Extracts the data writing logic shared between single-sheet and multi-sheet exports.
   *
   * @param {object} worksheet The ExcelJS worksheet to populate.
   * @param {DataProvider} dataProvider DataProvider configured for this sheet.
   * @param {object} options Merged options for this sheet.
   * @returns {number} Number of data rows written.
   */
  #populateWorksheet(worksheet, dataProvider, options) {
    const data = dataProvider.getData();
    const cellsMeta = dataProvider.getCellsMeta();
    const cellElements = dataProvider.getCellElements();
    const columnHeaders = dataProvider.getColumnHeaders();
    const columnHeadersClassNames = dataProvider.getColumnHeadersClassNames();
    const rowHeaders = dataProvider.getRowHeaders();
    const columnsWidths = dataProvider.getColumnsWidths();
    const rowsHeights = dataProvider.getRowsHeights();
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

    columnSummaries.forEach((summary) => {
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

    const cellContext = {
      exportFormulas,
      formulasSeparator,
      dataRowOffset,
      dataColOffset,
      excludedHiddenRows,
      excludedHiddenCols,
    };

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

    // Pre-scan: only touch cell.protection when the sheet actually has cells that
    // should be locked in the exported file.
    //
    // When a ColumnSummary plugin is present, its destination cells (and any
    // surrounding label cells the user marks readOnly) are readOnly only to prevent
    // in-grid editing — not to restrict editing in Excel. Locking those cells in Excel
    // only makes sense when they are exported as live formulas (exportFormulas: true),
    // so the lock protects the formula from accidental overwriting.
    //
    // Setting protection on every cell (even { locked: false }) causes ExcelJS to
    // initialise font/fill/border to sentinel values on those cells, which would
    // break assertions in tests and add noise to the exported file.
    // When a ColumnSummary plugin is active, its destination cells (and any
    // accompanying label cells the user marks readOnly) are readOnly only to prevent
    // in-grid editing. Whether exported as static values or live formulas, locking
    // those cells in Excel adds no value and surprises users, so protection is
    // suppressed entirely whenever ColumnSummary is present.
    const hasColumnSummary = summaryMap.size > 0;
    const hasReadOnlyCells = !hasColumnSummary &&
      cellsMeta.some(row => row.some(meta => meta.readOnly === true));

    this.#writeDataRows(
      worksheet, data, cellsMeta, cellElements, rowHeaders, rowsHeights,
      summaryMap, sourceData, cellContext, hasRowHeaders, headerFill, headerBorder,
      hasReadOnlyCells, rootDocument, rootWindow
    );

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

    mergeCells.forEach((merge) => {
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
   * @param {Array[]} cellsMeta 2D meta array from DataProvider.
   * @param {Array[]} cellElements 2D DOM element array from DataProvider.
   * @param {Array} rowHeaders Row header values.
   * @param {number[]} rowsHeights Row heights in pixels.
   * @param {Map} summaryMap Summary descriptor map keyed by `'row:col'`.
   * @param {Array[]|null} sourceData Raw source data for formula export, or `null`.
   * @param {object} cellContext Sheet-level context (offsets and formula settings).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {object|null} headerFill ExcelJS fill for header cells, or `null`.
   * @param {object|null} headerBorder ExcelJS border for header cells, or `null`.
   * @param {boolean} hasReadOnlyCells Whether the sheet has any read-only cells.
   * @param {Document} rootDocument Owner document (fallback for off-viewport cells).
   * @param {Window} rootWindow Owner window (fallback for off-viewport cells).
   */
  #writeDataRows(worksheet, data, cellsMeta, cellElements, rowHeaders, rowsHeights,
                 summaryMap, sourceData, cellContext, hasRowHeaders, headerFill, headerBorder,
                 hasReadOnlyCells, rootDocument, rootWindow) {
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const rowData = data[rowIndex];
      const excelRowNumber = rowIndex + cellContext.dataRowOffset;
      const row = worksheet.getRow(excelRowNumber);

      if (isDefined(rowsHeights[rowIndex])) {
        row.height = rowsHeights[rowIndex] * PIXELS_TO_POINTS_RATIO;
      }

      if (hasRowHeaders) {
        const rowHeaderCell = row.getCell(1);

        rowHeaderCell.value = rowHeaders[rowIndex] ?? null;

        if (headerFill) {
          rowHeaderCell.fill = headerFill;
        }

        if (headerBorder) {
          rowHeaderCell.border = headerBorder;
        }
      }

      this.#writeRowCells(
        row, rowData, rowIndex, cellsMeta, cellElements,
        summaryMap, sourceData, cellContext, hasReadOnlyCells, rootDocument, rootWindow
      );

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
   * @param {Array[]} cellsMeta 2D meta array from DataProvider.
   * @param {Array[]} cellElements 2D DOM element array from DataProvider.
   * @param {Map} summaryMap Summary descriptor map keyed by `'row:col'`.
   * @param {Array[]|null} sourceData Raw source data for formula export, or `null`.
   * @param {object} cellContext Sheet-level context (offsets and formula settings).
   * @param {boolean} hasReadOnlyCells Whether the sheet has any read-only cells.
   * @param {Document} rootDocument Owner document (fallback for off-viewport cells).
   * @param {Window} rootWindow Owner window (fallback for off-viewport cells).
   */
  #writeRowCells(row, rowData, rowIndex, cellsMeta, cellElements,
                 summaryMap, sourceData, cellContext, hasReadOnlyCells, rootDocument, rootWindow) {
    for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
      const cellValue = rowData[colIndex];
      const cell = row.getCell(colIndex + cellContext.dataColOffset);
      const meta = cellsMeta[rowIndex][colIndex];
      const summary = summaryMap.get(`${rowIndex}:${colIndex}`);
      const sourceValue = sourceData?.[rowIndex][colIndex];
      const { value, numFmt } = this.#resolveCellValue(cellValue, meta, sourceValue, summary, cellContext);

      cell.value = value;

      if (numFmt) {
        cell.numFmt = numFmt;
      }

      const cssStyle = getCssStyleFromElement(
        cellElements[rowIndex][colIndex], meta.className, rootDocument, rootWindow
      );

      this.#writeCellStyling(cell, meta, cssStyle);

      if (hasReadOnlyCells) {
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
   */
  #writeCellStyling(cell, meta, cssStyle) {
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

    const dropdownValidation = getDropdownValidation(meta);

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
   * @param {object} cellContext Sheet-level context with formula and offset parameters.
   * @returns {{ value: *, numFmt: string|null }}
   */
  #resolveCellValue(cellValue, meta, sourceValue, summary, cellContext) {
    const {
      exportFormulas, formulasSeparator, dataRowOffset, dataColOffset,
      excludedHiddenRows, excludedHiddenCols,
    } = cellContext;

    if (summary && exportFormulas) {
      return {
        value: buildSummaryFormula(summary, dataRowOffset, dataColOffset) ?? this.#getCellValue(cellValue, meta),
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
  #getCellValue(value, meta) {
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
  #getCheckboxValue(value, meta) {
    const checkedTemplate = meta.checkedTemplate ?? true;

    return value === checkedTemplate;
  }

  /**
   * Converts a multiselect cell value to a comma-separated display string.
   *
   * @param {*} value Raw multiselect cell value (expected to be an array).
   * @returns {string|null}
   */
  #getMultiSelectExportValue(value) {
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
  #buildHeaderFill(headerStyle) {
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
  #buildHeaderBorder(headerStyle) {
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
  #getWriteOptions() {
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
  #applyConditionalFormatting(worksheet, cfRules, dataRowOffset, dataColOffset, dataRows, dataCols) {
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
  #buildRangeRef(startRow, startCol, endRow, endCol) {
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
  #applyColumnWidths(worksheet, widths, hasRowHeaders) {
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
  #applyHiddenColumns(worksheet, hiddenColIndices, hasRowHeaders) {
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
  #applyHiddenRows(worksheet, hiddenRowIndices, dataRowOffset) {
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
  #applyWorksheetViews(worksheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl) {
    const hasFrozenPanes = frozenRows > 0 || frozenColumns > 0;

    if (!hasFrozenPanes && !isRtl) {
      return;
    }

    const view = {};

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
  #writeColumnHeaders(worksheet, columnHeaders, classNames, hasRowHeaders, dataColOffset, headerFill, headerBorder) {
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
  #writeNestedColumnHeaders(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset, headerFill, headerBorder) {
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
  #applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset) {
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
}

export default Xlsx;
