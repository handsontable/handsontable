import type { HotInstance } from '../../core/types';
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
 * @private
 */
class DataProvider {
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
    if (options && 'columnHeaders' in options && !('colHeaders' in options)) {
      this.options = { ...options, colHeaders: options.columnHeaders };

      return;
    }

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
        headers.push(rowHeaders[row]);
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
        headers.push(colHeaders[column]);
      }
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
   * Mirrors {@link DataProvider#getData} but uses `getSourceDataAtCell` so that cells
   * containing HyperFormula formulas return the raw formula string (e.g. `'=SUM(A1:A3)'`)
   * rather than the calculated value.
   *
   * @returns {Array}
   */
  getSourceData() {
    return this._extractDataMatrix((row, col) => this.hot.getSourceDataAtCell(row, col));
  }

  /**
   * Returns the set of physical HOT row indices that are hidden and excluded from the
   * exported data matrix (i.e. `exportHiddenRows` is `false` and the row is hidden).
   *
   * Returns an empty set when `exportHiddenRows` is `true` or `'hide'`, because in
   * those cases all rows are included in the data matrix and no formula-offset
   * adjustment is needed.
   *
   * Used by the formula normalizer to adjust per-reference row offsets when building
   * live Excel formulas from HyperFormula formula strings.
   *
   * @returns {Set<number>}
   */
  getExcludedHiddenRows(): Set<number> {
    const result = new Set<number>();

    if (this.options.exportHiddenRows !== false) {
      return result;
    }

    const { startRow, endRow } = this._getDataRange();

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      if (this._isHiddenRow(rowIndex)) {
        result.add(this.hot.toPhysicalRow(rowIndex));
      }
    }

    return result;
  }

  /**
   * Returns the set of physical HOT column indices that are hidden and excluded from the
   * exported data matrix (i.e. `exportHiddenColumns` is `false` and the column is hidden).
   *
   * Returns an empty set when `exportHiddenColumns` is `true` or `'hide'`, because in
   * those cases all columns are included in the data matrix and no formula-offset
   * adjustment is needed.
   *
   * Used by the formula normalizer to adjust per-reference column offsets when building
   * live Excel formulas from HyperFormula formula strings.
   *
   * @returns {Set<number>}
   */
  getExcludedHiddenColumns(): Set<number> {
    const result = new Set<number>();

    if (this.options.exportHiddenColumns !== false) {
      return result;
    }

    const { startCol, endCol } = this._getDataRange();

    for (let colIndex = startCol; colIndex <= endCol; colIndex++) {
      if (this._isHiddenColumn(colIndex)) {
        result.add(this.hot.toPhysicalColumn(colIndex));
      }
    }

    return result;
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

    if (!formulasPlugin || !formulasPlugin.isEnabled()) {
      return ',';
    }

    return (formulasPlugin.engine?.getConfig()?.functionArgSeparator as string | undefined) ?? ',';
  }

  /**
   * Gets cell meta for all cells in the export range.
   *
   * Returns a 2D array of cell meta objects with the same structure as {@link DataProvider#getData}.
   * Each entry corresponds to the cell at the same position in the data array.
   *
   * @returns {Array}
   */
  getCellsMeta(): Record<string, unknown>[][] {
    return this._extractDataMatrix(
      (row: number, col: number): Record<string, unknown> => this.hot.getCellMeta(row, col)
    );
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
    return this._extractDataMatrix((row: number, col: number) => this.hot.getCell(row, col));
  }

  /**
   * Gets the merged cells configuration filtered to the current export range.
   *
   * Returned coordinates are 0-based data-array indices (matching the same coordinate
   * space as {@link DataProvider#getData}). Hidden rows/columns excluded from the export
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

    if (!mergeCellsPlugin || !mergeCellsPlugin.isEnabled()) {
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
   * Returns values in the same column order as {@link DataProvider#getData}.
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
   * Returns values in the same row order as {@link DataProvider#getData}.
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

      layerHeaders.push({ label: treeNodeData?.label ?? '', colspan: effectiveColspan, className });

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
    nestedHeadersPlugin: NestedHeadersPluginWithSettings, layer: number, col: number,
    endCol: number, layerHeaders: Array<{ label: string; colspan: number; className: string }>
  ) {
    const settings = nestedHeadersPlugin.getHeaderSettings(layer, col);

    if (!settings || settings.isRoot) {
      const spanColspan = settings?.colspan ?? 1;
      let visibleColspan = 0;

      for (let spanCol = col; spanCol < col + spanColspan && spanCol <= endCol; spanCol++) {
        if (!this._isHiddenColumn(spanCol)) {
          visibleColspan += 1;
        }
      }

      // headerClassNames is an array of strings produced by the settings normalizer
      // from the user-supplied `headerClassName` string.
      const className = (settings?.headerClassNames ?? []).join(' ');

      layerHeaders.push({ label: settings?.label ?? '', colspan: visibleColspan, className });

      return col + spanColspan;
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
   * Returns values in the same column order as {@link DataProvider#getColumnHeaders}.
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
   * Used by {@link DataProvider#_physicalRowToDataIndex} and
   * {@link DataProvider#_physicalColToDataIndex} to compute the 0-based data-array
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
   * from column meta or the `colWidths` setting, bypassing that hook.
   *
   * @private
   * @param {number} colIndex Visual column index.
   * @returns {number}
   */
  _getNaturalColWidth(colIndex: number): number {
    const settings = this.hot.getSettings();
    const metaWidth = this.hot.getColumnMeta(colIndex).width;

    if (metaWidth !== null && metaWidth !== undefined) {
      return metaWidth as number;
    }

    const { colWidths, defaultColumnWidth } = settings;
    const fallback: number = (defaultColumnWidth as number | undefined) ?? 50;

    if (Array.isArray(colWidths)) {
      return (colWidths[colIndex] as number | undefined) ?? fallback;
    } else if (typeof colWidths === 'function') {
      return (colWidths(colIndex) as number | undefined) ?? fallback;
    } else if (typeof colWidths === 'number') {
      return colWidths;
    }

    return fallback;
  }

  /**
   * Returns the natural (pre-hiding) height in pixels for a hidden row.
   *
   * `getRowHeight()` returns 0 for hidden rows because the HiddenRows plugin
   * overrides the `modifyRowHeight` hook. This method reads the configured height
   * directly from the `rowHeights` setting, bypassing that hook.
   *
   * @private
   * @param {number} rowIndex Visual row index.
   * @returns {number}
   */
  _getNaturalRowHeight(rowIndex: number): number {
    const settings = this.hot.getSettings();
    const { rowHeights, defaultRowHeight } = settings;
    const fallback: number = (defaultRowHeight as number | undefined) ?? 23;

    if (Array.isArray(rowHeights)) {
      return (rowHeights[rowIndex] as number | undefined) ?? fallback;
    } else if (typeof rowHeights === 'function') {
      return (rowHeights(rowIndex) as number | undefined) ?? fallback;
    } else if (typeof rowHeights === 'number') {
      return rowHeights;
    }

    return fallback;
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

export default DataProvider;
