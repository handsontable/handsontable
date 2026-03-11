import { rangeEach } from '../../helpers/number';
import { stringify } from '../../helpers/mixed';

const ALIGNMENT_CLASS_MAP = {
  htLeft: 'left',
  htCenter: 'center',
  htRight: 'right',
  htJustify: 'justify',
  htTop: 'top',
  htMiddle: 'center',
  htBottom: 'bottom',
};

const HOT_TYPE_TO_NUMFMT = {
  numeric: '#,##0.00',
  date: 'yyyy-mm-dd',
  time: 'h:mm:ss',
};

/**
 * Collects data, metadata, and cell styles from a Handsontable instance
 * for use by the XLSX generator.
 *
 * @private
 */
export class DataCollector {
  /**
   * @type {Core}
   */
  #hot;
  /**
   * @type {object}
   */
  #options;

  /**
   * @param {Core} hotInstance The Handsontable instance.
   * @param {object} options Export options.
   */
  constructor(hotInstance, options) {
    this.#hot = hotInstance;
    this.#options = options;
  }

  /**
   * Collect all exportable data from the Handsontable instance.
   *
   * @returns {object} An object containing rows, columnHeaders, rowHeaders,
   *   mergedCells, columnWidths, rowHeights, and frozenPanes.
   */
  collect() {
    const { startRow, startCol, endRow, endCol } = this.#getDataRange();
    const rows = [];
    const visibleRowMap = [];
    const visibleColMap = [];

    rangeEach(startCol, endCol, (colIndex) => {
      if (!this.#options.exportHiddenColumns && this.#isHiddenColumn(colIndex)) {
        return;
      }

      visibleColMap.push(colIndex);
    });

    rangeEach(startRow, endRow, (rowIndex) => {
      if (!this.#options.exportHiddenRows && this.#isHiddenRow(rowIndex)) {
        return;
      }

      visibleRowMap.push(rowIndex);

      const row = [];

      visibleColMap.forEach((colIndex) => {
        row.push(this.#collectCell(rowIndex, colIndex));
      });

      rows.push(row);
    });

    return {
      rows,
      columnHeaders: this.#collectColumnHeaders(visibleColMap),
      rowHeaders: this.#collectRowHeaders(visibleRowMap),
      mergedCells: this.#collectMergedCells(visibleRowMap, visibleColMap),
      columnWidths: this.#collectColumnWidths(visibleColMap),
      rowHeights: this.#collectRowHeights(visibleRowMap),
      frozenPanes: this.#collectFrozenPanes(),
    };
  }

  /**
   * Collect a single cell's value, type, and style information.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {object} Cell data object with value, type, and style.
   */
  #collectCell(row, col) {
    const cellMeta = this.#hot.getCellMeta(row, col);
    const rawValue = this.#hot.getDataAtCell(row, col);
    const cellType = cellMeta.type || 'text';

    const cell = {
      value: rawValue,
      type: cellType,
      style: this.#collectCellStyle(cellMeta, row, col),
      numberFormat: this.#getNumberFormat(cellMeta, cellType),
    };

    if (cellType === 'checkbox') {
      cell.value = rawValue === true || rawValue === 'true';
      cell.excelType = 'boolean';
    } else if (cellType === 'numeric' && rawValue !== null && rawValue !== '' && !isNaN(Number(rawValue))) {
      cell.value = Number(rawValue);
      cell.excelType = 'number';
    } else if (cellType === 'date' && rawValue) {
      cell.excelType = 'date';
    } else {
      cell.value = stringify(rawValue);
      cell.excelType = 'string';
    }

    if ((cellType === 'dropdown' || cellType === 'autocomplete') && cellMeta.source) {
      cell.validation = {
        type: 'list',
        values: Array.isArray(cellMeta.source) ? cellMeta.source : [],
      };
    }

    return cell;
  }

  /**
   * Extract visual style information from cell metadata.
   *
   * @param {object} cellMeta Cell metadata object.
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {object} Style properties for the cell.
   */
  #collectCellStyle(cellMeta, row, col) {
    const style = {};
    const font = {};
    let hasFont = false;

    if (cellMeta.bold) {
      font.bold = true;
      hasFont = true;
    }
    if (cellMeta.italic) {
      font.italic = true;
      hasFont = true;
    }
    if (cellMeta.underline) {
      font.underline = true;
      hasFont = true;
    }
    if (cellMeta.fontColor) {
      font.color = normalizeColor(cellMeta.fontColor);
      hasFont = true;
    }
    if (cellMeta.fontSize) {
      font.size = cellMeta.fontSize;
      hasFont = true;
    }

    if (hasFont) {
      style.font = font;
    }

    if (cellMeta.backgroundColor) {
      style.fill = { color: normalizeColor(cellMeta.backgroundColor) };
    }

    const alignment = this.#extractAlignment(cellMeta);

    if (alignment) {
      style.alignment = alignment;
    }

    const border = this.#extractBorder(row, col);

    if (border) {
      style.border = border;
    }

    if (cellMeta.readOnly) {
      if (!style.fill) {
        style.fill = { color: 'F2F2F2' };
      }
    }

    return style;
  }

  /**
   * Extract alignment from cell metadata className.
   *
   * @param {object} cellMeta Cell metadata object.
   * @returns {object|null} Alignment object or null.
   */
  #extractAlignment(cellMeta) {
    const className = cellMeta.className;

    if (!className) {
      return null;
    }

    const classes = typeof className === 'string' ? className.split(/\s+/) : [];
    const alignment = {};
    let hasAlignment = false;

    classes.forEach((cls) => {
      if (ALIGNMENT_CLASS_MAP[cls]) {
        if (cls === 'htLeft' || cls === 'htCenter' || cls === 'htRight' || cls === 'htJustify') {
          alignment.horizontal = ALIGNMENT_CLASS_MAP[cls];
          hasAlignment = true;
        } else if (cls === 'htTop' || cls === 'htMiddle' || cls === 'htBottom') {
          alignment.vertical = ALIGNMENT_CLASS_MAP[cls];
          hasAlignment = true;
        }
      }
    });

    return hasAlignment ? alignment : null;
  }

  /**
   * Extract border information from cell metadata.
   *
   * @param {number} row Visual row index.
   * @param {number} col Visual column index.
   * @returns {object|null} Border object or null.
   */
  #extractBorder(row, col) {
    const cellMeta = this.#hot.getCellMeta(row, col);

    if (!cellMeta.borders) {
      return null;
    }

    const borders = cellMeta.borders;
    const result = {};
    let hasBorder = false;

    if (borders.top && !borders.top.hide) {
      result.top = this.#mapBorderSide(borders.top);
      hasBorder = true;
    }
    if (borders.bottom && !borders.bottom.hide) {
      result.bottom = this.#mapBorderSide(borders.bottom);
      hasBorder = true;
    }
    if (borders.start && !borders.start.hide) {
      result.left = this.#mapBorderSide(borders.start);
      hasBorder = true;
    }
    if (borders.end && !borders.end.hide) {
      result.right = this.#mapBorderSide(borders.end);
      hasBorder = true;
    }
    if (borders.left && !borders.left.hide) {
      result.left = this.#mapBorderSide(borders.left);
      hasBorder = true;
    }
    if (borders.right && !borders.right.hide) {
      result.right = this.#mapBorderSide(borders.right);
      hasBorder = true;
    }

    return hasBorder ? result : null;
  }

  /**
   * Map a Handsontable border side to Excel border format.
   *
   * @param {object} side The border side object.
   * @returns {object} Excel border side object with style and color.
   */
  #mapBorderSide(side) {
    return {
      style: this.#mapBorderStyle(side.width),
      color: normalizeColor(side.color || '#000000'),
    };
  }

  /**
   * Map a border width to an Excel border style name.
   *
   * @param {number} [width] Border width in pixels.
   * @returns {string} Excel border style name.
   */
  #mapBorderStyle(width) {
    if (width >= 3) {
      return 'thick';
    }
    if (width >= 2) {
      return 'medium';
    }

    return 'thin';
  }

  /**
   * Get the Excel number format for a cell type.
   *
   * @param {object} cellMeta Cell metadata object.
   * @param {string} cellType The cell type name.
   * @returns {string|null} The number format string or null.
   */
  #getNumberFormat(cellMeta, cellType) {
    if (cellMeta.numericFormat && cellMeta.numericFormat.pattern) {
      return cellMeta.numericFormat.pattern;
    }

    return HOT_TYPE_TO_NUMFMT[cellType] || null;
  }

  /**
   * Collect column header values.
   *
   * @param {number[]} visibleColMap Array of visible column indexes.
   * @returns {string[]} Column header values.
   */
  #collectColumnHeaders(visibleColMap) {
    if (!this.#options.columnHeaders) {
      return [];
    }

    const allHeaders = this.#hot.getColHeader();

    return visibleColMap.map(colIndex => allHeaders[colIndex] ?? `Column ${colIndex + 1}`);
  }

  /**
   * Collect row header values.
   *
   * @param {number[]} visibleRowMap Array of visible row indexes.
   * @returns {string[]} Row header values.
   */
  #collectRowHeaders(visibleRowMap) {
    if (!this.#options.rowHeaders) {
      return [];
    }

    const allHeaders = this.#hot.getRowHeader();

    return visibleRowMap.map(rowIndex => allHeaders[rowIndex] ?? `${rowIndex + 1}`);
  }

  /**
   * Collect merged cell regions adjusted for the export range.
   *
   * @param {number[]} visibleRowMap Array of visible row indexes.
   * @param {number[]} visibleColMap Array of visible column indexes.
   * @returns {Array<object>} Array of merged cell objects with row, col, rowspan, colspan.
   */
  #collectMergedCells(visibleRowMap, visibleColMap) {
    const mergeCellsPlugin = this.#hot.getPlugin('mergeCells');

    if (!mergeCellsPlugin || !mergeCellsPlugin.enabled) {
      return [];
    }

    const mergedCells = mergeCellsPlugin.mergedCellsCollection?.mergedCells || [];
    const result = [];

    mergedCells.forEach((merge) => {
      const exportRowStart = visibleRowMap.indexOf(merge.row);
      const exportColStart = visibleColMap.indexOf(merge.col);

      if (exportRowStart === -1 || exportColStart === -1) {
        return;
      }

      let exportRowspan = 0;
      let exportColspan = 0;

      for (let r = merge.row; r < merge.row + merge.rowspan; r += 1) {
        if (visibleRowMap.includes(r)) {
          exportRowspan += 1;
        }
      }

      for (let c = merge.col; c < merge.col + merge.colspan; c += 1) {
        if (visibleColMap.includes(c)) {
          exportColspan += 1;
        }
      }

      if (exportRowspan > 1 || exportColspan > 1) {
        result.push({
          row: exportRowStart,
          col: exportColStart,
          rowspan: exportRowspan,
          colspan: exportColspan,
        });
      }
    });

    return result;
  }

  /**
   * Collect column widths for visible columns.
   *
   * @param {number[]} visibleColMap Array of visible column indexes.
   * @returns {number[]} Array of column widths in pixels.
   */
  #collectColumnWidths(visibleColMap) {
    return visibleColMap.map((colIndex) => {
      const width = this.#hot.getColWidth(colIndex);

      return width || 80;
    });
  }

  /**
   * Collect row heights for visible rows.
   *
   * @param {number[]} visibleRowMap Array of visible row indexes.
   * @returns {number[]} Array of row heights in pixels.
   */
  #collectRowHeights(visibleRowMap) {
    return visibleRowMap.map((rowIndex) => {
      const height = this.#hot.getRowHeight(rowIndex);

      return height || null;
    });
  }

  /**
   * Collect frozen pane information.
   *
   * @returns {object|null} Object with frozenRows and frozenCols, or null.
   */
  #collectFrozenPanes() {
    const settings = this.#hot.getSettings();
    const frozenRows = settings.fixedRowsTop || 0;
    const frozenCols = settings.fixedColumnsStart || 0;

    if (frozenRows === 0 && frozenCols === 0) {
      return null;
    }

    return { frozenRows, frozenCols };
  }

  /**
   * Calculate the data range based on options.
   *
   * @returns {object} Object with startRow, startCol, endRow, endCol.
   */
  #getDataRange() {
    const cols = this.#hot.countCols() - 1;
    const rows = this.#hot.countRows() - 1;
    let [startRow = 0, startCol = 0, endRow = rows, endCol = cols] = this.#options.range;

    startRow = Math.max(startRow, 0);
    startCol = Math.max(startCol, 0);
    endRow = Math.min(endRow, rows);
    endCol = Math.min(endCol, cols);

    return { startRow, startCol, endRow, endCol };
  }

  /**
   * Check if a row is hidden.
   *
   * @param {number} row Visual row index.
   * @returns {boolean}
   */
  #isHiddenRow(row) {
    return this.#hot.rowIndexMapper.isHidden(this.#hot.toPhysicalRow(row));
  }

  /**
   * Check if a column is hidden.
   *
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  #isHiddenColumn(column) {
    return this.#hot.columnIndexMapper.isHidden(this.#hot.toPhysicalColumn(column));
  }
}

/**
 * Normalize a CSS color value to a 6-character hex string (without `#`).
 *
 * @param {string} color The color string (hex, rgb(), or named color).
 * @returns {string} 6-character uppercase hex color.
 */
export function normalizeColor(color) {
  if (!color || typeof color !== 'string') {
    return '000000';
  }

  color = color.trim();

  if (color.startsWith('#')) {
    const hex = color.slice(1);

    if (hex.length === 3) {
      return (hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]).toUpperCase();
    }

    return hex.slice(0, 6).toUpperCase().padEnd(6, '0');
  }

  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);

  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');

    return (r + g + b).toUpperCase();
  }

  return '000000';
}
