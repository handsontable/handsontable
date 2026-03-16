import { rangeEach } from '../../helpers/number';
import { arrayEach } from '../../helpers/array';

/**
 * @private
 */
class DataProvider {
  /**
   * Handsontable instance.
   *
   * @type {Core}
   */
  hot;
  /**
   * Format type class options.
   *
   * @type {object}
   */
  options = {};

  constructor(hotInstance) {
    this.hot = hotInstance;
  }

  /**
   * Set options for data provider.
   *
   * @param {object} options Object with specified options.
   */
  setOptions(options) {
    this.options = options;
  }

  /**
   * Get table data based on provided settings to the class constructor.
   *
   * @returns {Array}
   */
  getData() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const data = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      const row = [];

      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }
      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }
        row.push(this.hot.getDataAtCell(rowIndex, colIndex));
      });

      data.push(row);
    });

    return data;
  }

  /**
   * Gets list of row headers.
   *
   * @returns {Array}
   */
  getRowHeaders() {
    const headers = [];

    if (this.options.rowHeaders) {
      const { startRow, endRow } = this._getDataRange();
      const rowHeaders = this.hot.getRowHeader();

      rangeEach(startRow, endRow, (row) => {
        if (!this.options.exportHiddenRows && this._isHiddenRow(row)) {
          return;
        }
        headers.push(rowHeaders[row]);
      });
    }

    return headers;
  }

  /**
   * Gets list of columns headers.
   *
   * @returns {Array}
   */
  getColumnHeaders() {
    const headers = [];

    if (this.options.columnHeaders) {
      const { startCol, endCol } = this._getDataRange();
      const colHeaders = this.hot.getColHeader();

      rangeEach(startCol, endCol, (column) => {
        if (!this.options.exportHiddenColumns && this._isHiddenColumn(column)) {
          return;
        }
        headers.push(colHeaders[column]);
      });
    }

    return headers;
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
    let [startRow = 0, startCol = 0, endRow = rows, endCol = cols] = this.options.range;

    startRow = Math.max(startRow, 0);
    startCol = Math.max(startCol, 0);
    endRow = Math.min(endRow, rows);
    endCol = Math.min(endCol, cols);

    return { startRow, startCol, endRow, endCol };
  }

  /**
   * Get raw source data (formulas) based on provided settings to the class constructor.
   *
   * Mirrors {@link DataProvider#getData} but uses `getSourceDataAtCell` so that cells
   * containing HyperFormula formulas return the raw formula string (e.g. `'=SUM(A1:A3)'`)
   * rather than the calculated value.
   *
   * @returns {Array}
   */
  getSourceData() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const data = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      const row = [];

      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }
      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }
        row.push(this.hot.getSourceDataAtCell(rowIndex, colIndex));
      });

      data.push(row);
    });

    return data;
  }

  /**
   * Gets the function argument separator used by the HyperFormula engine, if active.
   *
   * Returns `','` when the Formulas plugin is absent or disabled, since that is the
   * separator OOXML (Excel) always expects.
   *
   * @returns {string}
   */
  getFormulasSeparator() {
    const formulasPlugin = this.hot.getPlugin('formulas');

    if (!formulasPlugin || !formulasPlugin.isEnabled()) {
      return ',';
    }

    return formulasPlugin.engine?.getConfig()?.functionArgSeparator ?? ',';
  }

  /**
   * Gets cell meta for all cells in the export range.
   *
   * Returns a 2D array of cell meta objects with the same structure as {@link DataProvider#getData}.
   * Each entry corresponds to the cell at the same position in the data array.
   *
   * @returns {Array}
   */
  getCellsMeta() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const meta = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }

      const rowMeta = [];

      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }
        rowMeta.push(this.hot.getCellMeta(rowIndex, colIndex));
      });

      meta.push(rowMeta);
    });

    return meta;
  }

  /**
   * Gets rendered DOM elements for all cells in the export range.
   *
   * Returns a 2D array of `HTMLElement | null` values with the same structure as
   * {@link DataProvider#getCellsMeta}. An entry is `null` when the cell is outside
   * the rendered viewport (virtualised grid).
   *
   * @returns {Array}
   */
  getCellElements() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const options = this.options;
    const elements = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }

      const rowElements = [];

      rangeEach(startCol, endCol, (colIndex) => {
        if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
          return;
        }
        rowElements.push(this.hot.getCell(rowIndex, colIndex));
      });

      elements.push(rowElements);
    });

    return elements;
  }

  /**
   * Gets the merged cells configuration filtered to the current export range.
   *
   * Returned coordinates are 0-based and relative to the top-left corner of the
   * export range. Only merges that fall fully within the range are included.
   *
   * @returns {Array}
   */
  getMergeCells() {
    const { startRow, startCol, endRow, endCol } = this._getDataRange();
    const mergeCellsPlugin = this.hot.getPlugin('mergeCells');

    if (!mergeCellsPlugin || !mergeCellsPlugin.isEnabled()) {
      return [];
    }

    const mergedCells = mergeCellsPlugin.mergedCellsCollection.mergedCells;
    const result = [];

    arrayEach(mergedCells, (merge) => {
      const mergeEndRow = merge.row + merge.rowspan - 1;
      const mergeEndCol = merge.col + merge.colspan - 1;

      if (merge.row < startRow || mergeEndRow > endRow ||
          merge.col < startCol || mergeEndCol > endCol) {
        return;
      }

      result.push({
        row: merge.row - startRow,
        col: merge.col - startCol,
        rowspan: merge.rowspan,
        colspan: merge.colspan,
      });
    });

    return result;
  }

  /**
   * Gets widths (in pixels) for all visible columns in the export range.
   *
   * Returns values in the same column order as {@link DataProvider#getData}.
   *
   * @returns {Array}
   */
  getColumnsWidths() {
    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const widths = [];

    rangeEach(startCol, endCol, (colIndex) => {
      if (!options.exportHiddenColumns && this._isHiddenColumn(colIndex)) {
        return;
      }
      widths.push(this.hot.getColWidth(colIndex));
    });

    return widths;
  }

  /**
   * Gets heights (in pixels) for all visible rows in the export range.
   *
   * Returns values in the same row order as {@link DataProvider#getData}.
   *
   * @returns {Array}
   */
  getRowsHeights() {
    const { startRow, endRow } = this._getDataRange();
    const options = this.options;
    const heights = [];

    rangeEach(startRow, endRow, (rowIndex) => {
      if (!options.exportHiddenRows && this._isHiddenRow(rowIndex)) {
        return;
      }
      heights.push(this.hot.getRowHeight(rowIndex));
    });

    return heights;
  }

  /**
   * Gets the number of frozen rows (`fixedRowsTop` setting).
   *
   * @returns {number}
   */
  getFrozenRows() {
    return this.hot.getSettings().fixedRowsTop || 0;
  }

  /**
   * Gets the number of frozen columns (`fixedColumnsStart` setting).
   *
   * @returns {number}
   */
  getFrozenColumns() {
    return this.hot.getSettings().fixedColumnsStart || 0;
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

    if (!nestedHeadersPlugin || !nestedHeadersPlugin.isEnabled()) {
      return null;
    }

    const layersCount = nestedHeadersPlugin.getLayersCount();
    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const layers = [];

    for (let layer = 0; layer < layersCount; layer++) {
      const layerHeaders = [];
      let col = startCol;

      while (col <= endCol) {
        if (!options.exportHiddenColumns && this._isHiddenColumn(col)) {
          col += 1;
          continue;
        }

        const settings = nestedHeadersPlugin.getHeaderSettings(layer, col);

        if (!settings || settings.isRoot) {
          const spanColspan = settings?.colspan ?? 1;
          let visibleColspan = 0;

          for (let spanCol = col; spanCol < col + spanColspan && spanCol <= endCol; spanCol++) {
            if (options.exportHiddenColumns || !this._isHiddenColumn(spanCol)) {
              visibleColspan += 1;
            }
          }

          // headerClassNames is an array of strings produced by the settings normalizer
          // from the user-supplied `headerClassName` string.
          const className = (settings?.headerClassNames ?? []).join(' ');

          layerHeaders.push({ label: settings?.label ?? '', colspan: visibleColspan, className });
          col += spanColspan;
        } else {
          // Continuation cell of a span that started at an earlier column.
          // This can only occur when startCol falls inside a span — emit a
          // single-column placeholder so the export column count stays correct.
          layerHeaders.push({ label: '', colspan: 1, className: '' });
          col += 1;
        }
      }

      layers.push(layerHeaders);
    }

    return layers;
  }

  /**
   * Gets `headerClassName` values for all visible column headers in the export range.
   *
   * Returns values in the same column order as {@link DataProvider#getColumnHeaders}.
   * An empty string is returned for columns that have no `headerClassName` configured.
   *
   * @returns {string[]}
   */
  getColumnHeadersClassNames() {
    if (!this.options.columnHeaders) {
      return [];
    }

    const { startCol, endCol } = this._getDataRange();
    const options = this.options;
    const classNames = [];

    rangeEach(startCol, endCol, (col) => {
      if (!options.exportHiddenColumns && this._isHiddenColumn(col)) {
        return;
      }

      classNames.push(this.hot.getColumnMeta(col).headerClassName || '');
    });

    return classNames;
  }

  /**
   * Gets the layout direction of the Handsontable instance.
   *
   * @returns {'ltr'|'rtl'}
   */
  getLayoutDirection() {
    return this.hot.getSettings().layoutDirection === 'rtl' ? 'rtl' : 'ltr';
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
    const allEndpoints = plugin.endpoints.getAllEndpoints();
    const summaries = [];

    arrayEach(allEndpoints, (endpoint) => {
      const destRow = this._physicalRowToDataIndex(endpoint.destinationRow, startRow, endRow);
      const destCol = this._physicalColToDataIndex(endpoint.destinationColumn, startCol, endCol);

      if (destRow === null || destCol === null) {
        return;
      }

      const physSourceCol = endpoint.sourceColumn ?? endpoint.destinationColumn;
      const sourceCol = this._physicalColToDataIndex(physSourceCol, startCol, endCol);

      if (sourceCol === null) {
        return;
      }

      // Convert physical row ranges to sequential data-row-index ranges,
      // merging consecutive indices so the resulting array stays compact.
      const physRanges = endpoint.ranges || [[0, this.hot.countRows() - 1]];
      const sourceRanges = [];

      arrayEach(physRanges, (range) => {
        const physStart = range[0];
        const physEnd = range[1] !== undefined ? range[1] : range[0];

        for (let physRow = physStart; physRow <= physEnd; physRow++) {
          const dataIdx = this._physicalRowToDataIndex(physRow, startRow, endRow);

          if (dataIdx === null) {
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
        return;
      }

      summaries.push({
        destRow,
        destCol,
        type: String(endpoint.type || 'sum').toLowerCase(),
        sourceCol,
        sourceRanges,
      });
    });

    return summaries;
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
  _physicalRowToDataIndex(physRow, startRow, endRow) {
    const visualRow = this.hot.toVisualRow(physRow);

    if (visualRow === null || visualRow < startRow || visualRow > endRow) {
      return null;
    }

    if (!this.options.exportHiddenRows && this._isHiddenRow(visualRow)) {
      return null;
    }

    let dataIndex = 0;

    for (let r = startRow; r < visualRow; r++) {
      if (this.options.exportHiddenRows || !this._isHiddenRow(r)) {
        dataIndex += 1;
      }
    }

    return dataIndex;
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
  _physicalColToDataIndex(physCol, startCol, endCol) {
    const visualCol = this.hot.toVisualColumn(physCol);

    if (visualCol === null || visualCol < startCol || visualCol > endCol) {
      return null;
    }

    if (!this.options.exportHiddenColumns && this._isHiddenColumn(visualCol)) {
      return null;
    }

    let dataIndex = 0;

    for (let c = startCol; c < visualCol; c++) {
      if (this.options.exportHiddenColumns || !this._isHiddenColumn(c)) {
        dataIndex += 1;
      }
    }

    return dataIndex;
  }

  /**
   * Check if row at specified row index is hidden.
   *
   * @private
   * @param {number} row Row index.
   * @returns {boolean}
   */
  _isHiddenRow(row) {
    return this.hot.rowIndexMapper.isHidden(this.hot.toPhysicalRow(row));
  }

  /**
   * Check if column at specified column index is hidden.
   *
   * @private
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  _isHiddenColumn(column) {
    return this.hot.columnIndexMapper.isHidden(this.hot.toPhysicalColumn(column));
  }
}

export default DataProvider;
