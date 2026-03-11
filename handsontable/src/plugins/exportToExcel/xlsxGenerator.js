import { ZipBuilder } from './zipBuilder';
import { StyleManager, escapeXml } from './styleManager';

const EXCEL_EPOCH_OFFSET = 25569;
const MS_PER_DAY = 86400000;

/**
 * Generates a complete XLSX file (Office Open XML SpreadsheetML) as a Uint8Array.
 *
 * @private
 */
export class XlsxGenerator {
  #data;
  #options;
  #styleManager;
  #sharedStrings = [];
  #sharedStringMap = new Map();

  /**
   * @param {object} data Collected data from DataCollector.
   * @param {object} options Export options.
   */
  constructor(data, options) {
    this.#data = data;
    this.#options = options;
    this.#styleManager = new StyleManager();
  }

  /**
   * Generate the XLSX file and return it as a Uint8Array.
   *
   * @returns {Uint8Array}
   */
  generate() {
    const zip = new ZipBuilder();

    zip.addFile('[Content_Types].xml', this.#contentTypesXml());
    zip.addFile('_rels/.rels', this.#relsXml());
    zip.addFile('xl/workbook.xml', this.#workbookXml());
    zip.addFile('xl/_rels/workbook.xml.rels', this.#workbookRelsXml());
    zip.addFile('xl/worksheets/sheet1.xml', this.#worksheetXml());
    zip.addFile('xl/styles.xml', this.#styleManager.toXml());
    zip.addFile('xl/sharedStrings.xml', this.#sharedStringsXml());

    return zip.build();
  }

  /**
   * Build [Content_Types].xml.
   *
   * @returns {string}
   */
  #contentTypesXml() {
    const relsCt = 'application/vnd.openxmlformats-package.relationships+xml';
    const sheetMainCt = 'application/vnd.openxmlformats-officedocument' +
      '.spreadsheetml.sheet.main+xml';
    const worksheetCt = 'application/vnd.openxmlformats-officedocument' +
      '.spreadsheetml.worksheet+xml';
    const stylesCt = 'application/vnd.openxmlformats-officedocument' +
      '.spreadsheetml.styles+xml';
    const ssCt = 'application/vnd.openxmlformats-officedocument' +
      '.spreadsheetml.sharedStrings+xml';

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      `<Default Extension="rels" ContentType="${relsCt}"/>`,
      '<Default Extension="xml" ContentType="application/xml"/>',
      `<Override PartName="/xl/workbook.xml" ContentType="${sheetMainCt}"/>`,
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${worksheetCt}"/>`,
      `<Override PartName="/xl/styles.xml" ContentType="${stylesCt}"/>`,
      `<Override PartName="/xl/sharedStrings.xml" ContentType="${ssCt}"/>`,
      '</Types>',
    ].join('');
  }

  /**
   * Build _rels/.rels.
   *
   * @returns {string}
   */
  #relsXml() {
    const relNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const officeDocType = 'http://schemas.openxmlformats.org/officeDocument' +
      '/2006/relationships/officeDocument';

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      `<Relationships xmlns="${relNs}">`,
      `<Relationship Id="rId1" Type="${officeDocType}" Target="xl/workbook.xml"/>`,
      '</Relationships>',
    ].join('');
  }

  /**
   * Build xl/workbook.xml.
   *
   * @returns {string}
   */
  #workbookXml() {
    const sheetName = escapeXml(this.#options.sheetName || 'Sheet1');

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<sheets>',
      `<sheet name="${sheetName}" sheetId="1" r:id="rId1"/>`,
      '</sheets>',
      '</workbook>',
    ].join('');
  }

  /**
   * Build xl/_rels/workbook.xml.rels.
   *
   * @returns {string}
   */
  #workbookRelsXml() {
    const relNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const relBase = 'http://schemas.openxmlformats.org/officeDocument' +
      '/2006/relationships';

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      `<Relationships xmlns="${relNs}">`,
      `<Relationship Id="rId1" Type="${relBase}/worksheet" Target="worksheets/sheet1.xml"/>`,
      `<Relationship Id="rId2" Type="${relBase}/styles" Target="styles.xml"/>`,
      `<Relationship Id="rId3" Type="${relBase}/sharedStrings" Target="sharedStrings.xml"/>`,
      '</Relationships>',
    ].join('');
  }

  /**
   * Build xl/worksheets/sheet1.xml.
   *
   * @returns {string}
   */
  #worksheetXml() {
    const parts = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    ];

    this.#writeSheetViews(parts);
    this.#writeColumns(parts);
    this.#writeSheetData(parts);
    this.#writeMergedCells(parts);
    this.#writeDataValidations(parts);

    parts.push('</worksheet>');

    return parts.join('');
  }

  /**
   * Write sheetViews with optional frozen panes.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeSheetViews(parts) {
    const frozen = this.#data.frozenPanes;
    const hasHeaders = this.#data.columnHeaders.length > 0;
    const hasRowHeaders = this.#data.rowHeaders.length > 0;

    const frozenRows = (frozen ? frozen.frozenRows : 0) + (hasHeaders ? 1 : 0);
    const frozenCols = (frozen ? frozen.frozenCols : 0) + (hasRowHeaders ? 1 : 0);

    if (frozenRows > 0 || frozenCols > 0) {
      const topLeftCell = cellRef(frozenRows, frozenCols);

      const xSplit = frozenCols > 0 ? ` xSplit="${frozenCols}"` : '';
      const ySplit = frozenRows > 0 ? ` ySplit="${frozenRows}"` : '';

      parts.push(
        '<sheetViews><sheetView tabSelected="1" workbookViewId="0">'
      );
      parts.push(
        `<pane${xSplit}${ySplit} topLeftCell="${topLeftCell}"` +
        ' activePane="bottomRight" state="frozen"/>'
      );
      parts.push('</sheetView></sheetViews>');
    }
  }

  /**
   * Write column width definitions.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeColumns(parts) {
    const widths = this.#data.columnWidths;
    const hasRowHeaders = this.#data.rowHeaders.length > 0;

    if (widths.length === 0 && !hasRowHeaders) {
      return;
    }

    parts.push('<cols>');

    const colOffset = hasRowHeaders ? 1 : 0;

    if (hasRowHeaders) {
      parts.push('<col min="1" max="1" width="10" customWidth="1"/>');
    }

    for (let i = 0; i < widths.length; i++) {
      const excelWidth = pixelsToExcelWidth(widths[i]);
      const colNum = i + 1 + colOffset;

      parts.push(`<col min="${colNum}" max="${colNum}" width="${excelWidth}" customWidth="1"/>`);
    }

    parts.push('</cols>');
  }

  /**
   * Write the sheetData element containing all rows and cells.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeSheetData(parts) {
    const { rows, columnHeaders, rowHeaders, rowHeights } = this.#data;
    const hasRowHeaders = rowHeaders.length > 0;

    parts.push('<sheetData>');

    let excelRow = 1;

    if (columnHeaders.length > 0) {
      const heightAttr = '';

      parts.push(`<row r="${excelRow}"${heightAttr}>`);

      const colOffset = hasRowHeaders ? 1 : 0;

      if (hasRowHeaders) {
        parts.push(this.#cellXml(excelRow, 0, '', 'string', this.#headerStyleIndex()));
      }

      for (let c = 0; c < columnHeaders.length; c++) {
        parts.push(this.#cellXml(
          excelRow,
          c + colOffset,
          columnHeaders[c],
          'string',
          this.#headerStyleIndex()
        ));
      }

      parts.push('</row>');
      excelRow += 1;
    }

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const height = rowHeights[r];
      const heightAttr = height ? ` ht="${height}" customHeight="1"` : '';

      parts.push(`<row r="${excelRow}"${heightAttr}>`);

      const colOffset = hasRowHeaders ? 1 : 0;

      if (hasRowHeaders) {
        parts.push(this.#cellXml(excelRow, 0, rowHeaders[r], 'string', this.#headerStyleIndex()));
      }

      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        const styleIndex = this.#registerCellStyle(cell);

        parts.push(this.#cellXml(
          excelRow,
          c + colOffset,
          cell.value,
          cell.excelType,
          styleIndex
        ));
      }

      parts.push('</row>');
      excelRow += 1;
    }

    parts.push('</sheetData>');
  }

  /**
   * Write merged cells.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeMergedCells(parts) {
    const merges = this.#data.mergedCells;

    if (merges.length === 0) {
      return;
    }

    const hasHeaders = this.#data.columnHeaders.length > 0;
    const hasRowHeaders = this.#data.rowHeaders.length > 0;
    const rowOffset = hasHeaders ? 1 : 0;
    const colOffset = hasRowHeaders ? 1 : 0;

    parts.push(`<mergeCells count="${merges.length}">`);

    merges.forEach((merge) => {
      const startRef = cellRef(merge.row + rowOffset, merge.col + colOffset);
      const endRef = cellRef(
        merge.row + merge.rowspan - 1 + rowOffset,
        merge.col + merge.colspan - 1 + colOffset
      );

      parts.push(`<mergeCell ref="${startRef}:${endRef}"/>`);
    });

    parts.push('</mergeCells>');
  }

  /**
   * Write data validation elements for dropdown/autocomplete cells.
   *
   * @param {string[]} parts XML parts array.
   */
  #writeDataValidations(parts) {
    const { rows } = this.#data;
    const hasHeaders = this.#data.columnHeaders.length > 0;
    const hasRowHeaders = this.#data.rowHeaders.length > 0;
    const rowOffset = hasHeaders ? 1 : 0;
    const colOffset = hasRowHeaders ? 1 : 0;
    const validations = [];

    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const cell = rows[r][c];

        if (cell.validation && cell.validation.type === 'list' &&
            cell.validation.values.length > 0) {
          const ref = cellRef(r + rowOffset, c + colOffset);
          const escapedValues = cell.validation.values
            .map(v => escapeXml(String(v))).join(',');
          const formula = `"${escapedValues}"`;

          validations.push(
            '<dataValidation type="list" allowBlank="1"' +
            ` showDropDown="0" sqref="${ref}">` +
            `<formula1>${formula}</formula1></dataValidation>`
          );
        }
      }
    }

    if (validations.length === 0) {
      return;
    }

    parts.push(`<dataValidations count="${validations.length}">`);

    validations.forEach((v) => {
      parts.push(v);
    });

    parts.push('</dataValidations>');
  }

  /**
   * Register a cell's style and return the xf index.
   *
   * @param {object} cell The cell data object.
   * @returns {number} The xf style index.
   */
  #registerCellStyle(cell) {
    const styleProps = { ...cell.style };

    if (cell.numberFormat) {
      styleProps.numberFormat = cell.numberFormat;
    }

    const hasStyle = styleProps.font || styleProps.fill || styleProps.border ||
      styleProps.alignment || styleProps.numberFormat;

    if (!hasStyle) {
      return 0;
    }

    return this.#styleManager.registerStyle(styleProps);
  }

  /**
   * Get or create the header style index (bold text).
   *
   * @returns {number}
   */
  #headerStyleIndex() {
    if (this._headerXfIndex === undefined) {
      this._headerXfIndex = this.#styleManager.registerStyle({
        font: { bold: true },
        fill: { color: 'D9E1F2' },
      });
    }

    return this._headerXfIndex;
  }

  /**
   * Build the XML for a single cell.
   *
   * @param {number} row 1-based Excel row number.
   * @param {number} col 0-based column index.
   * @param {*} value The cell value.
   * @param {string} type The Excel data type (string, number, boolean, date).
   * @param {number} styleIndex The xf style index.
   * @returns {string}
   */
  #cellXml(row, col, value, type, styleIndex) {
    const ref = cellRef(row - 1, col);
    const sAttr = styleIndex > 0 ? ` s="${styleIndex}"` : '';

    if (value === null || value === undefined || value === '') {
      if (styleIndex > 0) {
        return `<c r="${ref}"${sAttr}/>`;
      }

      return '';
    }

    if (type === 'number') {
      return `<c r="${ref}"${sAttr}><v>${value}</v></c>`;
    }

    if (type === 'boolean') {
      return `<c r="${ref}"${sAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
    }

    if (type === 'date') {
      const serial = dateToSerial(value);

      if (serial !== null) {
        return `<c r="${ref}"${sAttr}><v>${serial}</v></c>`;
      }
    }

    const ssIndex = this.#getSharedStringIndex(String(value));

    return `<c r="${ref}"${sAttr} t="s"><v>${ssIndex}</v></c>`;
  }

  /**
   * Get or create a shared string index.
   *
   * @param {string} str The string value.
   * @returns {number}
   */
  #getSharedStringIndex(str) {
    if (this.#sharedStringMap.has(str)) {
      return this.#sharedStringMap.get(str);
    }

    const index = this.#sharedStrings.length;

    this.#sharedStrings.push(str);
    this.#sharedStringMap.set(str, index);

    return index;
  }

  /**
   * Build xl/sharedStrings.xml.
   *
   * @returns {string}
   */
  #sharedStringsXml() {
    const count = this.#sharedStrings.length;
    const parts = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${count}" uniqueCount="${count}">`,
    ];

    this.#sharedStrings.forEach((str) => {
      const preserveSpace = str !== str.trim()
        ? ' xml:space="preserve"' : '';

      parts.push(`<si><t${preserveSpace}>${escapeXml(str)}</t></si>`);
    });

    parts.push('</sst>');

    return parts.join('');
  }
}

/**
 * Convert a 0-based row and column index to an Excel cell reference (e.g. "A1").
 *
 * @param {number} row 0-based row index.
 * @param {number} col 0-based column index.
 * @returns {string}
 */
export function cellRef(row, col) {
  let colStr = '';
  let c = col;

  do {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);

  return `${colStr}${row + 1}`;
}

/**
 * Convert pixel width to Excel column width units.
 * Excel width = (pixels - 5) / 7. The constant comes from the default font metric.
 *
 * @param {number} pixels Width in pixels.
 * @returns {number}
 */
export function pixelsToExcelWidth(pixels) {
  return Math.max(1, Math.round(((pixels - 5) / 7) * 100) / 100);
}

/**
 * Convert a date string or Date to an Excel serial date number.
 *
 * @param {string|Date} value The date value.
 * @returns {number|null} The serial date number or null if parsing fails.
 */
export function dateToSerial(value) {
  let date;

  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  return EXCEL_EPOCH_OFFSET + (date.getTime() / MS_PER_DAY);
}
