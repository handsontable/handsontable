import { stringify } from '../../../helpers/mixed';
import { arrayEach } from '../../../helpers/array';
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
} from './xlsx/cell-style';
import {
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  getDateNumFmt,
  getTimeNumFmt,
} from './xlsx/date-utils';
import { numbroPatternToExcelNumFmt } from './xlsx/numeric-utils';

const PIXELS_PER_EXCEL_COLUMN_WIDTH_UNIT = 7;
const PIXELS_TO_POINTS_RATIO = 0.75;
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
        const rowsWritten = this.#populateWorksheet(worksheet, dp, sheetOptions, fireProgress, rowOffset, totalRows);

        rowOffset += rowsWritten;
      });
    } else {
      // ── single-sheet mode ────────────────────────────────────────────────
      const totalRows = fireProgress ? this.dataProvider.getData().length : 0;

      if (fireProgress) {
        fireProgress({ phase: 'start', current: 0, total: totalRows, percent: 0 });
      }

      const worksheet = workbook.addWorksheet('Sheet1');

      this.#populateWorksheet(worksheet, this.dataProvider, this.options, fireProgress, 0, totalRows);
    }

    const bufferPromise = workbook.xlsx.writeBuffer(this.#getWriteOptions());

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
  #populateWorksheet(worksheet, dataProvider, options, fireProgress, rowOffset, totalRows) {
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
    const cellContext = { exportFormulas, formulasSeparator, dataRowOffset, dataColOffset };

    this.#applyColumnWidths(worksheet, columnsWidths, hasRowHeaders);
    this.#applyWorksheetViews(worksheet, frozenRows, frozenColumns, headerRowCount, hasRowHeaders, isRtl);

    if (useNestedHeaders) {
      this.#writeNestedColumnHeaders(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
      this.#applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset);
    } else if (hasColumnHeaders) {
      this.#writeColumnHeaders(worksheet, columnHeaders, columnHeadersClassNames, hasRowHeaders, dataColOffset);
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
        const sourceValue = sourceData?.[rowIndex]?.[colIndex];
        const { value, numFmt } = this.#resolveCellValue(cellValue, meta, sourceValue, summary, cellContext);

        cell.value = value;

        if (numFmt) {
          cell.numFmt = numFmt;
        }

        const alignment = getAlignmentFromMeta(meta);

        if (alignment) {
          cell.alignment = alignment;
        }

        const border = getBorderFromMeta(meta);

        if (border) {
          cell.border = border;
        }

        const cssStyle = getCssStyleFromElement(cellElements[rowIndex]?.[colIndex], meta?.className);
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
   * @private
   * @param {*} cellValue Pre-calculated display value from `getData()`.
   * @param {object|undefined} meta Cell meta object.
   * @param {*} sourceValue Raw source value from `getSourceDataAtCell()` (may be a formula string).
   * @param {object|undefined} summary ColumnSummary descriptor, or `undefined` for non-summary cells.
   * @param {object} cellContext Sheet-level context with formula and offset parameters.
   * @returns {{ value: *, numFmt: string|null }}
   */
  #resolveCellValue(cellValue, meta, sourceValue, summary, cellContext) {
    const { exportFormulas, formulasSeparator, dataRowOffset, dataColOffset } = cellContext;

    if (summary) {
      return {
        value: buildSummaryFormula(summary, dataRowOffset, dataColOffset) ?? this.#getCellValue(cellValue, meta),
        numFmt: null,
      };
    }

    if (exportFormulas && isFormulaValue(sourceValue)) {
      return {
        value: {
          formula: normalizeFormula(sourceValue, formulasSeparator, dataRowOffset - 1, dataColOffset - 1),
        },
        numFmt: null,
      };
    }

    if (meta?.type === 'date' || meta?.type === 'intl-date') {
      const serial = parseIsoStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, numFmt: getDateNumFmt() };
      }
    }

    if (meta?.type === 'time') {
      const serial = parseTimeStringToSerial(cellValue);

      if (serial !== null) {
        return { value: serial, numFmt: getTimeNumFmt() };
      }
    }

    if (meta?.type === 'checkbox') {
      return { value: this.#getCheckboxValue(cellValue, meta), numFmt: null };
    }

    if (meta?.type === 'multiselect') {
      return { value: this.#getMultiSelectExportValue(cellValue), numFmt: null };
    }

    if (meta?.type === 'numeric') {
      return {
        value: this.#getCellValue(cellValue, meta),
        numFmt: numbroPatternToExcelNumFmt(meta?.numericFormat?.pattern),
      };
    }

    return { value: this.#getCellValue(cellValue, meta), numFmt: null };
  }

  /**
   * Converts a raw cell value to an ExcelJS-compatible value.
   *
   * @private
   * @param {*} value Raw cell value.
   * @param {object|undefined} meta Cell meta object.
   * @returns {null|number|string}
   */
  #getCellValue(value, meta) {
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
   * Returns the boolean export value for a checkbox cell.
   *
   * @private
   * @param {*} value Raw cell value.
   * @param {object|undefined} meta Cell meta object.
   * @returns {boolean}
   */
  #getCheckboxValue(value, meta) {
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
   * Builds the options object passed to `workbook.xlsx.writeBuffer()`.
   *
   * The `compression` option (1–9) maps to the JSZip `compressionOptions.level`
   * setting used by ExcelJS's internal ZIP writer. `null` leaves ExcelJS to use
   * its own default (level 6).
   *
   * @private
   * @returns {object}
   */
  #getWriteOptions() {
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
  #applyConditionalFormatting(worksheet, cfRules, dataRowOffset, dataColOffset, dataRows, dataCols) {
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
        ref: this.#buildRangeRef(startRow, startCol, endRow, endCol),
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
  #buildRangeRef(startRow, startCol, endRow, endCol) {
    return `${colIndexToLetter(startCol)}${startRow}:${colIndexToLetter(endCol)}${endRow}`;
  }

  /**
   * Sets column widths on the worksheet, converting pixel values to Excel
   * character-width units.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {number[]} widths Column widths in pixels, in data-column order.
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended.
   */
  #applyColumnWidths(worksheet, widths, hasRowHeaders) {
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
   * each header's `className` where configured.
   *
   * @private
   * @param {object} worksheet The ExcelJS worksheet.
   * @param {Array} columnHeaders Header values.
   * @param {string[]} classNames Per-header className strings (same order as `columnHeaders`).
   * @param {boolean} hasRowHeaders Whether a row-header column is prepended (leaves cell A1 empty).
   * @param {number} dataColOffset 1-based column number where data columns begin.
   */
  #writeColumnHeaders(worksheet, columnHeaders, classNames, hasRowHeaders, dataColOffset) {
    const headerRow = worksheet.getRow(1);

    if (hasRowHeaders) {
      headerRow.getCell(1).value = '';
    }

    arrayEach(columnHeaders, (header, index) => {
      const cell = headerRow.getCell(index + dataColOffset);

      cell.value = header ?? null;

      const alignment = getAlignmentFromClassName(classNames[index]);

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
  #writeNestedColumnHeaders(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset) {
    arrayEach(nestedColumnHeaders, (layerHeaders, layerIndex) => {
      const row = worksheet.getRow(layerIndex + 1);

      if (hasRowHeaders && layerIndex === 0) {
        row.getCell(1).value = '';
      }

      let colPos = dataColOffset;

      arrayEach(layerHeaders, (header) => {
        const cell = row.getCell(colPos);

        cell.value = header.label ?? null;

        const alignment = getAlignmentFromClassName(header.className);

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
  #applyNestedHeaderMerges(worksheet, nestedColumnHeaders, hasRowHeaders, dataColOffset) {
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
}

export default Xlsx;
