import Highlight, {
  AREA_TYPE,
  HEADER_TYPE,
  FOCUS_TYPE,
} from './highlight/highlight';
import SelectionRange from './range';
import { createObjectPropListener, mixin } from './../helpers/object';
import { isUndefined } from './../helpers/mixed';
import { clamp } from './../helpers/number';
import { arrayEach } from './../helpers/array';
import localHooks from './../mixins/localHooks';
import Transformation from './transformation';
import {
  detectSelectionType,
  normalizeSelectionFactory,
  SELECTION_TYPE_EMPTY,
  SELECTION_TYPE_UNRECOGNIZED,
} from './utils';
import { toSingleLine } from './../helpers/templateLiteralTag';
import { A11Y_SELECTED } from '../helpers/a11y';

/**
 * @class Selection
 * @util
 */
class Selection {
  /**
   * Handsontable settings instance.
   *
   * @type {GridSettings}
   */
  settings;
  /**
   * An additional object with dynamically defined properties which describes table state.
   *
   * @type {object}
   */
  tableProps;
  /**
   * The flag which determines if the selection is in progress.
   *
   * @type {boolean}
   */
  inProgress = false;
  /**
   * Selection data layer (handle visual coordinates).
   *
   * @type {SelectionRange}
   */
  selectedRange = new SelectionRange((highlight, from, to) => {
    return this.tableProps.createCellRange(highlight, from, to);
  });
  /**
   * Visualization layer.
   *
   * @type {Highlight}
   */
  highlight;
  /**
   * The module for modifying coordinates.
   *
   * @type {Transformation}
   */
  transformation;
  /**
   * The collection of the selection layer levels where the whole row was selected using the row header or
   * the corner header.
   *
   * @type {Set<number>}
   */
  selectedByRowHeader = new Set();
  /**
   * The collection of the selection layer levels where the whole column was selected using the column header or
   * the corner header.
   *
   * @type {Set<number>}
   */
  selectedByColumnHeader = new Set();
  /**
   * When sets disable highlighting the headers even when the logical coordinates points on them.
   *
   * @type {boolean}
   */
  #disableHeadersHighlight = false;

  constructor(settings, tableProps) {
    this.settings = settings;
    this.tableProps = tableProps;
    this.highlight = new Highlight({
      headerClassName: settings.currentHeaderClassName,
      activeHeaderClassName: settings.activeHeaderClassName,
      rowClassName: settings.currentRowClassName,
      columnClassName: settings.currentColClassName,
      cellAttributes: [A11Y_SELECTED()],
      rowIndexMapper: this.tableProps.rowIndexMapper,
      columnIndexMapper: this.tableProps.columnIndexMapper,
      disabledCellSelection: (row, column) => this.tableProps.isDisabledCellSelection(row, column),
      cellCornerVisible: (...args) => this.isCellCornerVisible(...args),
      areaCornerVisible: (...args) => this.isAreaCornerVisible(...args),
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
      createCellCoords: (row, column) => this.tableProps.createCellCoords(row, column),
      createCellRange: (highlight, from, to) => this.tableProps.createCellRange(highlight, from, to),
    });
    this.transformation = new Transformation(this.selectedRange, {
      rowIndexMapper: this.tableProps.rowIndexMapper,
      columnIndexMapper: this.tableProps.columnIndexMapper,
      countRenderableRows: () => this.tableProps.countRenderableRows(),
      countRenderableColumns: () => this.tableProps.countRenderableColumns(),
      countRowHeaders: () => this.tableProps.countRowHeaders(),
      countColHeaders: () => this.tableProps.countColHeaders(),
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
      createCellCoords: (row, column) => this.tableProps.createCellCoords(row, column),
      navigableHeaders: () => settings.navigableHeaders,
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
    this.transformation.addLocalHook('beforeRowWrap',
      (...args) => this.runLocalHooks('beforeRowWrap', ...args));
    this.transformation.addLocalHook('beforeColumnWrap',
      (...args) => this.runLocalHooks('beforeColumnWrap', ...args));
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
   * Indicate that selection process began. It sets internally `.inProgress` property to `true`.
   */
  begin() {
    this.inProgress = true;
  }

  /**
   * Indicate that selection process finished. It sets internally `.inProgress` property to `false`.
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
   *                                      the default trigger will be used.
   * @param {boolean} [fragment=false] If `true`, the selection will be treated as a partial selection where the
   *                                   `setRangeEnd` method won't be called on every `setRangeStart` call.
   * @param {CellCoords} [highlightCoords] If set, allows changing the coordinates of the highlight/focus cell.
   */
  setRangeStart(coords, multipleSelection, fragment = false, highlightCoords = coords) {
    const isMultipleMode = this.settings.selectionMode === 'multiple';
    const isMultipleSelection = isUndefined(multipleSelection) ?
      this.tableProps.getShortcutManager().isCtrlPressed() : multipleSelection;
    // We are creating copy. We would like to modify just the start of the selection by below hook. Then original coords
    // should be handled by next methods.
    const coordsClone = coords.clone();

    this.runLocalHooks(`beforeSetRangeStart${fragment ? 'Only' : ''}`, coordsClone);

    if (!isMultipleMode || (isMultipleMode && !isMultipleSelection && isUndefined(multipleSelection))) {
      this.selectedRange.clear();
    }

    this.selectedRange
      .add(coordsClone)
      .current()
      .setHighlight(highlightCoords.clone());

    if (this.getLayerLevel() === 0) {
      this.selectedByRowHeader.clear();
      this.selectedByColumnHeader.clear();
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
   *                                      the default trigger will be used.
   * @param {CellCoords} [highlightCoords] If set, allows changing the coordinates of the highlight/focus cell.
   */
  setRangeStartOnly(coords, multipleSelection, highlightCoords = coords) {
    this.setRangeStart(coords, multipleSelection, true, highlightCoords);
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

    const coordsClone = coords.clone();
    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();
    const isSingle = this.selectedRange.current().clone().setTo(coords).isSingleHeader();

    // Ignore processing the end range when the header selection starts overlapping the corner and
    // the selection is not a single header highlight.
    if ((countRows > 0 || countCols > 0) &&
       (countRows === 0 && coordsClone.col < 0 && !isSingle ||
        countCols === 0 && coordsClone.row < 0 && !isSingle)) {
      return;
    }

    this.runLocalHooks('beforeSetRangeEnd', coordsClone);
    this.begin();

    const cellRange = this.selectedRange.current();

    if (!this.settings.navigableHeaders) {
      cellRange.highlight.normalize();
    }

    if (this.settings.selectionMode === 'single') {
      cellRange.setFrom(cellRange.highlight);
      cellRange.setTo(cellRange.highlight);
    } else {
      cellRange.setTo(coordsClone);
    }

    // Prevent creating "area" selection that overlaps headers.
    if (countRows > 0 && countCols > 0) {
      if (!this.settings.navigableHeaders || (this.settings.navigableHeaders && !cellRange.isSingleHeader())) {
        cellRange.to.normalize();
      }
    }

    this.runLocalHooks('beforeHighlightSet');

    const focusHighlight = this.highlight.getFocus();

    focusHighlight.clear();

    if (this.highlight.isEnabledFor(FOCUS_TYPE, cellRange.highlight)) {
      focusHighlight
        .add(this.selectedRange.current().highlight)
        .commit()
        .syncWith(cellRange);
    }

    const layerLevel = this.getLayerLevel();

    // If the next layer level is lower than previous then clear all area and header highlights. This is the
    // indication that the new selection is performing.
    if (layerLevel < this.highlight.layerLevel) {
      arrayEach(this.highlight.getAreas(), highlight => void highlight.clear());
      arrayEach(this.highlight.getLayeredAreas(), highlight => void highlight.clear());
      arrayEach(this.highlight.getRowHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getColumnHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getActiveRowHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getActiveColumnHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getActiveCornerHeaders(), highlight => void highlight.clear());
      arrayEach(this.highlight.getRowHighlights(), highlight => void highlight.clear());
      arrayEach(this.highlight.getColumnHighlights(), highlight => void highlight.clear());
    }

    this.highlight.useLayerLevel(layerLevel);

    const areaHighlight = this.highlight.createArea();
    const layeredAreaHighlight = this.highlight.createLayeredArea();
    const rowHeaderHighlight = this.highlight.createRowHeader();
    const columnHeaderHighlight = this.highlight.createColumnHeader();
    const activeRowHeaderHighlight = this.highlight.createActiveRowHeader();
    const activeColumnHeaderHighlight = this.highlight.createActiveColumnHeader();
    const activeCornerHeaderHighlight = this.highlight.createActiveCornerHeader();
    const rowHighlight = this.highlight.createRowHighlight();
    const columnHighlight = this.highlight.createColumnHighlight();

    areaHighlight.clear();
    layeredAreaHighlight.clear();
    rowHeaderHighlight.clear();
    columnHeaderHighlight.clear();
    activeRowHeaderHighlight.clear();
    activeColumnHeaderHighlight.clear();
    activeCornerHeaderHighlight.clear();
    rowHighlight.clear();
    columnHighlight.clear();

    if (this.highlight.isEnabledFor(AREA_TYPE, cellRange.highlight) && (this.isMultiple() || layerLevel >= 1)) {
      areaHighlight
        .add(cellRange.from)
        .add(cellRange.to)
        .commit();
      layeredAreaHighlight
        .add(cellRange.from)
        .add(cellRange.to)
        .commit();

      if (layerLevel === 1) {
        // For single cell selection in the same layer, we do not create area selection to prevent blue background.
        // When non-consecutive selection is performed we have to add that missing area selection to the previous layer
        // based on previous coordinates. It only occurs when the previous selection wasn't select multiple cells.
        const previousRange = this.selectedRange.previous();

        this.highlight.useLayerLevel(layerLevel - 1);
        this.highlight
          .createArea()
          .add(previousRange.from)
          .commit()
          // Range may start with hidden indexes. Commit would not found start point (as we add just the `from` coords).
          .syncWith(previousRange);
        this.highlight
          .createLayeredArea()
          .add(previousRange.from)
          .commit()
          // Range may start with hidden indexes. Commit would not found start point (as we add just the `from` coords).
          .syncWith(previousRange);

        this.highlight.useLayerLevel(layerLevel);
      }
    }

    if (this.highlight.isEnabledFor(HEADER_TYPE, cellRange.highlight)) {
      if (!cellRange.isSingleHeader()) {
        const rowCoordsFrom = this.tableProps.createCellCoords(Math.max(cellRange.from.row, 0), -1);
        const rowCoordsTo = this.tableProps.createCellCoords(cellRange.to.row, -1);
        const columnCoordsFrom = this.tableProps.createCellCoords(-1, Math.max(cellRange.from.col, 0));
        const columnCoordsTo = this.tableProps.createCellCoords(-1, cellRange.to.col);

        if (this.settings.selectionMode === 'single') {
          rowHeaderHighlight.add(rowCoordsFrom).commit();
          columnHeaderHighlight.add(columnCoordsFrom).commit();
          rowHighlight.add(rowCoordsFrom).commit();
          columnHighlight.add(columnCoordsFrom).commit();

        } else {
          rowHeaderHighlight
            .add(rowCoordsFrom)
            .add(rowCoordsTo)
            .commit();
          columnHeaderHighlight
            .add(columnCoordsFrom)
            .add(columnCoordsTo)
            .commit();
          rowHighlight
            .add(rowCoordsFrom)
            .add(rowCoordsTo)
            .commit();
          columnHighlight
            .add(columnCoordsFrom)
            .add(columnCoordsTo)
            .commit();
        }
      }

      const highlightRowHeaders = !this.#disableHeadersHighlight && (this.isEntireRowSelected() &&
        (countCols > 0 && countCols === cellRange.getWidth() ||
        countCols === 0 && this.isSelectedByRowHeader()));
      const highlightColumnHeaders = !this.#disableHeadersHighlight && (this.isEntireColumnSelected() &&
        (countRows > 0 && countRows === cellRange.getHeight() ||
        countRows === 0 && this.isSelectedByColumnHeader()));

      if (highlightRowHeaders) {
        activeRowHeaderHighlight
          .add(this.tableProps
            .createCellCoords(Math.max(cellRange.from.row, 0), Math.min(-this.tableProps.countRowHeaders(), -1)))
          .add(this.tableProps
            .createCellCoords(Math.max(cellRange.to.row, 0), -1))
          .commit();
      }

      if (highlightColumnHeaders) {
        activeColumnHeaderHighlight
          .add(this.tableProps
            .createCellCoords(Math.min(-this.tableProps.countColHeaders(), -1), Math.max(cellRange.from.col, 0)))
          .add(this.tableProps
            .createCellCoords(-1, Math.max(cellRange.to.col, 0)))
          .commit();
      }

      if (highlightRowHeaders && highlightColumnHeaders) {
        activeCornerHeaderHighlight
          .add(this.tableProps
            .createCellCoords(-this.tableProps.countColHeaders(), -this.tableProps.countRowHeaders()))
          .add(this.tableProps
            .createCellCoords(-1, -1))
          .commit();
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
   * @param {boolean} [createMissingRecords=false] If `true` the new rows/columns will be created if necessary.
   * Otherwise, row/column will be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   */
  transformStart(rowDelta, colDelta, createMissingRecords = false) {
    this.setRangeStart(this.transformation.transformStart(rowDelta, colDelta, createMissingRecords));
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
    return !this.isSelectedByCorner(layerLevel) && (layerLevel === -1 ?
      this.selectedByRowHeader.size > 0 : this.selectedByRowHeader.has(layerLevel));
  }

  /**
   * Returns `true` if the selection consists of entire rows (including their headers). If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isEntireRowSelected(layerLevel = this.getLayerLevel()) {
    const tester = (range) => {
      const { col } = range.getOuterTopStartCorner();
      const rowHeaders = this.tableProps.countRowHeaders();
      const countCols = this.tableProps.countCols();

      return (rowHeaders > 0 && col < 0 || rowHeaders === 0) && range.getWidth() === countCols;
    };

    if (layerLevel === -1) {
      return Array.from(this.selectedRange).some(range => tester(range));
    }

    const range = this.selectedRange.peekByIndex(layerLevel);

    return range ? tester(range) : false;
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
    return !this.isSelectedByCorner() && (layerLevel === -1 ?
      this.selectedByColumnHeader.size > 0 : this.selectedByColumnHeader.has(layerLevel));
  }

  /**
   * Returns `true` if the selection consists of entire columns (including their headers). If the `layerLevel`
   * argument is passed then only that layer will be checked. Otherwise, it checks the selection for all layers.
   *
   * @param {number} [layerLevel=this.getLayerLevel()] Selection layer level to check.
   * @returns {boolean}
   */
  isEntireColumnSelected(layerLevel = this.getLayerLevel()) {
    const tester = (range) => {
      const { row } = range.getOuterTopStartCorner();
      const colHeaders = this.tableProps.countColHeaders();
      const countRows = this.tableProps.countRows();

      return (colHeaders > 0 && row < 0 || colHeaders === 0) && range.getHeight() === countRows;
    };

    if (layerLevel === -1) {
      return Array.from(this.selectedRange).some(range => tester(range));
    }

    const range = this.selectedRange.peekByIndex(layerLevel);

    return range ? tester(range) : false;
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
    return this.selectedByColumnHeader.has(this.getLayerLevel()) &&
      this.selectedByRowHeader.has(this.getLayerLevel());
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
   * Returns `true` if the cell coordinates are visible (renderable).
   *
   * @private
   * @param {CellCoords} coords The cell coordinates to check.
   * @returns {boolean}
   */
  isCellVisible(coords) {
    const renderableCoords = this.tableProps.visualToRenderableCoords(coords);

    return renderableCoords.row !== null && renderableCoords.col !== null;
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
   * Selects all cells and headers.
   *
   * @param {boolean} [includeRowHeaders=false] `true` If the selection should include the row headers,
   * `false` otherwise.
   * @param {boolean} [includeColumnHeaders=false] `true` If the selection should include the column
   * headers, `false` otherwise.
   * @param {object} [options] Additional object with options.
   * @param {{row: number, col: number} | boolean} [options.focusPosition] The argument allows changing the cell/header
   * focus position. The value takes an object with a `row` and `col` properties from -N to N, where
   * negative values point to the headers and positive values point to the cell range. If `false`, the focus
   * position won't be changed.
   * @param {boolean} [options.disableHeadersHighlight] If `true`, disables highlighting the headers even when
   * the logical coordinates points on them.
   */
  selectAll(includeRowHeaders = false, includeColumnHeaders = false, options = {
    focusPosition: false,
    disableHeadersHighlight: false,
  }) {
    const nrOfRows = this.tableProps.countRows();
    const nrOfColumns = this.tableProps.countCols();
    const countRowHeaders = this.tableProps.countRowHeaders();
    const countColHeaders = this.tableProps.countColHeaders();

    const rowFrom = includeColumnHeaders ? -countColHeaders : 0;
    const columnFrom = includeRowHeaders ? -countRowHeaders : 0;

    // We can't select cells when there is no data.
    if (rowFrom === 0 && columnFrom === 0 && (nrOfRows === 0 || nrOfColumns === 0)) {
      return;
    }

    let highlight = this.getSelectedRange().current()?.highlight;
    const {
      focusPosition,
      disableHeadersHighlight
    } = options;

    this.#disableHeadersHighlight = disableHeadersHighlight;

    if (focusPosition && Number.isInteger(focusPosition?.row) && Number.isInteger(focusPosition?.col)) {
      highlight = this.tableProps
        .createCellCoords(
          clamp(focusPosition.row, rowFrom, nrOfRows - 1),
          clamp(focusPosition.col, columnFrom, nrOfColumns - 1)
        );
    }

    const startCoords = this.tableProps.createCellCoords(rowFrom, columnFrom);
    const endCoords = this.tableProps.createCellCoords(nrOfRows - 1, nrOfColumns - 1);

    this.clear();
    this.setRangeStartOnly(startCoords, undefined, highlight);

    if (columnFrom < 0) {
      this.selectedByRowHeader.add(this.getLayerLevel());
    }
    if (rowFrom < 0) {
      this.selectedByColumnHeader.add(this.getLayerLevel());
    }

    this.setRangeEnd(endCoords);
    this.finish();

    this.#disableHeadersHighlight = false;
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
      createCellCoords: (...args) => this.tableProps.createCellCoords(...args),
      createCellRange: (...args) => this.tableProps.createCellRange(...args),
      propToCol: prop => this.tableProps.propToCol(prop),
      keepDirection: true,
    });
    const navigableHeaders = this.settings.navigableHeaders;
    const tableParams = {
      countRows: this.tableProps.countRows(),
      countCols: this.tableProps.countCols(),
      countRowHeaders: navigableHeaders ? this.tableProps.countRowHeaders() : 0,
      countColHeaders: navigableHeaders ? this.tableProps.countColHeaders() : 0,
    };

    // Check if every layer of the coordinates are valid.
    const isValid = !selectionRanges.some((selection) => {
      const cellRange = selectionSchemaNormalizer(selection);
      const rangeValidity = cellRange.isValid(tableParams);

      return !(rangeValidity && !cellRange.containsHeaders() ||
               rangeValidity && cellRange.containsHeaders() && cellRange.isSingleHeader());
    });

    if (isValid) {
      this.clear();

      arrayEach(selectionRanges, (selection) => {
        const { from, to } = selectionSchemaNormalizer(selection);

        this.setRangeStartOnly(from.clone(), false);
        this.setRangeEnd(to.clone());
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
   * @param {number} [focusPosition=0] The argument allows changing the cell/header focus position.
   *                                   The value can take visual row index from -N to N, where negative values
   *                                   point to the headers and positive values point to the cell range.
   * @returns {boolean} Returns `true` if selection was successful, `false` otherwise.
   */
  selectColumns(startColumn, endColumn = startColumn, focusPosition = 0) {
    const start = typeof startColumn === 'string' ? this.tableProps.propToCol(startColumn) : startColumn;
    const end = typeof endColumn === 'string' ? this.tableProps.propToCol(endColumn) : endColumn;
    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();
    const countColHeaders = this.tableProps.countColHeaders();
    const columnHeaderLastIndex = countColHeaders === 0 ? 0 : -countColHeaders;

    const fromCoords = this.tableProps.createCellCoords(columnHeaderLastIndex, start);
    const toCoords = this.tableProps.createCellCoords(countRows - 1, end);
    const isValid = this.tableProps.createCellRange(fromCoords, fromCoords, toCoords)
      .isValid({
        countRows,
        countCols,
        countRowHeaders: 0,
        countColHeaders,
      });

    if (isValid) {
      const fromRow = countColHeaders === 0 ? 0 : clamp(focusPosition, columnHeaderLastIndex, -1);
      const toRow = countRows - 1;
      const from = this.tableProps.createCellCoords(fromRow, start);
      const to = this.tableProps.createCellCoords(toRow, end);
      const highlight = this.tableProps
        .createCellCoords(clamp(focusPosition, columnHeaderLastIndex, countRows - 1), start);

      this.runLocalHooks('beforeSelectColumns', from, to, highlight);

      // disallow modifying row axis for that hooks
      from.row = fromRow;
      to.row = toRow;

      this.setRangeStartOnly(from, undefined, highlight);
      this.selectedByColumnHeader.add(this.getLayerLevel());
      this.setRangeEnd(to);
      this.runLocalHooks('afterSelectColumns', from, to, highlight);
      this.finish();
    }

    return isValid;
  }

  /**
   * Select row specified by `startRow` visual index or a range of rows finishing at `endRow`.
   *
   * @param {number} startRow Visual row index from which the selection starts.
   * @param {number} [endRow] Visual row index from to the selection finishes.
   * @param {number} [focusPosition=0] The argument allows changing the cell/header focus position.
   *                                   The value can take visual column index from -N to N, where negative values
   *                                   point to the headers and positive values point to the cell range.
   * @returns {boolean} Returns `true` if selection was successful, `false` otherwise.
   */
  selectRows(startRow, endRow = startRow, focusPosition = 0) {
    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();
    const countRowHeaders = this.tableProps.countRowHeaders();
    const rowHeaderLastIndex = countRowHeaders === 0 ? 0 : -countRowHeaders;

    const fromCoords = this.tableProps.createCellCoords(startRow, rowHeaderLastIndex);
    const toCoords = this.tableProps.createCellCoords(endRow, countCols - 1);
    const isValid = this.tableProps.createCellRange(fromCoords, fromCoords, toCoords)
      .isValid({
        countRows,
        countCols,
        countRowHeaders,
        countColHeaders: 0,
      });

    if (isValid) {
      const fromColumn = countRowHeaders === 0 ? 0 : clamp(focusPosition, rowHeaderLastIndex, -1);
      const toColumn = countCols - 1;
      const from = this.tableProps.createCellCoords(startRow, fromColumn);
      const to = this.tableProps.createCellCoords(endRow, toColumn);
      const highlight = this.tableProps
        .createCellCoords(startRow, clamp(focusPosition, rowHeaderLastIndex, countCols - 1));

      this.runLocalHooks('beforeSelectRows', from, to, highlight);

      // disallow modifying column axis for that hooks
      from.col = fromColumn;
      to.col = toColumn;

      this.setRangeStartOnly(from, undefined, highlight);
      this.selectedByRowHeader.add(this.getLayerLevel());
      this.setRangeEnd(to);
      this.runLocalHooks('afterSelectRows', from, to, highlight);
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

    const focusHighlight = this.highlight.getFocus();
    const currentLayer = this.getLayerLevel();

    focusHighlight.commit().syncWith(this.selectedRange.current());

    // Rewriting rendered ranges going through all layers.
    for (let layerLevel = 0; layerLevel < this.selectedRange.size(); layerLevel += 1) {
      this.highlight.useLayerLevel(layerLevel);

      const areaHighlight = this.highlight.createArea();
      const areaLayeredHighlight = this.highlight.createLayeredArea();
      const rowHeaderHighlight = this.highlight.createRowHeader();
      const columnHeaderHighlight = this.highlight.createColumnHeader();
      const activeRowHeaderHighlight = this.highlight.createActiveRowHeader();
      const activeColumnHeaderHighlight = this.highlight.createActiveColumnHeader();
      const activeCornerHeaderHighlight = this.highlight.createActiveCornerHeader();
      const rowHighlight = this.highlight.createRowHighlight();
      const columnHighlight = this.highlight.createColumnHighlight();

      areaHighlight.commit();
      areaLayeredHighlight.commit();
      rowHeaderHighlight.commit();
      columnHeaderHighlight.commit();
      activeRowHeaderHighlight.commit();
      activeColumnHeaderHighlight.commit();
      activeCornerHeaderHighlight.commit();
      rowHighlight.commit();
      columnHighlight.commit();
    }

    // Reverting starting layer for the Highlight.
    this.highlight.useLayerLevel(currentLayer);
  }
}

mixin(Selection, localHooks);

export default Selection;
