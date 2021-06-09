import Highlight from './highlight/highlight';
import {
  AREA_TYPE,
  HEADER_TYPE,
  CELL_TYPE,
} from './highlight/constants';
import SelectionRange from './range';
import { CellCoords } from './../3rdparty/walkontable/src';
import { isPressedCtrlKey } from './../utils/keyStateObserver';
import { createObjectPropListener, mixin } from './../helpers/object';
import { isUndefined } from './../helpers/mixed';
import { arrayEach } from './../helpers/array';
import localHooks from './../mixins/localHooks';
import Transformation from './transformation';
import {
  detectSelectionType,
  isValidCoord,
  normalizeSelectionFactory,
  SELECTION_TYPE_EMPTY,
  SELECTION_TYPE_UNRECOGNIZED,
} from './utils';
import { toSingleLine } from './../helpers/templateLiteralTag';

/**
 * @class Selection
 * @util
 */
class Selection {
  constructor(settings, tableProps) {
    /**
     * Handsontable settings instance.
     *
     * @type {GridSettings}
     */
    this.settings = settings;
    /**
     * An additional object with dynamically defined properties which describes table state.
     *
     * @type {object}
     */
    this.tableProps = tableProps;
    /**
     * The flag which determines if the selection is in progress.
     *
     * @type {boolean}
     */
    this.inProgress = false;
    /**
     * The flag indicates that selection was performed by clicking the corner overlay.
     *
     * @type {boolean}
     */
    this.selectedByCorner = false;
    /**
     * The collection of the selection layer levels where the whole row was selected using the row header or
     * the corner header.
     *
     * @type {Set.<number>}
     */
    this.selectedByRowHeader = new Set();
    /**
     * The collection of the selection layer levels where the whole column was selected using the column header or
     * the corner header.
     *
     * @type {Set.<number>}
     */
    this.selectedByColumnHeader = new Set();
    /**
     * Selection data layer (handle visual coordinates).
     *
     * @type {SelectionRange}
     */
    this.selectedRange = new SelectionRange();
    /**
     * Visualization layer.
     *
     * @type {Highlight}
     */
    this.highlight = new Highlight({
      headerClassName: settings.currentHeaderClassName,
      activeHeaderClassName: settings.activeHeaderClassName,
      rowClassName: settings.currentRowClassName,
      columnClassName: settings.currentColClassName,
      disabledCellSelection: (row, column) => this.tableProps.isDisabledCellSelection(row, column),
      cellCornerVisible: (...args) => this.isCellCornerVisible(...args),
      areaCornerVisible: (...args) => this.isAreaCornerVisible(...args),
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
    });
    /**
     * The module for modifying coordinates.
     *
     * @type {Transformation}
     */
    this.transformation = new Transformation(this.selectedRange, {
      countRows: () => this.tableProps.countRowsTranslated(),
      countCols: () => this.tableProps.countColsTranslated(),
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
      fixedRowsBottom: () => settings.fixedRowsBottom,
      minSpareRows: () => settings.minSpareRows,
      minSpareCols: () => settings.minSpareCols,
      autoWrapRow: () => settings.autoWrapRow,
      autoWrapCol: () => settings.autoWrapCol,
    });

    this.transformation.addLocalHook('beforeTransformStart',
      (...args) => this.runLocalHooks('beforeModifyTransformStart', ...args));
    this.transformation.addLocalHook('afterTransformStart',
      (...args) => this.runLocalHooks('afterModifyTransformStart', ...args));
    this.transformation.addLocalHook('beforeTransformEnd',
      (...args) => this.runLocalHooks('beforeModifyTransformEnd', ...args));
    this.transformation.addLocalHook('afterTransformEnd',
      (...args) => this.runLocalHooks('afterModifyTransformEnd', ...args));
    this.transformation.addLocalHook('insertRowRequire',
      (...args) => this.runLocalHooks('insertRowRequire', ...args));
    this.transformation.addLocalHook('insertColRequire',
      (...args) => this.runLocalHooks('insertColRequire', ...args));
  }

  /**
   * Get data layer for current selection.
   *
   * @returns {SelectionRange}
   */
  getSelectedRange() {
    return this.selectedRange;
  }

  /**
   * Indicate that selection process began. It sets internaly `.inProgress` property to `true`.
   */
  begin() {
    this.inProgress = true;
  }

  /**
   * Indicate that selection process finished. It sets internaly `.inProgress` property to `false`.
   */
  finish() {
    this.runLocalHooks('afterSelectionFinished', Array.from(this.selectedRange));
    this.inProgress = false;
  }

  /**
   * Check if the process of selecting the cell/cells is in progress.
   *
   * @returns {boolean}
   */
  isInProgress() {
    return this.inProgress;
  }

  /**
   * Starts selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {boolean} [multipleSelection] If `true`, selection will be worked in 'multiple' mode. This option works
   *                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined
   *                                      the default trigger will be used (isPressedCtrlKey() helper).
   * @param {boolean} [fragment=false] If `true`, the selection will be treated as a partial selection where the
   *                                   `setRangeEnd` method won't be called on every `setRangeStart` call.
   */
  setRangeStart(coords, multipleSelection, fragment = false) {
    const isMultipleMode = this.settings.selectionMode === 'multiple';
    const isMultipleSelection = isUndefined(multipleSelection) ? isPressedCtrlKey() : multipleSelection;
    const isRowNegative = coords.row < 0;
    const isColumnNegative = coords.col < 0;
    const selectedByCorner = isRowNegative && isColumnNegative;

    this.selectedByCorner = selectedByCorner;
    this.runLocalHooks(`beforeSetRangeStart${fragment ? 'Only' : ''}`, coords);

    if (!isMultipleMode || (isMultipleMode && !isMultipleSelection && isUndefined(multipleSelection))) {
      this.selectedRange.clear();
    }

    this.selectedRange.add(coords);

    if (this.getLayerLevel() === 0) {
      this.selectedByRowHeader.clear();
      this.selectedByColumnHeader.clear();
    }

    if (!selectedByCorner && isColumnNegative) {
      this.selectedByRowHeader.add(this.getLayerLevel());
    }
    if (!selectedByCorner && isRowNegative) {
      this.selectedByColumnHeader.add(this.getLayerLevel());
    }

    if (!fragment) {
      this.setRangeEnd(coords);
    }
  }

  /**
   * Starts selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {boolean} [multipleSelection] If `true`, selection will be worked in 'multiple' mode. This option works
   *                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined
   *                                      the default trigger will be used (isPressedCtrlKey() helper).
   */
  setRangeStartOnly(coords, multipleSelection) {
    this.setRangeStart(coords, multipleSelection, true);
  }

  /**
   * Ends selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   */
  setRangeEnd(coords) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    this.runLocalHooks('beforeSetRangeEnd', coords);
    this.begin();

    const cellRange = this.selectedRange.current();

    if (this.settings.selectionMode !== 'single') {
      cellRange.setTo(new CellCoords(coords.row, coords.col));
    }

    // Set up current selection.
    this.highlight.getCell().clear();

    if (this.highlight.isEnabledFor(CELL_TYPE, cellRange.highlight)) {
      this.highlight.getCell()
        .add(this.selectedRange.current().highlight)
        .commit()
        .adjustCoordinates(cellRange);
    }

    const layerLevel = this.getLayerLevel();

    // If the next layer level is lower than previous then clear all area and header highlights. This is the
    // indication that the new selection is performing.
    if (layerLevel < this.highlight.layerLevel) {
      arrayEach(this.highlight.getAreas(), highlight => void highlight.clear());
      arrayEach(this.highlight.getHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getActiveHeaders(), highlight => void highlight.clear());
    }

    this.highlight.useLayerLevel(layerLevel);

    const areaHighlight = this.highlight.createOrGetArea();
    const headerHighlight = this.highlight.createOrGetHeader();
    const activeHeaderHighlight = this.highlight.createOrGetActiveHeader();

    areaHighlight.clear();
    headerHighlight.clear();
    activeHeaderHighlight.clear();

    if (this.highlight.isEnabledFor(AREA_TYPE, cellRange.highlight) && (this.isMultiple() || layerLevel >= 1)) {
      areaHighlight
        .add(cellRange.from)
        .add(cellRange.to)
        .commit();

      if (layerLevel === 1) {
        // For single cell selection in the same layer, we do not create area selection to prevent blue background.
        // When non-consecutive selection is performed we have to add that missing area selection to the previous layer
        // based on previous coordinates. It only occurs when the previous selection wasn't select multiple cells.
        const previousRange = this.selectedRange.previous();

        this.highlight
          .useLayerLevel(layerLevel - 1)
          .createOrGetArea()
          .add(previousRange.from)
          .commit()
          // Range may start with hidden indexes. Commit would not found start point (as we add just the `from` coords).
          .adjustCoordinates(previousRange);

        this.highlight.useLayerLevel(layerLevel);
      }
    }

    if (this.highlight.isEnabledFor(HEADER_TYPE, cellRange.highlight)) {
      // The header selection generally contains cell selection. In a case when all rows (or columns)
      // are hidden that visual coordinates are translated to renderable coordinates that do not exist.
      // Hence no header highlight is generated. In that case, to make a column (or a row) header
      // highlight, the row and column index has to point to the header (the negative value). See #7052.
      const areAnyRowsRendered = this.tableProps.countRowsTranslated() === 0;
      const areAnyColumnsRendered = this.tableProps.countColsTranslated() === 0;
      let headerCellRange = cellRange;

      if (areAnyRowsRendered || areAnyColumnsRendered) {
        headerCellRange = cellRange.clone();
      }

      if (areAnyRowsRendered) {
        headerCellRange.from.row = -1;
      }

      if (areAnyColumnsRendered) {
        headerCellRange.from.col = -1;
      }

      if (this.settings.selectionMode === 'single') {
        if (this.isSelectedByAnyHeader()) {
          headerCellRange.from.normalize();
        }

        headerHighlight.add(headerCellRange.from).commit();

      } else {
        headerHighlight
          .add(headerCellRange.from)
          .add(headerCellRange.to)
          .commit();
      }

      if (this.isEntireRowSelected()) {
        const isRowSelected = this.tableProps.countCols() === cellRange.getWidth();

        // Make sure that the whole row is selected (in case where selectionMode is set to 'single')
        if (isRowSelected) {
          activeHeaderHighlight
            .add(new CellCoords(cellRange.from.row, -1))
            .add(new CellCoords(cellRange.to.row, -1))
            .commit();
        }
      }

      if (this.isEntireColumnSelected()) {
        const isColumnSelected = this.tableProps.countRows() === cellRange.getHeight();

        // Make sure that the whole column is selected (in case where selectionMode is set to 'single')
        if (isColumnSelected) {
          activeHeaderHighlight
            .add(new CellCoords(-1, cellRange.from.col))
            .add(new CellCoords(-1, cellRange.to.col))
            .commit();
        }
      }
    }

    this.runLocalHooks('afterSetRangeEnd', coords);
  }

  /**
   * Returns information if we have a multiselection. This method check multiselection only on the latest layer of
   * the selection.
   *
   * @returns {boolean}
   */
  isMultiple() {
    const isMultipleListener = createObjectPropListener(!this.selectedRange.current().isSingle());

    this.runLocalHooks('afterIsMultipleSelection', isMultipleListener);

    return isMultipleListener.value;
  }

  /**
   * Selects cell relative to the current cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   * @param {boolean} force If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   */
  transformStart(rowDelta, colDelta, force) {
    this.setRangeStart(this.transformation.transformStart(rowDelta, colDelta, force));
  }

  /**
   * Sets selection end cell relative to the current selection end cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformEnd(rowDelta, colDelta) {
    this.setRangeEnd(this.transformation.transformEnd(rowDelta, colDelta));
  }

  /**
   * Returns currently used layer level.
   *
   * @returns {number} Returns layer level starting from 0. If no selection was added to the table -1 is returned.
   */
  getLayerLevel() {
    return this.selectedRange.size() - 1;
  }

  /**
   * Returns `true` if currently there is a selection on the screen, `false` otherwise.
   *
   * @returns {boolean}
   */
  isSelected() {
    return !this.selectedRange.isEmpty();
  }

  /**
   * Returns `true` if the selection was applied by clicking to the row header. If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks if any row header
   * was clicked on any selection layer level.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isSelectedByRowHeader(layerLevel = this.getLayerLevel()) {
    return !this.isSelectedByCorner(layerLevel) && this.isEntireRowSelected(layerLevel);
  }

  /**
   * Returns `true` if the selection consists of entire rows (including their headers). If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isEntireRowSelected(layerLevel = this.getLayerLevel()) {
    return layerLevel === -1 ? this.selectedByRowHeader.size > 0 : this.selectedByRowHeader.has(layerLevel);
  }

  /**
   * Returns `true` if the selection was applied by clicking to the column header. If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks if any column header
   * was clicked on any selection layer level.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isSelectedByColumnHeader(layerLevel = this.getLayerLevel()) {
    return !this.isSelectedByCorner() && this.isEntireColumnSelected(layerLevel);
  }

  /**
   * Returns `true` if the selection consists of entire columns (including their headers). If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isEntireColumnSelected(layerLevel = this.getLayerLevel()) {
    return layerLevel === -1 ? this.selectedByColumnHeader.size > 0 : this.selectedByColumnHeader.has(layerLevel);
  }

  /**
   * Returns `true` if the selection was applied by clicking on the row or column header on any layer level.
   *
   * @returns {boolean}
   */
  isSelectedByAnyHeader() {
    return this.isSelectedByRowHeader(-1) ||
      this.isSelectedByColumnHeader(-1) ||
      this.isSelectedByCorner();
  }

  /**
   * Returns `true` if the selection was applied by clicking on the left-top corner overlay.
   *
   * @returns {boolean}
   */
  isSelectedByCorner() {
    return this.selectedByCorner;
  }

  /**
   * Returns `true` if coords is within selection coords. This method iterates through all selection layers to check if
   * the coords object is within selection range.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @returns {boolean}
   */
  inInSelection(coords) {
    return this.selectedRange.includes(coords);
  }

  /**
   * Returns `true` if the cell corner should be visible.
   *
   * @private
   * @returns {boolean} `true` if the corner element has to be visible, `false` otherwise.
   */
  isCellCornerVisible() {
    return this.settings.fillHandle && !this.tableProps.isEditorOpened() && !this.isMultiple();
  }

  /**
   * Returns `true` if the area corner should be visible.
   *
   * @param {number} layerLevel The layer level.
   * @returns {boolean} `true` if the corner element has to be visible, `false` otherwise.
   */
  isAreaCornerVisible(layerLevel) {
    if (Number.isInteger(layerLevel) && layerLevel !== this.getLayerLevel()) {
      return false;
    }

    return this.settings.fillHandle && !this.tableProps.isEditorOpened() && this.isMultiple();
  }

  /**
   * Clear the selection by resetting the collected ranges and highlights.
   */
  clear() {
    // TODO: collections selectedByColumnHeader and selectedByRowHeader should be clear too.
    this.selectedRange.clear();
    this.highlight.clear();
  }

  /**
   * Deselects all selected cells.
   */
  deselect() {
    if (!this.isSelected()) {
      return;
    }

    this.inProgress = false;
    this.clear();
    this.runLocalHooks('afterDeselect');
  }

  /**
   * Select all cells.
   *
   * @param {boolean} [includeRowHeaders=false] `true` If the selection should include the row headers, `false`
   * otherwise.
   * @param {boolean} [includeColumnHeaders=false] `true` If the selection should include the column headers, `false`
   * otherwise.
   */
  selectAll(includeRowHeaders = false, includeColumnHeaders = false) {
    const nrOfRows = this.tableProps.countRows();
    const nrOfColumns = this.tableProps.countCols();

    // We can't select cells when there is no data.
    if (!includeRowHeaders && !includeColumnHeaders && (nrOfRows === 0 || nrOfColumns === 0)) {
      return;
    }

    const startCoords = new CellCoords(includeColumnHeaders ? -1 : 0, includeRowHeaders ? -1 : 0);

    this.clear();
    this.setRangeStartOnly(startCoords);
    this.selectedByRowHeader.add(this.getLayerLevel());
    this.selectedByColumnHeader.add(this.getLayerLevel());
    this.setRangeEnd(new CellCoords(nrOfRows - 1, nrOfColumns - 1));
    this.finish();
  }

  /**
   * Make multiple, non-contiguous selection specified by `row` and `column` values or a range of cells
   * finishing at `endRow`, `endColumn`. The method supports two input formats, first as an array of arrays such
   * as `[[rowStart, columnStart, rowEnd, columnEnd]]` and second format as an array of CellRange objects.
   * If the passed ranges have another format the exception will be thrown.
   *
   * @param {Array[]|CellRange[]} selectionRanges The coordinates which define what the cells should be selected.
   * @returns {boolean} Returns `true` if selection was successful, `false` otherwise.
   */
  selectCells(selectionRanges) {
    const selectionType = detectSelectionType(selectionRanges);

    if (selectionType === SELECTION_TYPE_EMPTY) {
      return false;

    } else if (selectionType === SELECTION_TYPE_UNRECOGNIZED) {
      throw new Error(toSingleLine`Unsupported format of the selection ranges was passed. To select cells pass\x20
        the coordinates as an array of arrays ([[rowStart, columnStart/columnPropStart, rowEnd,\x20
        columnEnd/columnPropEnd]]) or as an array of CellRange objects.`);
    }

    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
      propToCol: prop => this.tableProps.propToCol(prop),
      keepDirection: true,
    });
    const nrOfRows = this.tableProps.countRows();
    const nrOfColumns = this.tableProps.countCols();

    // Check if every layer of the coordinates are valid.
    const isValid = !selectionRanges.some((selection) => {
      const [rowStart, columnStart, rowEnd, columnEnd] = selectionSchemaNormalizer(selection);
      const _isValid = isValidCoord(rowStart, nrOfRows) &&
        isValidCoord(columnStart, nrOfColumns) &&
        isValidCoord(rowEnd, nrOfRows) &&
        isValidCoord(columnEnd, nrOfColumns);

      return !_isValid;
    });

    if (isValid) {
      this.clear();

      arrayEach(selectionRanges, (selection) => {
        const [rowStart, columnStart, rowEnd, columnEnd] = selectionSchemaNormalizer(selection);

        this.setRangeStartOnly(new CellCoords(rowStart, columnStart), false);
        this.setRangeEnd(new CellCoords(rowEnd, columnEnd));
        this.finish();
      });
    }

    return isValid;
  }

  /**
   * Select column specified by `startColumn` visual index or column property or a range of columns finishing at
   * `endColumn`.
   *
   * @param {number|string} startColumn Visual column index or column property from which the selection starts.
   * @param {number|string} [endColumn] Visual column index or column property from to the selection finishes.
   * @param {number} [headerLevel=-1] A row header index that triggers the column selection. The value can
   *                                  take -1 to -N, where -1 means the header closest to the cells.
   *
   * @returns {boolean} Returns `true` if selection was successful, `false` otherwise.
   */
  selectColumns(startColumn, endColumn = startColumn, headerLevel = -1) {
    const start = typeof startColumn === 'string' ? this.tableProps.propToCol(startColumn) : startColumn;
    const end = typeof endColumn === 'string' ? this.tableProps.propToCol(endColumn) : endColumn;

    const nrOfColumns = this.tableProps.countCols();
    const nrOfRows = this.tableProps.countRows();
    const isValid = isValidCoord(start, nrOfColumns) && isValidCoord(end, nrOfColumns);

    if (isValid) {
      this.setRangeStartOnly(new CellCoords(headerLevel, start));
      this.setRangeEnd(new CellCoords(nrOfRows - 1, end));
      this.finish();
    }

    return isValid;
  }

  /**
   * Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.
   *
   * @param {number} startRow Visual row index from which the selection starts.
   * @param {number} [endRow] Visual row index from to the selection finishes.
   * @param {number} [headerLevel=-1] A column header index that triggers the row selection.
   *                                  The value can take -1 to -N, where -1 means the header
   *                                  closest to the cells.
   * @returns {boolean} Returns `true` if selection was successful, `false` otherwise.
   */
  selectRows(startRow, endRow = startRow, headerLevel = -1) {
    const nrOfRows = this.tableProps.countRows();
    const nrOfColumns = this.tableProps.countCols();
    const isValid = isValidCoord(startRow, nrOfRows) && isValidCoord(endRow, nrOfRows);

    if (isValid) {
      this.setRangeStartOnly(new CellCoords(startRow, headerLevel));
      this.setRangeEnd(new CellCoords(endRow, nrOfColumns - 1));
      this.finish();
    }

    return isValid;
  }

  /**
   * Rewrite the rendered state of the selection as visual selection may have a new representation in the DOM.
   */
  refresh() {
    const customSelections = this.highlight.getCustomSelections();

    customSelections.forEach((customSelection) => {
      customSelection.commit();
    });

    if (!this.isSelected()) {
      return;
    }

    const cellHighlight = this.highlight.getCell();
    const currentLayer = this.getLayerLevel();

    cellHighlight.commit().adjustCoordinates(this.selectedRange.current());

    // Rewriting rendered ranges going through all layers.
    for (let layerLevel = 0; layerLevel < this.selectedRange.size(); layerLevel += 1) {
      this.highlight.useLayerLevel(layerLevel);

      const areaHighlight = this.highlight.createOrGetArea();
      const headerHighlight = this.highlight.createOrGetHeader();
      const activeHeaderHighlight = this.highlight.createOrGetActiveHeader();

      areaHighlight.commit();
      headerHighlight.commit();
      activeHeaderHighlight.commit();
    }

    // Reverting starting layer for the Highlight.
    this.highlight.useLayerLevel(currentLayer);
  }
}

mixin(Selection, localHooks);

export default Selection;
