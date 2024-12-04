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
   * The module for modifying coordinates of the start and end selection.
   *
   * @type {Transformation}
   */
  #transformation;
  /**
   * The module for modifying coordinates of the focus selection.
   *
   * @type {Transformation}
   */
  #focusTransformation;
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
   * The flag which determines if the focus selection was changed.
   *
   * @type {boolean}
   */
  #isFocusSelectionChanged = false;
  /**
   * When sets disable highlighting the headers even when the logical coordinates points on them.
   *
   * @type {boolean}
   */
  #disableHeadersHighlight = false;
  /**
   * The source of the selection. It can be one of the following values: `mouse`, `unknown` or any other string.
   *
   * @type {'mouse' | 'unknown' | string}
   */
  #selectionSource = 'unknown';
  /**
   * The number of expected layers. It is used mostly to track when the last selection layer of non-contiguous
   * selection is applied, thus the viewport scroll is triggered.
   *
   * @param {number}
   */
  #expectedLayersCount = -1;

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
    this.#transformation = new Transformation(this.selectedRange, {
      rowIndexMapper: this.tableProps.rowIndexMapper,
      columnIndexMapper: this.tableProps.columnIndexMapper,
      countRenderableRows: () => this.tableProps.countRenderableRows(),
      countRenderableColumns: () => this.tableProps.countRenderableColumns(),
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
      findFirstNonHiddenRenderableRow: (...args) => this.tableProps.findFirstNonHiddenRenderableRow(...args),
      findFirstNonHiddenRenderableColumn: (...args) => this.tableProps.findFirstNonHiddenRenderableColumn(...args),
      createCellCoords: (row, column) => this.tableProps.createCellCoords(row, column),
      fixedRowsBottom: () => settings.fixedRowsBottom,
      minSpareRows: () => settings.minSpareRows,
      minSpareCols: () => settings.minSpareCols,
      autoWrapRow: () => settings.autoWrapRow,
      autoWrapCol: () => settings.autoWrapCol,
    });
    this.#focusTransformation = new Transformation(this.selectedRange, {
      rowIndexMapper: this.tableProps.rowIndexMapper,
      columnIndexMapper: this.tableProps.columnIndexMapper,
      countRenderableRows: () => {
        const range = this.selectedRange.current();

        return this.tableProps.countRenderableRowsInRange(0, range.getOuterBottomEndCorner().row);
      },
      countRenderableColumns: () => {
        const range = this.selectedRange.current();

        return this.tableProps.countRenderableColumnsInRange(0, range.getOuterBottomEndCorner().col);
      },
      visualToRenderableCoords: coords => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: coords => this.tableProps.renderableToVisualCoords(coords),
      findFirstNonHiddenRenderableRow: (...args) => this.tableProps.findFirstNonHiddenRenderableRow(...args),
      findFirstNonHiddenRenderableColumn: (...args) => this.tableProps.findFirstNonHiddenRenderableColumn(...args),
      createCellCoords: (row, column) => this.tableProps.createCellCoords(row, column),
      fixedRowsBottom: () => 0,
      minSpareRows: () => 0,
      minSpareCols: () => 0,
      autoWrapRow: () => true,
      autoWrapCol: () => true,
    });

    this.#transformation.addLocalHook('beforeTransformStart',
      (...args) => this.runLocalHooks('beforeModifyTransformStart', ...args));
    this.#transformation.addLocalHook('afterTransformStart',
      (...args) => this.runLocalHooks('afterModifyTransformStart', ...args));
    this.#transformation.addLocalHook('beforeTransformEnd',
      (...args) => this.runLocalHooks('beforeModifyTransformEnd', ...args));
    this.#transformation.addLocalHook('afterTransformEnd',
      (...args) => this.runLocalHooks('afterModifyTransformEnd', ...args));
    this.#transformation.addLocalHook('insertRowRequire',
      (...args) => this.runLocalHooks('insertRowRequire', ...args));
    this.#transformation.addLocalHook('insertColRequire',
      (...args) => this.runLocalHooks('insertColRequire', ...args));
    this.#transformation.addLocalHook('beforeRowWrap',
      (...args) => this.runLocalHooks('beforeRowWrap', ...args));
    this.#transformation.addLocalHook('beforeColumnWrap',
      (...args) => this.runLocalHooks('beforeColumnWrap', ...args));

    this.#focusTransformation.addLocalHook('beforeTransformStart',
      (...args) => this.runLocalHooks('beforeModifyTransformFocus', ...args));
    this.#focusTransformation.addLocalHook('afterTransformStart',
      (...args) => this.runLocalHooks('afterModifyTransformFocus', ...args));
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
   * Marks the source of the selection. It can be one of the following values: `mouse`, or any other string.
   *
   * @param {'mouse' | 'unknown' | string} sourceName The source name.
   */
  markSource(sourceName) {
    this.#selectionSource = sourceName;
  }

  /**
   * Marks end of the selection source. It restores the selection source to default value which is 'unknown'.
   */
  markEndSource() {
    this.#selectionSource = 'unknown';
  }

  /**
   * Returns the source of the selection.
   *
   * @returns {'mouse' | 'unknown' | string}
   */
  getSelectionSource() {
    return this.#selectionSource;
  }

  /**
   * Set the number of expected layers. The method is not obligatory to call. It is used mostly internally
   * to determine when the last selection layer of non-contiguous is applied, thus the viewport scroll is triggered.
   *
   * @param {number} layersCount The number of expected layers.
   */
  setExpectedLayers(layersCount) {
    this.#expectedLayersCount = layersCount;
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
    this.#expectedLayersCount = -1;
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

    this.#isFocusSelectionChanged = false;
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
      const horizontalDir = cellRange.getHorizontalDirection();
      const verticalDir = cellRange.getVerticalDirection();
      const isMultiple = this.isMultiple();

      cellRange.setTo(coordsClone);

      if (
        isMultiple &&
        (horizontalDir !== cellRange.getHorizontalDirection() ||
        cellRange.getWidth() === 1 && !cellRange.includes(cellRange.highlight))
      ) {
        cellRange.from.assign({
          col: cellRange.highlight.col
        });
      }
      if (
        isMultiple &&
        (verticalDir !== cellRange.getVerticalDirection() ||
        cellRange.getHeight() === 1 && !cellRange.includes(cellRange.highlight))
      ) {
        cellRange.from.assign({
          row: cellRange.highlight.row
        });
      }
    }

    // Prevent creating "area" selection that overlaps headers.
    if (countRows > 0 && countCols > 0) {
      if (!this.settings.navigableHeaders || (this.settings.navigableHeaders && !cellRange.isSingleHeader())) {
        cellRange.to.normalize();
      }
    }

    this.runLocalHooks('beforeHighlightSet');
    this.setRangeFocus(this.selectedRange.current().highlight);
    this.applyAndCommit();

    const isLastLayer = this.#expectedLayersCount === -1 || this.selectedRange.size() === this.#expectedLayersCount;

    this.runLocalHooks('afterSetRangeEnd', coords, isLastLayer);
  }

  /**
   * Applies and commits the selection to all layers (using the Walkontable Selection API) based on the selection (CellRanges)
   * collected in the `selectedRange` module.
   *
   * @param {CellRange} [cellRange] The cell range to apply. If not provided, the current selection is used.
   * @param {number} [layerLevel] The layer level to apply. If not provided, the current layer level is used.
   */
  applyAndCommit(cellRange = this.selectedRange.current(), layerLevel = this.getLayerLevel()) {
    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();

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
  }

  /**
   * Sets the selection focus position at the specified coordinates.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   */
  setRangeFocus(coords) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    const cellRange = this.selectedRange.current();

    if (!this.inProgress) {
      this.runLocalHooks('beforeSetFocus', coords);
    }

    const focusHighlight = this.highlight.getFocus();

    focusHighlight.clear();
    cellRange.setHighlight(coords);

    if (!this.inProgress) {
      this.runLocalHooks('beforeHighlightSet');
    }

    if (this.highlight.isEnabledFor(FOCUS_TYPE, cellRange.highlight)) {
      focusHighlight
        .add(cellRange.highlight)
        .commit()
        .syncWith(cellRange);
    }

    if (!this.inProgress) {
      this.#isFocusSelectionChanged = true;
      this.runLocalHooks('afterSetFocus', cellRange.highlight);
    }
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
    if (this.settings.navigableHeaders) {
      this.#transformation.setOffsetSize({
        x: this.tableProps.countRowHeaders(),
        y: this.tableProps.countColHeaders(),
      });

    } else {
      this.#transformation.resetOffsetSize();
    }

    this.setRangeStart(this.#transformation.transformStart(rowDelta, colDelta, createMissingRecords));
  }

  /**
   * Sets selection end cell relative to the current selection end cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformEnd(rowDelta, colDelta) {
    if (this.settings.navigableHeaders) {
      this.#transformation.setOffsetSize({
        x: this.tableProps.countRowHeaders(),
        y: this.tableProps.countColHeaders(),
      });

    } else {
      this.#transformation.resetOffsetSize();
    }

    this.setRangeEnd(this.#transformation.transformEnd(rowDelta, colDelta));
  }

  /**
   * Transforms the focus cell selection relative to the current focus position.
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformFocus(rowDelta, colDelta) {
    const range = this.selectedRange.current();
    const { row, col } = range.getOuterTopStartCorner();
    const columnsInRange = this.tableProps.countRenderableColumnsInRange(0, col - 1);
    const rowsInRange = this.tableProps.countRenderableRowsInRange(0, row - 1);

    if (range.highlight.isHeader()) {
      // for header focus selection calculate the new coords based on the selection including headers
      this.#focusTransformation.setOffsetSize({
        x: col < 0 ? Math.abs(col) : -columnsInRange,
        y: row < 0 ? Math.abs(row) : -rowsInRange,
      });
    } else {
      // for focus selection in cells calculate the new coords only based on the selected cells
      this.#focusTransformation.setOffsetSize({
        x: col < 0 ? 0 : -columnsInRange,
        y: row < 0 ? 0 : -rowsInRange,
      });
    }

    const focusCoords = this.#focusTransformation.transformStart(rowDelta, colDelta);

    this.setRangeFocus(focusCoords.normalize());
  }

  /**
   * Transforms the last selection layer down or up by the index count.
   *
   * @param {number} visualRowIndex Visual row index from which the selection will be shifted.
   * @param {number} amount The number of rows to shift the selection.
   */
  shiftRows(visualRowIndex, amount) {
    if (!this.isSelected()) {
      return;
    }

    const range = this.selectedRange.current();

    if (this.isSelectedByCorner()) {
      this.selectAll(true, true, {
        disableHeadersHighlight: true,
      });

    } else if (this.isSelectedByColumnHeader() || range.getOuterTopStartCorner().row >= visualRowIndex) {
      const { from, to, highlight } = range;
      const countRows = this.tableProps.countRows();
      const isSelectedByRowHeader = this.isSelectedByRowHeader();
      const isSelectedByColumnHeader = this.isSelectedByColumnHeader();
      const minRow = isSelectedByColumnHeader ? -1 : 0;
      const coordsStartAmount = isSelectedByColumnHeader ? 0 : amount;

      // Remove from the stack the last added selection as that selection below will be
      // replaced by new transformed selection.
      this.getSelectedRange().pop();

      const coordsStart = this.tableProps.createCellCoords(
        clamp(from.row + coordsStartAmount, minRow, countRows - 1),
        from.col
      );
      const coordsEnd = this.tableProps.createCellCoords(
        clamp(to.row + amount, minRow, countRows - 1),
        to.col
      );

      this.markSource('shift');

      if (highlight.row >= visualRowIndex) {
        this.setRangeStartOnly(coordsStart, true, this.tableProps.createCellCoords(
          clamp(highlight.row + amount, 0, countRows - 1),
          highlight.col
        ));

      } else {
        this.setRangeStartOnly(coordsStart, true);
      }

      if (isSelectedByRowHeader) {
        this.selectedByRowHeader.add(this.getLayerLevel());
      }
      if (isSelectedByColumnHeader) {
        this.selectedByColumnHeader.add(this.getLayerLevel());
      }

      this.setRangeEnd(coordsEnd);
      this.markEndSource();
    }
  }

  /**
   * Transforms the last selection layer left or right by the index count.
   *
   * @param {number} visualColumnIndex Visual column index from which the selection will be shifted.
   * @param {number} amount The number of columns to shift the selection.
   */
  shiftColumns(visualColumnIndex, amount) {
    if (!this.isSelected()) {
      return;
    }

    const range = this.selectedRange.current();

    if (this.isSelectedByCorner()) {
      this.selectAll(true, true, {
        disableHeadersHighlight: true,
      });

    } else if (this.isSelectedByRowHeader() || range.getOuterTopStartCorner().col >= visualColumnIndex) {
      const { from, to, highlight } = range;
      const countCols = this.tableProps.countCols();
      const isSelectedByRowHeader = this.isSelectedByRowHeader();
      const isSelectedByColumnHeader = this.isSelectedByColumnHeader();
      const minColumn = isSelectedByRowHeader ? -1 : 0;
      const coordsStartAmount = isSelectedByRowHeader ? 0 : amount;

      // Remove from the stack the last added selection as that selection below will be
      // replaced by new transformed selection.
      this.getSelectedRange().pop();

      const coordsStart = this.tableProps.createCellCoords(
        from.row,
        clamp(from.col + coordsStartAmount, minColumn, countCols - 1)
      );
      const coordsEnd = this.tableProps.createCellCoords(
        to.row,
        clamp(to.col + amount, minColumn, countCols - 1)
      );

      this.markSource('shift');

      if (highlight.col >= visualColumnIndex) {
        this.setRangeStartOnly(coordsStart, true, this.tableProps.createCellCoords(
          highlight.row,
          clamp(highlight.col + amount, 0, countCols - 1)
        ));

      } else {
        this.setRangeStartOnly(coordsStart, true);
      }

      if (isSelectedByRowHeader) {
        this.selectedByRowHeader.add(this.getLayerLevel());
      }
      if (isSelectedByColumnHeader) {
        this.selectedByColumnHeader.add(this.getLayerLevel());
      }

      this.setRangeEnd(coordsEnd);
      this.markEndSource();
    }
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
   * Returns information if we have a multi-selection. This method check multi-selection only on the latest layer of
   * the selection.
   *
   * @returns {boolean}
   */
  isMultiple() {
    if (!this.isSelected()) {
      return false;
    }

    const isMultipleListener = createObjectPropListener(!this.selectedRange.current().isSingle());

    this.runLocalHooks('afterIsMultipleSelection', isMultipleListener);

    return isMultipleListener.value;
  }

  /**
   * Checks if the last selection involves changing the focus cell position only.
   *
   * @returns {boolean}
   */
  isFocusSelectionChanged() {
    return this.isSelected() && this.#isFocusSelectionChanged;
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
      this.setExpectedLayers(selectionRanges.length);

      arrayEach(selectionRanges, (selection) => {
        const { from, to } = selectionSchemaNormalizer(selection);

        this.setRangeStartOnly(from.clone(), false);
        this.setRangeEnd(to.clone());
      });

      this.finish();
    }

    return isValid;
  }

  /**
   * Select column specified by `startColumn` visual index or column property or a range of columns finishing at
   * `endColumn`.
   *
   * @param {number|string} startColumn Visual column index or column property from which the selection starts.
   * @param {number|string} [endColumn] Visual column index or column property from to the selection finishes.
   * @param {number | { row: number, col: number }} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position horizontally.
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
      let highlightRow = 0;
      let highlightColumn = 0;

      if (Number.isInteger(focusPosition?.row) && Number.isInteger(focusPosition?.col)) {
        highlightRow = clamp(focusPosition.row, columnHeaderLastIndex, countRows - 1);
        highlightColumn = clamp(focusPosition.col, Math.min(start, end), Math.max(start, end));
      } else {
        highlightRow = clamp(focusPosition, columnHeaderLastIndex, countRows - 1);
        highlightColumn = start;
      }

      const highlight = this.tableProps.createCellCoords(highlightRow, highlightColumn);
      const fromRow = countColHeaders === 0 ? 0 : clamp(highlight.row, columnHeaderLastIndex, -1);
      const toRow = countRows - 1;
      const from = this.tableProps.createCellCoords(fromRow, start);
      const to = this.tableProps.createCellCoords(toRow, end);

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
   * @param {number | { row: number, col: number }} [focusPosition=0] The argument allows changing the cell/header focus
   * position. The value can take visual row index from -N to N, where negative values point to the headers and positive
   * values point to the cell range. An object with `row` and `col` properties also can be passed to change the focus
   * position horizontally.
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
      let highlightRow = 0;
      let highlightColumn = 0;

      if (Number.isInteger(focusPosition?.row) && Number.isInteger(focusPosition?.col)) {
        highlightRow = clamp(focusPosition.row, Math.min(startRow, endRow), Math.max(startRow, endRow));
        highlightColumn = clamp(focusPosition.col, rowHeaderLastIndex, countCols - 1);
      } else {
        highlightRow = startRow;
        highlightColumn = clamp(focusPosition, rowHeaderLastIndex, countCols - 1);
      }

      const highlight = this.tableProps.createCellCoords(highlightRow, highlightColumn);
      const fromColumn = countRowHeaders === 0 ? 0 : clamp(highlight.col, rowHeaderLastIndex, -1);
      const toColumn = countCols - 1;
      const from = this.tableProps.createCellCoords(startRow, fromColumn);
      const to = this.tableProps.createCellCoords(endRow, toColumn);

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
   * Refreshes the whole selection by clearing, reapplying and committing the renderable selection (Walkontable Selection API)
   * by using already added visual ranges.
   */
  refresh() {
    if (!this.isSelected()) {
      return;
    }

    const countRows = this.tableProps.countRows();
    const countColumns = this.tableProps.countCols();

    if (countRows === 0 || countColumns === 0) {
      this.deselect();

      return;
    }

    const range = this.selectedRange.peekByIndex(this.selectedRange.size() - 1);
    const { from, to, highlight } = range;

    this.clear();

    highlight.assign({
      row: clamp(highlight.row, -Infinity, countRows - 1),
      col: clamp(highlight.col, -Infinity, countColumns - 1),
    });
    from.assign({
      row: clamp(from.row, -Infinity, countRows - 1),
      col: clamp(from.col, -Infinity, countColumns - 1),
    });
    to.assign({
      row: clamp(to.row, 0, countRows - 1),
      col: clamp(to.col, 0, countColumns - 1),
    });

    this.selectedRange.ranges.push(range);
    this.highlight
      .getFocus()
      .add(highlight)
      .commit()
      .syncWith(range);

    this.applyAndCommit(range);
  }

  /**
   * Refreshes the whole selection by recommitting (recalculating visual indexes to renderable ones) the renderable selection
   * that was already added.
   */
  commit() {
    const customSelections = this.highlight.getCustomSelections();

    customSelections.forEach((customSelection) => {
      customSelection.commit();
    });

    if (!this.isSelected()) {
      return;
    }

    const currentLayer = this.getLayerLevel();
    const cellRange = this.selectedRange.current();

    if (this.highlight.isEnabledFor(FOCUS_TYPE, cellRange.highlight)) {
      this.highlight
        .getFocus()
        .commit()
        .syncWith(cellRange);
    }

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
