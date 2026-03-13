import { stringify } from '../../../helpers/mixed';
import { arrayEach } from '../../../helpers/array';
import { throwWithCause } from '../../../helpers/errors';
import DataProvider from '../dataProvider';
import BaseType from './_base';

const PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT = 7;
const PIXELS_TO_POINTS_RATIO = 0.75;
const ROW_HEADER_DEFAULT_WIDTH = 5;

// Default ARGB colors applied to read-only cells when no explicit styling is set.
const READ_ONLY_BG_ARGB = 'FFF0F0F0';
const READ_ONLY_TEXT_ARGB = 'FF808080';

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
      // ZIP compression level passed to JSZip (1 = fastest, 9 = smallest). null uses the JSZip default.
      compression: null,
      // Array of { rows?, cols?, rules } conditional formatting descriptors.
      conditionalFormatting: [],
      // When true, HyperFormula formula cells and ColumnSummary destinations are exported as live
      // Excel formulas. When false (default) the pre-calculated static values are exported.
      exportFormulas: false,
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
  export() {
    const { engine } = this.options;

    if (!engine || typeof engine.Workbook !== 'function') {
      throwWithCause(
        'Missing or invalid ExcelJS engine. Pass the ExcelJS module as `engine` ' +
        'in the exportFile plugin settings: `exportFile: { engine: ExcelJS }`.'
      );
    }

    const workbook = new engine.Workbook();
    const { sheets, onProgress } = this.options;
    const fireProgress = typeof onProgress === 'function' ? onProgress : null;

    if (sheets && sheets.length > 0) {
      // ── multi-sheet mode ─────────────────────────────────────────────────
      // Build a DataProvider for every sheet so we can compute the total row
      // count before starting (needed for accurate percent progress values).
      const usedSheetNames = new Set();
      const configs = sheets.map((sheetConfig) => {
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

        return { dp, sheetOptions, name };
      });

      const totalRows = fireProgress
        ? configs.reduce((sum, { dp }) => sum + dp.getData().length, 0)
        : 0;

      if (fireProgress) {
        fireProgress({ phase: 'start', current: 0, total: totalRows, percent: 0 });
      }

      let rowOffset = 0;

      arrayEach(configs, ({ dp, sheetOptions, name }) => {
        const worksheet = workbook.addWorksheet(name);
        const rowsWritten = this._populateWorksheet(worksheet, dp, sheetOptions, fireProgress, rowOffset, totalRows);

        rowOffset += rowsWritten;
      });
    } else {
      // ── single-sheet mode ────────────────────────────────────────────────
      const totalRows = fireProgress ? this.dataProvider.getData().length : 0;

      if (fireProgress) {
        fireProgress({ phase: 'start', current: 0, total: totalRows, percent: 0 });
      }

      const worksheet = workbook.addWorksheet('Sheet1');

      this._populateWorksheet(worksheet, this.dataProvider, this.options, fireProgress, 0, totalRows);
    }

    const bufferPromise = workbook.xlsx.writeBuffer(this._getWriteOptions());

    if (fireProgress) {
      return bufferPromise.then((buffer) => {
        fireProgress({ phase: 'complete', current: 1, total: 1, percent: 100 });

        return buffer;
      });
    }

    return bufferPromise;
  }

  /**
   * Populates a single ExcelJS worksheet from the given DataProvider.
   *
   * Extracts the data writing logic shared between single-sheet and multi-sheet
   * exports. Returns the number of data rows written so the caller can track
   * cross-sheet progress offsets.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet to populate.
   * @param {DataProvider} dataProvider DataProvider configured for this sheet.
   * @param {object} options Merged options for this sheet.
   * @param {Function|null} fireProgress Progress callback, or `null` when disabled.
   * @param {number} rowOffset Number of data rows already written in earlier sheets.
   * @param {number} totalRows Grand total of data rows across all sheets.
   * @returns {number} Number of data rows written to this worksheet.
   */
  _populateWorksheet(worksheet, dataProvider, options, fireProgress, rowOffset, totalRows) {
    const data = dataProvider.getData();
    const cellsMeta = dataProvider.getCellsMeta();
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
    // Only populated when exportFormulas is true (summaries become live Excel formulas).
    const summaryMap = new Map();

    if (exportFormulas) {
      const columnSummaries = dataProvider.getColumnSummaries();

      arrayEach(columnSummaries, (summary) => {
        summaryMap.set(`${summary.destRow}:${summary.destCol}`, summary);
      });
    }

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

    this._applyColumnWidths(worksheet, columnsWidths, hasRowHeaders);
    this._applyWorksheetViews(worksheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl);

    if (useNestedHeaders) {
      this._writeNestedColumnHeaders(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
      this._applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
    } else if (hasColumnHeaders) {
      this._writeColumnHeaders(worksheet, columnHeaders, columnHeadersClassNames, hasRowHeaders, dataColOffset);
    }

    arrayEach(data, (rowData, rowIndex) => {
      const excelRowNumber = rowIndex + dataRowOffset;
      const row = worksheet.getRow(excelRowNumber);

      if (rowsHeights[rowIndex] !== undefined) {
        row.height = rowsHeights[rowIndex] * PIXELS_TO_POINTS_RATIO;
      }

      if (hasRowHeaders) {
        row.getCell(1).value = rowHeaders[rowIndex] ?? null;
      }

      arrayEach(rowData, (cellValue, colIndex) => {
        const cell = row.getCell(colIndex + dataColOffset);
        const meta = cellsMeta[rowIndex]?.[colIndex];
        const summary = summaryMap.get(`${rowIndex}:${colIndex}`);

        if (summary) {
          const formulaValue = this._buildSummaryFormula(summary, dataRowOffset, dataColOffset);

          cell.value = formulaValue ?? this._getCellValue(cellValue, meta);
        } else if (exportFormulas && this._isFormulaValue(sourceData?.[rowIndex]?.[colIndex])) {
          const rawFormula = sourceData[rowIndex][colIndex];
          const formulaRowOffset = dataRowOffset - 1;
          const formulaColOffset = dataColOffset - 1;

          cell.value = {
            formula: this._normalizeFormula(rawFormula, formulasSeparator, formulaRowOffset, formulaColOffset),
          };
        } else if (this._isDateType(meta?.type)) {
          const serial = this._parseIsoStringToSerial(cellValue);

          if (serial !== null) {
            cell.value = serial;
            cell.numFmt = this._getDateNumFmt();
          } else {
            cell.value = this._getCellValue(cellValue, meta);
          }
        } else if (this._isTimeType(meta?.type)) {
          const serial = this._parseTimeStringToSerial(cellValue);

          if (serial !== null) {
            cell.value = serial;
            cell.numFmt = this._getTimeNumFmt();
          } else {
            cell.value = this._getCellValue(cellValue, meta);
          }
        } else if (this._isCheckboxType(meta?.type)) {
          cell.value = this._getCheckboxValue(cellValue, meta);
        } else if (this._isMultiSelectType(meta?.type)) {
          cell.value = this._getMultiSelectExportValue(cellValue);
        } else {
          cell.value = this._getCellValue(cellValue, meta);
        }

        const alignment = this._getAlignmentFromMeta(meta);

        if (alignment) {
          cell.alignment = alignment;
        }

        const border = this._getBorderFromMeta(meta);

        if (border) {
          cell.border = border;
        }

        const font = this._getFontFromMeta(meta);

        if (font) {
          cell.font = font;
        }

        const fill = this._getFillFromMeta(meta);

        if (fill) {
          cell.fill = fill;
        }

        const dropdownValidation = this._getDropdownValidation(meta);

        if (dropdownValidation) {
          cell.dataValidation = dropdownValidation;
        }

        if (meta?.comment?.value) {
          cell.note = String(meta.comment.value);
        }
      });

      row.commit();

      if (fireProgress) {
        const current = rowOffset + rowIndex + 1;

        fireProgress({
          phase: 'rows',
          current,
          total: totalRows,
          percent: totalRows > 0 ? Math.round((current / totalRows) * 100) : 0,
        });
      }
    });

    arrayEach(mergeCells, (merge) => {
      const startRow = merge.row + dataRowOffset;
      const startCol = merge.col + dataColOffset;
      const endRow = startRow + merge.rowspan - 1;
      const endCol = startCol + merge.colspan - 1;

      worksheet.mergeCells(startRow, startCol, endRow, endCol);
    });

    const { conditionalFormatting } = options;

    if (conditionalFormatting && conditionalFormatting.length > 0) {
      this._applyConditionalFormatting(
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
   * Builds an ExcelJS formula value object for a ColumnSummary destination cell.
   *
   * Maps Handsontable summary types to their Excel equivalents:
   * `sum` → `SUM`, `min` → `MIN`, `max` → `MAX`, `count` → `COUNT`,
   * `average` → `AVERAGE`. Returns `null` for `custom` and any unrecognized
   * type so the caller can fall back to the pre-calculated static value.
   *
   * @private
   * @param {object} summary Summary descriptor from {@link DataProvider#getColumnSummaries}.
   * @param {number} dataRowOffset 1-based Excel row where data row 0 starts.
   * @param {number} dataColOffset 1-based Excel column where data column 0 starts.
   * @returns {{ formula: string }|null}
   */
  _buildSummaryFormula(summary, dataRowOffset, dataColOffset) {
    const TYPE_TO_EXCEL_FN = {
      sum: 'SUM',
      min: 'MIN',
      max: 'MAX',
      count: 'COUNT',
      average: 'AVERAGE',
    };

    const excelFn = TYPE_TO_EXCEL_FN[summary.type];

    if (!excelFn) {
      return null;
    }

    const colLetter = this._colIndexToLetter(summary.sourceCol + dataColOffset);
    const rangeRefs = summary.sourceRanges.map(([start, end]) => {
      const startExcelRow = start + dataRowOffset;
      const endExcelRow = end + dataRowOffset;

      return startExcelRow === endExcelRow
        ? `${colLetter}${startExcelRow}`
        : `${colLetter}${startExcelRow}:${colLetter}${endExcelRow}`;
    });

    return { formula: `${excelFn}(${rangeRefs.join(',')})` };
  }

  /**
   * Returns `true` when `value` is a string that starts with `=` (an Excel/HyperFormula formula).
   *
   * @private
   * @param {*} value Source data cell value.
   * @returns {boolean}
   */
  _isFormulaValue(value) {
    return typeof value === 'string' && value.startsWith('=');
  }

  /**
   * Normalizes a HyperFormula formula string for use in an Excel OOXML file.
   *
   * Performs three transformations:
   * 1. Strips the leading `=` character.
   * 2. Translates A1-style cell references by adding `rowOffset` to row numbers and
   *    `colOffset` to column indices (so references point to the correct Excel cell
   *    after header rows/columns are prepended).
   * 3. Replaces `separator` with `,` outside string literals (OOXML always uses `,`).
   *
   * @private
   * @param {string} formulaStr Raw formula string (starts with `=`).
   * @param {string} separator HyperFormula's `functionArgSeparator` (e.g. `','` or `';'`).
   * @param {number} rowOffset Number to add to every row number in a cell reference.
   * @param {number} colOffset Number to add to every column number in a cell reference.
   * @returns {string}
   */
  _normalizeFormula(formulaStr, separator, rowOffset, colOffset) {
    let formula = formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr;

    // Translate A1-style cell references (e.g. A1, B12, AA3) that are NOT function names
    // (function names are immediately followed by '(').
    if (rowOffset !== 0 || colOffset !== 0) {
      formula = formula.replace(/([A-Z]+)(\d+)(?!\()/g, (match, colLetters, rowStr) => {
        const newCol = this._colLetterToIndex(colLetters) + colOffset;
        const newRow = parseInt(rowStr, 10) + rowOffset;

        return `${this._colIndexToLetter(newCol)}${newRow}`;
      });
    }

    // Normalize function argument separator so OOXML always uses ','.
    if (separator && separator !== ',') {
      formula = this._replaceSeparatorOutsideStrings(formula, separator, ',');
    }

    return formula;
  }

  /**
   * Converts an Excel column letter string to a 1-based column index.
   *
   * Examples: `'A'` → 1, `'Z'` → 26, `'AA'` → 27.
   *
   * @private
   * @param {string} letters Column letter string (uppercase).
   * @returns {number}
   */
  _colLetterToIndex(letters) {
    let index = 0;

    for (let i = 0; i < letters.length; i++) {
      index = (index * 26) + (letters.charCodeAt(i) - 64);
    }

    return index;
  }

  /**
   * Replaces all occurrences of `from` with `to` in `str`, skipping characters inside
   * single-quoted or double-quoted string literals.
   *
   * @private
   * @param {string} str Input string.
   * @param {string} from Substring to replace.
   * @param {string} to Replacement substring.
   * @returns {string}
   */
  _replaceSeparatorOutsideStrings(str, from, to) {
    let result = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      if (inString) {
        result += ch;

        if (ch === stringChar) {
          inString = false;
        }
      } else if (ch === '"' || ch === '\'') {
        inString = true;
        stringChar = ch;
        result += ch;
      } else if (str.startsWith(from, i)) {
        result += to;
        i += from.length - 1;
      } else {
        result += ch;
      }
    }

    return result;
  }

  /**
   * Builds the options object passed to `workbook.xlsx.writeBuffer()`.
   *
   * The `compression` option (1–9) maps to the JSZip `compressionOptions.level`
   * setting used by ExcelJS's internal ZIP writer. `null` leaves ExcelJS to use
   * its own default (level 6).
   *
   * @private
   * @returns {object}
   */
  _getWriteOptions() {
    const { compression } = this.options;

    if (typeof compression !== 'number') {
      return {};
    }

    return {
      zip: {
        compression: 'DEFLATE',
        compressionOptions: { level: compression },
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
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array} cfRules Array of `{ rows?, cols?, rules }` descriptors.
   * @param {number} dataRowOffset 1-based Excel row where data starts.
   * @param {number} dataColOffset 1-based Excel column where data starts.
   * @param {number} dataRows Total number of exported data rows.
   * @param {number} dataCols Total number of exported data columns.
   */
  _applyConditionalFormatting(worksheet, cfRules, dataRowOffset, dataColOffset, dataRows, dataCols) {
    if (dataRows === 0 || dataCols === 0) {
      return;
    }

    arrayEach(cfRules, ({ rows, cols, rules }) => {
      if (!rules || rules.length === 0) {
        return;
      }

      const startRow = (rows ? rows[0] : 0) + dataRowOffset;
      const endRow = (rows ? rows[1] : dataRows - 1) + dataRowOffset;
      const startCol = (cols ? cols[0] : 0) + dataColOffset;
      const endCol = (cols ? cols[1] : dataCols - 1) + dataColOffset;

      worksheet.addConditionalFormatting({
        ref: this._buildRangeRef(startRow, startCol, endRow, endCol),
        rules,
      });
    });
  }

  /**
   * Builds an Excel cell-range reference string (e.g. `'B2:E7'`) from 1-based
   * row and column indices.
   *
   * @private
   * @param {number} startRow 1-based start row.
   * @param {number} startCol 1-based start column.
   * @param {number} endRow 1-based end row.
   * @param {number} endCol 1-based end column.
   * @returns {string}
   */
  _buildRangeRef(startRow, startCol, endRow, endCol) {
    return `${this._colIndexToLetter(startCol)}${startRow}:${this._colIndexToLetter(endCol)}${endRow}`;
  }

  /**
   * Converts a 1-based column index to an Excel column letter string.
   *
   * Examples: 1 → `'A'`, 26 → `'Z'`, 27 → `'AA'`, 28 → `'AB'`.
   *
   * @private
   * @param {number} colIndex 1-based column index.
   * @returns {string}
   */
  _colIndexToLetter(colIndex) {
    let letter = '';
    let n = colIndex;

    while (n > 0) {
      const remainder = (n - 1) % 26;

      letter = String.fromCharCode(65 + remainder) + letter;
      n = Math.floor((n - 1) / 26);
    }

    return letter;
  }

  /**
   * Sets column widths on the worksheet, converting pixel values to Excel character-width units.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number[]} widths Column widths in pixels, in data-column order.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  _applyColumnWidths(worksheet, widths, hasRowHeaders) {
    if (hasRowHeaders) {
      worksheet.getColumn(1).width = ROW_HEADER_DEFAULT_WIDTH;
    }

    const offset = hasRowHeaders ? 1 : 0;

    arrayEach(widths, (pixelWidth, index) => {
      worksheet.getColumn(index + 1 + offset).width =
        Math.max(pixelWidth / PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT, 1);
    });
  }

  /**
   * Configures the worksheet view, combining frozen panes and RTL direction settings.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number} frozenRows Number of frozen data rows.
   * @param {number} frozenColumns Number of frozen data columns.
   * @param {number} headerRowCount Number of header rows prepended before data rows.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {boolean} isRtl Whether the table layout direction is right-to-left.
   */
  _applyWorksheetViews(worksheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl) {
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
   * each header's `className` where configured.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array} columnHeaders Header values.
   * @param {string[]} classNames Per-header className strings (same order as `columnHeaders`).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended (leaves cell A1 empty).
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  _writeColumnHeaders(worksheet, columnHeaders, classNames, hasRowHeaders, dataColOffset) {
    const headerRow = worksheet.getRow(1);

    if (hasRowHeaders) {
      headerRow.getCell(1).value = '';
    }

    arrayEach(columnHeaders, (header, index) => {
      const cell = headerRow.getCell(index + dataColOffset);

      cell.value = header ?? null;

      const alignment = this._getAlignmentFromClassName(classNames[index]);

      if (alignment) {
        cell.alignment = alignment;
      }
    });

    headerRow.commit();
  }

  /**
   * Writes multi-row nested column headers to the worksheet, applying alignment derived
   * from each header's `className` where configured.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  _writeNestedColumnHeaders(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset) {
    arrayEach(nestedColumnHeaders, (layerHeaders, layerIndex) => {
      const row = worksheet.getRow(layerIndex + 1);

      if (hasRowHeaders && layerIndex === 0) {
        row.getCell(1).value = '';
      }

      let colPos = dataColOffset;

      arrayEach(layerHeaders, (header) => {
        const cell = row.getCell(colPos);

        cell.value = header.label ?? null;

        const alignment = this._getAlignmentFromClassName(header.className);

        if (alignment) {
          cell.alignment = alignment;
        }

        colPos += header.colspan;
      });

      row.commit();
    });
  }

  /**
   * Merges spanning cells in nested header rows.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array[]} nestedColumnHeaders Layers returned by DataProvider#getNestedColumnHeaders.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  _applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset) {
    if (hasRowHeaders && nestedColumnHeaders.length > 1) {
      worksheet.mergeCells(1, 1, nestedColumnHeaders.length, 1);
    }

    arrayEach(nestedColumnHeaders, (layerHeaders, layerIndex) => {
      const excelRow = layerIndex + 1;
      let colPos = dataColOffset;

      arrayEach(layerHeaders, (header) => {
        if (header.colspan > 1) {
          worksheet.mergeCells(excelRow, colPos, excelRow, colPos + header.colspan - 1);
        }

        colPos += header.colspan;
      });
    });
  }

  /**
   * Converts a raw cell value to an ExcelJS-compatible value.
   *
   * @private
   * @param {*} value Raw cell value.
   * @param {object|undefined} meta Cell meta object.
   * @returns {null|number|string}
   */
  _getCellValue(value, meta) {
    if (value === null || value === undefined) {
      return null;
    }

    if (meta?.type === 'numeric') {
      if (typeof value === 'number') {
        return value;
      }

      const numericValue = Number(value);

      return Number.isNaN(numericValue) ? stringify(value) : numericValue;
    }

    return stringify(value);
  }

  /**
   * Returns `true` for Handsontable date cell types (`'date'` and `'intl-date'`).
   *
   * @private
   * @param {string|undefined} type Cell type from meta.
   * @returns {boolean}
   */
  _isDateType(type) {
    return type === 'date' || type === 'intl-date';
  }

  /**
   * Returns `true` for Handsontable time cell type (`'time'`).
   *
   * @private
   * @param {string|undefined} type Cell type from meta.
   * @returns {boolean}
   */
  _isTimeType(type) {
    return type === 'time';
  }

  /**
   * Returns `true` for Handsontable checkbox cell type (`'checkbox'`).
   *
   * @private
   * @param {string|undefined} type Cell type from meta.
   * @returns {boolean}
   */
  _isCheckboxType(type) {
    return type === 'checkbox';
  }

  /**
   * Returns `true` for Handsontable multiselect cell type (`'multiselect'`).
   *
   * @private
   * @param {string|undefined} type Cell type from meta.
   * @returns {boolean}
   */
  _isMultiSelectType(type) {
    return type === 'multiselect';
  }

  /**
   * Parses an ISO 8601 date string (`'YYYY-MM-DD'`) to an Excel date serial number.
   *
   * @private
   * @param {*} value Cell value — expected to be an ISO 8601 string.
   * @returns {number|null}
   */
  _parseIsoStringToSerial(value) {
    if (!value) {
      return null;
    }

    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return null;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return this._toExcelDateSerial(date);
  }

  /**
   * Parses a time string to an Excel time serial number (fractional day: 0.0–1.0).
   *
   * Supports 24-hour formats (`'HH:mm'`, `'HH:mm:ss'`) and 12-hour formats
   * (`'h:mm AM/PM'`, `'h:mm:ss AM/PM'`).
   *
   * @private
   * @param {*} value Cell value — expected to be a time string.
   * @returns {number|null}
   */
  _parseTimeStringToSerial(value) {
    if (!value) {
      return null;
    }

    const str = String(value).trim();
    const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      const seconds = match24[3] ? parseInt(match24[3], 10) : 0;

      if (hours > 23 || minutes > 59 || seconds > 59) {
        return null;
      }

      return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
    }

    const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const seconds = match12[3] ? parseInt(match12[3], 10) : 0;
      const period = match12[4].toUpperCase();

      if (hours > 12 || minutes > 59 || seconds > 59) {
        return null;
      }

      if (period === 'AM' && hours === 12) {
        hours = 0;
      } else if (period === 'PM' && hours !== 12) {
        hours += 12;
      }

      return ((hours * 3600) + (minutes * 60) + seconds) / 86400;
    }

    return null;
  }

  /**
   * Converts a JavaScript `Date` to an Excel date serial number.
   *
   * @private
   * @param {Date} date The date to convert.
   * @returns {number}
   */
  _toExcelDateSerial(date) {
    const MS_PER_DAY = 86400000;
    const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
    const localDateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

    return Math.round((localDateUtc - EXCEL_EPOCH_UTC) / MS_PER_DAY);
  }

  /**
   * Returns the Excel `numFmt` string for a date cell (OOXML built-in format ID 14).
   *
   * @private
   * @returns {string}
   */
  _getDateNumFmt() {
    return 'mm-dd-yy';
  }

  /**
   * Returns the Excel `numFmt` string for a time cell.
   *
   * @private
   * @returns {string}
   */
  _getTimeNumFmt() {
    return 'hh:mm:ss';
  }

  /**
   * Returns the boolean export value for a checkbox cell.
   *
   * @private
   * @param {*} value Raw cell value.
   * @param {object|undefined} meta Cell meta object.
   * @returns {boolean}
   */
  _getCheckboxValue(value, meta) {
    const checkedTemplate = meta?.checkedTemplate ?? true;

    return value === checkedTemplate;
  }

  /**
   * Converts a multiselect cell value to a comma-separated display string.
   *
   * @private
   * @param {*} value Raw multiselect cell value (expected to be an array).
   * @returns {string|null}
   */
  _getMultiSelectExportValue(value) {
    if (!Array.isArray(value)) {
      return value === null || value === undefined ? null : stringify(value);
    }

    if (value.length === 0) {
      return null;
    }

    return value.map(item => (item !== null && typeof item === 'object' ? item.value : item)).join(', ');
  }

  /**
   * Derives an ExcelJS `alignment` object from a CSS className string.
   *
   * @private
   * @param {string|undefined} className CSS class string.
   * @returns {object|null}
   */
  _getAlignmentFromClassName(className) {
    if (!className) {
      return null;
    }

    return this._getAlignmentFromMeta({ className });
  }

  /**
   * Derives an ExcelJS `alignment` object from the cell meta `className`.
   *
   * Recognised Handsontable alignment classes:
   * - Horizontal: `htLeft`, `htCenter`, `htRight`, `htJustify`
   * - Vertical: `htTop`, `htMiddle`, `htBottom`
   *
   * @private
   * @param {object|undefined} meta Cell meta object.
   * @returns {object|null}
   */
  _getAlignmentFromMeta(meta) {
    if (!meta?.className) {
      return null;
    }

    const classes = meta.className.split(' ');
    const alignment = {};

    if (classes.includes('htLeft')) {
      alignment.horizontal = 'left';
    } else if (classes.includes('htCenter')) {
      alignment.horizontal = 'center';
    } else if (classes.includes('htRight')) {
      alignment.horizontal = 'right';
    } else if (classes.includes('htJustify')) {
      alignment.horizontal = 'justify';
    }

    if (classes.includes('htTop')) {
      alignment.vertical = 'top';
    } else if (classes.includes('htMiddle')) {
      alignment.vertical = 'middle';
    } else if (classes.includes('htBottom')) {
      alignment.vertical = 'bottom';
    }

    return Object.keys(alignment).length > 0 ? alignment : null;
  }

  /**
   * Derives an ExcelJS `border` object from custom border data stored in cell meta.
   *
   * @private
   * @param {object|undefined} meta Cell meta object.
   * @returns {object|null}
   */
  _getBorderFromMeta(meta) {
    if (!meta?.borders) {
      return null;
    }

    const { borders } = meta;
    const excelBorder = {};

    arrayEach(['top', 'bottom', 'left', 'right'], (side) => {
      if (borders[side] && borders[side].width > 0) {
        excelBorder[side] = {
          style: 'thin',
          color: { argb: this._cssColorToArgb(borders[side].color) },
        };
      }
    });

    return Object.keys(excelBorder).length > 0 ? excelBorder : null;
  }

  /**
   * Derives an ExcelJS `font` object from the `font` property on cell meta.
   *
   * When `meta.readOnly` is `true` and no explicit `meta.font.color` is set, a default
   * dimmed text color ({@link READ_ONLY_TEXT_ARGB}) is applied.
   *
   * @private
   * @param {object|undefined} meta Cell meta object.
   * @returns {object|null}
   */
  _getFontFromMeta(meta) {
    const isReadOnly = meta?.readOnly === true;

    if (!meta?.font && !isReadOnly) {
      return null;
    }

    const font = {};

    if (meta?.font?.bold) {
      font.bold = true;
    }

    if (meta?.font?.italic) {
      font.italic = true;
    }

    if (meta?.font?.underline) {
      font.underline = true;
    }

    if (meta?.font?.color) {
      font.color = { argb: this._cssColorToArgb(meta.font.color) };
    } else if (isReadOnly) {
      font.color = { argb: READ_ONLY_TEXT_ARGB };
    }

    return Object.keys(font).length > 0 ? font : null;
  }

  /**
   * Derives an ExcelJS solid `fill` object from the `backgroundColor` property on cell meta.
   *
   * When `meta.readOnly` is `true` and no explicit `meta.backgroundColor` is set, a default
   * light gray fill ({@link READ_ONLY_BG_ARGB}) is applied.
   *
   * @private
   * @param {object|undefined} meta Cell meta object.
   * @returns {object|null}
   */
  _getFillFromMeta(meta) {
    let bgColor = null;

    if (meta?.backgroundColor) {
      bgColor = this._cssColorToArgb(meta.backgroundColor);
    } else if (meta?.readOnly === true) {
      bgColor = READ_ONLY_BG_ARGB;
    }

    if (!bgColor) {
      return null;
    }

    return {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
  }

  /**
   * Returns an ExcelJS data validation object for dropdown and autocomplete cell types.
   *
   * @private
   * @param {object|undefined} meta Cell meta object.
   * @returns {object|null}
   */
  _getDropdownValidation(meta) {
    if (!meta) {
      return null;
    }

    const isDropdownType = meta.type === 'dropdown' || meta.type === 'autocomplete';

    if (!isDropdownType || !Array.isArray(meta.source)) {
      return null;
    }

    return {
      type: 'list',
      allowBlank: true,
      formulae: [`"${meta.source.join(',')}"`],
    };
  }

  /**
   * Converts a CSS hex color string to an ARGB hex string expected by ExcelJS.
   *
   * @private
   * @param {string} color CSS color string.
   * @returns {string} Eight-character ARGB hex string (e.g. `'FF3366CC'`).
   */
  _cssColorToArgb(color) {
    if (!color || typeof color !== 'string') {
      return 'FF000000';
    }

    const hex = color.startsWith('#') ? color.slice(1) : color;

    if (hex.length === 3) {
      const r = hex[0] + hex[0];
      const g = hex[1] + hex[1];
      const b = hex[2] + hex[2];

      return `FF${r}${g}${b}`.toUpperCase();
    }

    if (hex.length === 6) {
      return `FF${hex}`.toUpperCase();
    }

    if (hex.length === 8) {
      return hex.toUpperCase();
    }

    return 'FF000000';
  }
}

export default Xlsx;
