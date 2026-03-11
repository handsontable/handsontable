import { stringify } from '../../../helpers/mixed';
import BaseType from '../../exportFile/types/_base';
import { createZipArchive } from '../helpers/zipArchive';

/**
 * Escape XML special characters.
 *
 * @param {*} value Any XML value.
 * @returns {string}
 */
function escapeXml(value) {
  return stringify(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * @private
 */
class Xlsx extends BaseType {
  /**
   * Default options for exporting XLSX format.
   *
   * @returns {object}
   */
  static get DEFAULT_OPTIONS() {
    return {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileExtension: 'xlsx',
      sheetName: 'Sheet1',
      formulas: false,
    };
  }

  /**
   * Create a XLSX payload as a byte array.
   *
   * @returns {Uint8Array}
   */
  export() {
    const worksheetXml = this._createWorksheetXml();

    return createZipArchive([
      {
        name: '[Content_Types].xml',
        data: this._createContentTypesXml(),
      },
      {
        name: '_rels/.rels',
        data: this._createRootRelationshipsXml(),
      },
      {
        name: 'xl/workbook.xml',
        data: this._createWorkbookXml(),
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        data: this._createWorkbookRelationshipsXml(),
      },
      {
        name: 'xl/styles.xml',
        data: this._createStylesXml(),
      },
      {
        name: 'xl/worksheets/sheet1.xml',
        data: worksheetXml,
      },
    ]);
  }

  /**
   * Create the worksheet XML.
   *
   * @private
   * @returns {string}
   */
  _createWorksheetXml() {
    const rows = [];
    const dataRows = this.dataProvider.getCells();
    const rowHeaders = this.dataProvider.getRowHeaders();
    const columnHeaders = this.dataProvider.getColumnHeaders();
    const hasRowHeaders = rowHeaders.length > 0;
    const hasColumnHeaders = columnHeaders.length > 0;

    if (hasColumnHeaders) {
      const headerRow = [];

      if (hasRowHeaders) {
        headerRow.push({ type: 'empty', value: '' });
      }

      for (let i = 0; i < columnHeaders.length; i += 1) {
        headerRow.push({
          type: 'string',
          value: stringify(columnHeaders[i]),
        });
      }

      rows.push(headerRow);
    }

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const row = [];

      if (hasRowHeaders) {
        row.push({
          type: 'string',
          value: stringify(rowHeaders[rowIndex]),
        });
      }

      for (let columnIndex = 0; columnIndex < dataRows[rowIndex].length; columnIndex += 1) {
        row.push(dataRows[rowIndex][columnIndex]);
      }

      rows.push(row);
    }

    const xmlRows = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowNumber = rowIndex + 1;
      const xmlCells = [];

      for (let columnIndex = 0; columnIndex < rows[rowIndex].length; columnIndex += 1) {
        const xmlCell = this._serializeCell(rows[rowIndex][columnIndex], rowNumber, columnIndex + 1);

        if (xmlCell !== '') {
          xmlCells.push(xmlCell);
        }
      }

      if (xmlCells.length > 0) {
        xmlRows.push(`<row r="${rowNumber}">${xmlCells.join('')}</row>`);
      }
    }

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      `<sheetData>${xmlRows.join('')}</sheetData>`,
      '</worksheet>',
    ].join('');
  }

  /**
   * Serialize a single cell as XML.
   *
   * @private
   * @param {{type: string, value: *}} cellDescriptor Cell descriptor.
   * @param {number} rowNumber Spreadsheet row number.
   * @param {number} columnNumber Spreadsheet column number.
   * @returns {string}
   */
  _serializeCell(cellDescriptor, rowNumber, columnNumber) {
    const cellRef = `${this._columnIndexToLabel(columnNumber)}${rowNumber}`;

    if (cellDescriptor.type === 'formula') {
      return `<c r="${cellRef}"><f>${escapeXml(cellDescriptor.value)}</f></c>`;
    }

    if (cellDescriptor.type === 'number') {
      return `<c r="${cellRef}"><v>${cellDescriptor.value}</v></c>`;
    }

    if (cellDescriptor.type === 'boolean') {
      return `<c r="${cellRef}" t="b"><v>${cellDescriptor.value ? 1 : 0}</v></c>`;
    }

    if (cellDescriptor.type === 'empty') {
      return '';
    }

    return [
      `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">`,
      `${escapeXml(cellDescriptor.value)}`,
      '</t></is></c>',
    ].join('');
  }

  /**
   * Convert a 1-based column index into a spreadsheet column label.
   *
   * @private
   * @param {number} columnIndex 1-based column index.
   * @returns {string}
   */
  _columnIndexToLabel(columnIndex) {
    let index = columnIndex;
    let label = '';

    while (index > 0) {
      const modulo = (index - 1) % 26;

      label = String.fromCharCode(65 + modulo) + label;
      index = Math.floor((index - modulo) / 26);
    }

    return label;
  }

  /**
   * Build [Content_Types].xml.
   *
   * @private
   * @returns {string}
   */
  _createContentTypesXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/xl/workbook.xml"',
      ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
      '<Override PartName="/xl/worksheets/sheet1.xml"',
      ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
      '<Override PartName="/xl/styles.xml"',
      ' ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
      '</Types>',
    ].join('');
  }

  /**
   * Build _rels/.rels.
   *
   * @private
   * @returns {string}
   */
  _createRootRelationshipsXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1"',
      ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"',
      ' Target="xl/workbook.xml"/>',
      '</Relationships>',
    ].join('');
  }

  /**
   * Build xl/workbook.xml.
   *
   * @private
   * @returns {string}
   */
  _createWorkbookXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<sheets>',
      `<sheet name="${escapeXml(this._normalizeSheetName(this.options.sheetName))}" sheetId="1" r:id="rId1"/>`,
      '</sheets>',
      '</workbook>',
    ].join('');
  }

  /**
   * Build xl/_rels/workbook.xml.rels.
   *
   * @private
   * @returns {string}
   */
  _createWorkbookRelationshipsXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1"',
      ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"',
      ' Target="worksheets/sheet1.xml"/>',
      '<Relationship Id="rId2"',
      ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"',
      ' Target="styles.xml"/>',
      '</Relationships>',
    ].join('');
  }

  /**
   * Build xl/styles.xml.
   *
   * @private
   * @returns {string}
   */
  _createStylesXml() {
    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      '<fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>',
      '<fills count="2"><fill><patternFill patternType="none"/></fill>',
      '<fill><patternFill patternType="gray125"/></fill></fills>',
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
      '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
      '</styleSheet>',
    ].join('');
  }

  /**
   * Sanitize sheet name for OOXML constraints.
   *
   * @private
   * @param {string} name Candidate sheet name.
   * @returns {string}
   */
  _normalizeSheetName(name) {
    const sanitized = stringify(name).replace(/[\\/*?:[\]]/g, ' ').trim();

    return (sanitized || 'Sheet1').slice(0, 31);
  }
}

export default Xlsx;
