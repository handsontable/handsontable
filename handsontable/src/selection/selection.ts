import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { SelectionFocusPosition, SelectionSettings, SelectionTableProps } from './types';
import Highlight, {
  AREA_TYPE,
  HEADER_TYPE,
  FOCUS_TYPE,
} from './highlight/highlight';
import SelectionRange from './range';
import { createObjectPropListener, mixin } from './../helpers/object';
import { isUndefined } from './../helpers/mixed';
import { clamp } from './../helpers/number';
import localHooks from './../mixins/localHooks';
import { ExtenderTransformation, FocusTransformation } from './transformation';
import {
  detectSelectionType,
  normalizeSelectionFactory,
  SELECTION_TYPE_EMPTY,
  SELECTION_TYPE_UNRECOGNIZED,
} from './utils';
import { toSingleLine } from './../helpers/templateLiteralTag';
import { throwWithCause } from '../helpers/errors';
import { A11Y_SELECTED } from '../helpers/a11y';

/**
 * Checks if the value is a focus-position object with integer `row` and `col` fields.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
function isFocusPositionObject(value: unknown): value is { row: number; col: number } {
  return typeof value === 'object' && value !== null
    && Number.isInteger((value as { row?: unknown }).row)
    && Number.isInteger((value as { col?: unknown }).col);
}

/**
 * @typedef {object} SelectionState
 * @property {CellRange[]} ranges The array of all ranges.
 * @property {CellRange} activeRange The active range.
 * @property {number} activeSelectionLayer The active selection layer.
 * @property {number[]} selectedByRowHeader The state of the selected row headers.
 * @property {number[]} selectedByColumnHeader The state of the selected column headers.
 * @property {boolean} disableHeadersHighlight The state of the disable headers highlight.
 */

/**
 * @class Selection
 * @util
 */
class Selection {
  /**
   * Triggers registered local hook callbacks for the given hook name, passing any additional arguments.
   */
  declare runLocalHooks: (...args: unknown[]) => void;
  /**
   * Registers a local hook callback for the given hook name on this instance.
   */
  declare addLocalHook: (...args: unknown[]) => this;

  /**
   * Handsontable settings instance.
   *
   * @type {GridSettings}
   */
  settings: SelectionSettings;
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
  selectedRange = new SelectionRange((highlight: CellCoords, from: CellCoords, to: CellCoords) => {
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
   * @type {ExtenderTransformation}
   */
  readonly #extenderTransformation;
  /**
   * The module for modifying coordinates of the focus selection.
   *
   * @type {FocusTransformation}
   */
  readonly #focusTransformation;
  /**
   * The collection of the selection layer levels where the whole row was selected using the row header or
   * the corner header.
   *
   * @type {Set<number>}
   */
  selectedByRowHeader = new Set<number>();
  /**
   * The collection of the selection layer levels where the whole column was selected using the column header or
   * the corner header.
   *
   * @type {Set<number>}
   */
  selectedByColumnHeader = new Set<number>();
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
  /**
   * The index of the active range layer. Active range layer is the layer that has visible focus highlight.
   * Focus highlight may jump between selection range layers.
   *
   * @type {number}
   */
  #activeSelectionLayer = 0;

  /**
   * Initializes the Selection manager with grid settings and table API references, and sets up transformation modules and highlight layers.
   */
  constructor(settings: SelectionSettings, tableProps: SelectionTableProps) {
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
      disabledCellSelection: (row: number, column: number) => this.tableProps.isDisabledCellSelection(row, column),
      cellCornerVisible: () => this.isCellCornerVisible(),
      areaCornerVisible: (layerLevel: number) => this.isAreaCornerVisible(layerLevel),
      visualToRenderableCoords: (coords: CellCoords) => this.tableProps.visualToRenderableCoords(coords),
      renderableToVisualCoords: (coords: CellCoords) => this.tableProps.renderableToVisualCoords(coords),
      createCellCoords: (row: number, column: number) => this.tableProps.createCellCoords(row, column),
      createCellRange: (highlight: CellCoords, from: CellCoords, to: CellCoords) =>
        this.tableProps.createCellRange(highlight, from, to),
    });

    this.#extenderTransformation = new ExtenderTransformation(this.selectedRange, {
      ...this.tableProps,
      navigableHeaders: () => !!settings.navigableHeaders,
      fixedRowsBottom: () => Number(settings.fixedRowsBottom),
      minSpareRows: () => Number(settings.minSpareRows),
      minSpareCols: () => Number(settings.minSpareCols),
      autoWrapRow: () => !!settings.autoWrapRow,
      autoWrapCol: () => !!settings.autoWrapCol,
    });
    this.#focusTransformation = new FocusTransformation(this.selectedRange, {
      ...this.tableProps,
      navigableHeaders: () => !!settings.navigableHeaders,
      fixedRowsBottom: () => 0,
      minSpareRows: () => 0,
      minSpareCols: () => 0,
      autoWrapRow: () => true,
      autoWrapCol: () => true,
    });

    this.#extenderTransformation.addLocalHook('beforeTransformStart',
      (...args: unknown[]) => this.runLocalHooks('beforeModifyTransformStart', ...args));
    this.#extenderTransformation.addLocalHook('afterTransformStart',
      (...args: unknown[]) => this.runLocalHooks('afterModifyTransformStart', ...args));
    this.#extenderTransformation.addLocalHook('beforeTransformEnd',
      (...args: unknown[]) => this.runLocalHooks('beforeModifyTransformEnd', ...args));
    this.#extenderTransformation.addLocalHook('afterTransformEnd',
      (...args: unknown[]) => this.runLocalHooks('afterModifyTransformEnd', ...args));
    this.#extenderTransformation.addLocalHook('insertRowRequire',
      (...args: unknown[]) => this.runLocalHooks('insertRowRequire', ...args));
    this.#extenderTransformation.addLocalHook('insertColRequire',
      (...args: unknown[]) => this.runLocalHooks('insertColRequire', ...args));
    this.#extenderTransformation.addLocalHook('beforeRowWrap',
      (...args: unknown[]) => this.runLocalHooks('beforeRowWrap', ...args));
    this.#extenderTransformation.addLocalHook('beforeColumnWrap',
      (...args: unknown[]) => this.runLocalHooks('beforeColumnWrap', ...args));

    this.#focusTransformation.addLocalHook('beforeTransformStart',
      (...args: unknown[]) => this.runLocalHooks('beforeModifyTransformFocus', ...args));
    this.#focusTransformation.addLocalHook('afterTransformStart',
      (...args: unknown[]) => this.runLocalHooks('afterModifyTransformFocus', ...args));
  }

  /**
   * Updates the CSS class names used for row, column, header, and active header highlights based on
   * the current settings. Call this after settings change via `updateSettings()`.
   */
  updateHighlightClassNames() {
    this.highlight.updateHighlightClassNames({
      rowClassName: this.settings.currentRowClassName,
      columnClassName: this.settings.currentColClassName,
      headerClassName: this.settings.currentHeaderClassName,
      activeHeaderClassName: this.settings.activeHeaderClassName,
    });
  }

  /**
   * Gets all selection range layers of the selection.
   *
   * @returns {SelectionRange}
   */
  getSelectedRange() {
    return this.selectedRange;
  }

  /**
   * Gets the active selection range layer.
   *
   * @returns {CellRange}
   */
  getActiveSelectedRange() {
    return this.selectedRange.peekByIndex(this.#activeSelectionLayer);
  }

  /**
   * Gets the index of the active selection range layer.
   *
   * @returns {number}
   */
  getActiveSelectionLayerIndex() {
    return this.#activeSelectionLayer;
  }

  /**
   * Sets the index of the active selection range layer.
   *
   * @param {number} layerIndex The index of the active selection range layer.
   */
  setActiveSelectionLayerIndex(layerIndex: number) {
    this.#activeSelectionLayer = layerIndex;
  }

  /**
   * Marks the source of the selection. It can be one of the following values: `mouse`, or any other string.
   *
   * @param {'mouse' | 'unknown' | string} sourceName The source name.
   */
  markSource(sourceName: string) {
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
  setExpectedLayers(layersCount: number) {
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
  setRangeStart(
    coords: CellCoords, multipleSelection?: boolean, fragment = false, highlightCoords: CellCoords = coords) {
    const isMultipleMode = this.settings.selectionMode === 'multiple';
    const isMultipleSelection = isUndefined(multipleSelection) ?
      this.tableProps.getShortcutManager().isCtrlPressed() : multipleSelection;
    // We are creating copy. We would like to modify just the start of the selection by below hook. Then original coords
    // should be handled by next methods.
    const coordsClone = coords.clone();

    this.#disableHeadersHighlight = false;
    this.#isFocusSelectionChanged = false;
    this.runLocalHooks(`beforeSetRangeStart${fragment ? 'Only' : ''}`, coordsClone);

    if (!isMultipleMode || (isMultipleMode && !isMultipleSelection && isUndefined(multipleSelection))) {
      this.selectedRange.clear();

      this.highlight.getAreas().forEach(highlight => highlight.clear());
      this.highlight.getLayeredAreas().forEach(highlight => highlight.clear());
      this.highlight.getRowHeaders().forEach(highlight => highlight.clear());
      this.highlight.getColumnHeaders().forEach(highlight => highlight.clear());
      this.highlight.getActiveRowHeaders().forEach(highlight => highlight.clear());
      this.highlight.getActiveColumnHeaders().forEach(highlight => highlight.clear());
      this.highlight.getActiveCornerHeaders().forEach(highlight => highlight.clear());
      this.highlight.getRowHighlights().forEach(highlight => highlight.clear());
      this.highlight.getColumnHighlights().forEach(highlight => highlight.clear());
    }

    this.selectedRange
      .add(coordsClone)
      .current()
      ?.setHighlight(highlightCoords.clone());

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
  setRangeStartOnly(coords: CellCoords, multipleSelection?: boolean, highlightCoords: CellCoords = coords) {
    this.setRangeStart(coords, multipleSelection, true, highlightCoords);
  }

  /**
   * Ends selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {number} [layerIndex] The layer index to set the end on. If not provided, the current layer level is used.
   */
  setRangeEnd(coords: CellCoords, layerIndex = this.getLayerLevel()) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    this.setActiveSelectionLayerIndex(layerIndex);

    const coordsClone = coords.clone();
    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();
    const isSingle = this.getActiveSelectedRange()?.clone().setTo(coords).isSingleHeader();

    // Ignore processing the end range when the header selection starts overlapping the corner and
    // the selection is not a single header highlight.
    if ((countRows > 0 || countCols > 0) &&
       (countRows === 0 && (coordsClone.col ?? 0) < 0 && !isSingle ||
        countCols === 0 && (coordsClone.row ?? 0) < 0 && !isSingle)) {
      return;
    }

    this.runLocalHooks('beforeSetRangeEnd', coordsClone);
    this.begin();

    const cellRange = this.getActiveSelectedRange();

    if (!cellRange) {
      return;
    }

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
          col: cellRange.highlight.col ?? undefined
        });
      }
      if (
        isMultiple &&
        (verticalDir !== cellRange.getVerticalDirection() ||
        cellRange.getHeight() === 1 && !cellRange.includes(cellRange.highlight))
      ) {
        cellRange.from.assign({
          row: cellRange.highlight.row ?? undefined
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
    this.setRangeFocus(this.getActiveSelectedRange()?.highlight ?? cellRange.highlight, layerIndex);
    this.applyAndCommit(this.getActiveSelectedRange() ?? cellRange, layerIndex);

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
  applyAndCommit(cellRange = this.getActiveSelectedRange(), layerLevel = this.getLayerLevel()) {
    if (!cellRange) {
      return;
    }

    const countRows = this.tableProps.countRows();
    const countCols = this.tableProps.countCols();

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

    areaHighlight?.clear();
    layeredAreaHighlight?.clear();
    rowHeaderHighlight?.clear();
    columnHeaderHighlight?.clear();
    activeRowHeaderHighlight?.clear();
    activeColumnHeaderHighlight?.clear();
    activeCornerHeaderHighlight?.clear();
    rowHighlight?.clear();
    columnHighlight?.clear();

    if (this.highlight.isEnabledFor(AREA_TYPE, cellRange.highlight) && (this.isMultiple() || layerLevel >= 1)) {
      areaHighlight
        ?.add(cellRange.from)
        .add(cellRange.to)
        .commit();
      layeredAreaHighlight
        ?.add(cellRange.from)
        .add(cellRange.to)
        .commit();

      if (layerLevel === 1) {
        // For single cell selection in the same layer, we do not create area selection to prevent blue background.
        // When non-consecutive selection is performed we have to add that missing area selection to the previous layer
        // based on previous coordinates. It only occurs when the previous selection wasn't select multiple cells.
        const previousRange = this.selectedRange.peekByIndex(layerLevel - 1);

        if (previousRange) {
          this.highlight.useLayerLevel(layerLevel - 1);
          this.highlight
            .createArea()
            ?.add(previousRange.from)
            .commit()
            // Range may start with hidden indexes. Commit would not found start point (as we add just the `from` coords).
            .syncWith(previousRange);
          this.highlight
            .createLayeredArea()
            ?.add(previousRange.from)
            .commit()
            // Range may start with hidden indexes. Commit would not found start point (as we add just the `from` coords).
            .syncWith(previousRange);

          this.highlight.useLayerLevel(layerLevel);
        }
      }
    }

    if (this.highlight.isEnabledFor(HEADER_TYPE, cellRange.highlight)) {
      this.#applyHeaderHighlights(
        cellRange,
        countRows,
        countCols,
        rowHeaderHighlight,
        columnHeaderHighlight,
        activeRowHeaderHighlight,
        activeColumnHeaderHighlight,
        activeCornerHeaderHighlight,
        rowHighlight,
        columnHighlight,
      );
    }
  }

  /**
   * Applies header-type highlights for the given cell range.
   *
   * @param {CellRange} cellRange The cell range to highlight.
   * @param {number} countRows The total number of rows.
   * @param {number} countCols The total number of columns.
   * @param {object | null | undefined} rowHeaderHighlight The row header highlight instance.
   * @param {object | null | undefined} columnHeaderHighlight The column header highlight instance.
   * @param {object | null | undefined} activeRowHeaderHighlight The active row header highlight instance.
   * @param {object | null | undefined} activeColumnHeaderHighlight The active column header highlight instance.
   * @param {object | null | undefined} activeCornerHeaderHighlight The active corner header highlight instance.
   * @param {object | null | undefined} rowHighlight The row highlight instance.
   * @param {object | null | undefined} columnHighlight The column highlight instance.
   */
  #applyHeaderHighlights(
    cellRange: CellRange,
    countRows: number,
    countCols: number,
    rowHeaderHighlight: ReturnType<Highlight['createRowHeader']>,
    columnHeaderHighlight: ReturnType<Highlight['createColumnHeader']>,
    activeRowHeaderHighlight: ReturnType<Highlight['createActiveRowHeader']>,
    activeColumnHeaderHighlight: ReturnType<Highlight['createActiveColumnHeader']>,
    activeCornerHeaderHighlight: ReturnType<Highlight['createActiveCornerHeader']>,
    rowHighlight: ReturnType<Highlight['createRowHighlight']>,
    columnHighlight: ReturnType<Highlight['createColumnHighlight']>,
  ) {
    if (!cellRange.isSingleHeader()) {
      const rowCoordsFrom = this.tableProps.createCellCoords(Math.max(cellRange.from.row ?? 0, 0), -1);
      const rowCoordsTo = this.tableProps.createCellCoords(cellRange.to.row ?? 0, -1);
      const columnCoordsFrom = this.tableProps.createCellCoords(-1, Math.max(cellRange.from.col ?? 0, 0));
      const columnCoordsTo = this.tableProps.createCellCoords(-1, cellRange.to.col ?? 0);

      if (this.settings.selectionMode === 'single') {
        rowHeaderHighlight?.add(rowCoordsFrom).commit();
        columnHeaderHighlight?.add(columnCoordsFrom).commit();
        rowHighlight?.add(rowCoordsFrom).commit();
        columnHighlight?.add(columnCoordsFrom).commit();

      } else {
        rowHeaderHighlight
          ?.add(rowCoordsFrom)
          .add(rowCoordsTo)
          .commit();
        columnHeaderHighlight
          ?.add(columnCoordsFrom)
          .add(columnCoordsTo)
          .commit();
        rowHighlight
          ?.add(rowCoordsFrom)
          .add(rowCoordsTo)
          .commit();
        columnHighlight
          ?.add(columnCoordsFrom)
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
        ?.add(this.tableProps
          .createCellCoords(Math.max(cellRange.from.row ?? 0, 0), Math.min(-this.tableProps.countRowHeaders(), -1)))
        .add(this.tableProps
          .createCellCoords(Math.max(cellRange.to.row ?? 0, 0), -1))
        .commit();
    }

    if (highlightColumnHeaders) {
      activeColumnHeaderHighlight
        ?.add(this.tableProps
          .createCellCoords(Math.min(-this.tableProps.countColHeaders(), -1), Math.max(cellRange.from.col ?? 0, 0)))
        .add(this.tableProps
          .createCellCoords(-1, Math.max(cellRange.to.col ?? 0, 0)))
        .commit();
    }

    if (highlightRowHeaders && highlightColumnHeaders) {
      activeCornerHeaderHighlight
        ?.add(this.tableProps
          .createCellCoords(-this.tableProps.countColHeaders(), -this.tableProps.countRowHeaders()))
        .add(this.tableProps
          .createCellCoords(-1, -1))
        .commit();
    }
  }

  /**
   * Sets the selection focus position at the specified coordinates.
   *
   * @param {CellCoords} coords The CellCoords instance with defined visual coordinates.
   * @param {number} [layerIndex] The layer index to set the focus on.
   */
  setRangeFocus(coords: CellCoords, layerIndex = this.getLayerLevel()) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    this.setActiveSelectionLayerIndex(layerIndex);
    this.#extenderTransformation.setActiveLayerIndex(layerIndex);
    this.#focusTransformation.setActiveLayerIndex(layerIndex);

    const cellRange = this.getActiveSelectedRange();

    if (!this.inProgress) {
      this.runLocalHooks('beforeSetFocus', coords);
    }

    if (!cellRange) {
      return;
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
  transformStart(rowDelta: number, colDelta: number, createMissingRecords = false) {
    if (!this.isSelected()) {
      return;
    }

    const {
      visualCoords
    } = this.#extenderTransformation.transformStart(rowDelta, colDelta, createMissingRecords);

    this.setRangeStart(visualCoords, undefined, false, visualCoords);
  }

  /**
   * Sets selection end cell relative to the current selection end cell (if possible).
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformEnd(rowDelta: number, colDelta: number) {
    if (!this.isSelected()) {
      return;
    }

    const {
      visualCoords,
      selectionLayer,
    } = this.#extenderTransformation.transformEnd(rowDelta, colDelta);

    this.setRangeEnd(visualCoords, selectionLayer);
  }

  /**
   * Transforms the focus cell selection relative to the current focus position.
   *
   * @param {number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformFocus(rowDelta: number, colDelta: number) {
    if (!this.isSelected()) {
      return;
    }

    const {
      selectionLayer,
      visualCoords,
    } = this.#focusTransformation.transformStart(rowDelta, colDelta);

    this.setRangeFocus(visualCoords.normalize(), selectionLayer);
  }

  /**
   * Transforms the last selection layer down or up by the index count.
   *
   * @param {number} visualRowIndex Visual row index from which the selection will be shifted.
   * @param {number} amount The number of rows to shift the selection.
   */
  shiftRows(visualRowIndex: number, amount: number) {
    if (!this.isSelected()) {
      return;
    }

    const range = this.getActiveSelectedRange();

    if (this.isSelectedByCorner()) {
      this.selectAll(true, true, {
        disableHeadersHighlight: true,
      });

    } else if (range &&
        (this.isSelectedByColumnHeader() || (range.getOuterTopStartCorner().row ?? 0) >= visualRowIndex)) {
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
        clamp((from.row ?? 0) + coordsStartAmount, minRow, countRows - 1),
        from.col ?? 0
      );
      const coordsEnd = this.tableProps.createCellCoords(
        clamp((to.row ?? 0) + amount, minRow, countRows - 1),
        to.col ?? 0
      );

      this.markSource('shift');

      if ((highlight.row ?? 0) >= visualRowIndex) {
        this.setRangeStartOnly(coordsStart, true, this.tableProps.createCellCoords(
          clamp((highlight.row ?? 0) + amount, 0, countRows - 1),
          highlight.col ?? 0
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
  shiftColumns(visualColumnIndex: number, amount: number) {
    if (!this.isSelected()) {
      return;
    }

    const range = this.getActiveSelectedRange();

    if (this.isSelectedByCorner()) {
      this.selectAll(true, true, {
        disableHeadersHighlight: true,
      });

    } else if (range &&
        (this.isSelectedByRowHeader() || (range.getOuterTopStartCorner().col ?? 0) >= visualColumnIndex)) {
      const { from, to, highlight } = range;
      const countCols = this.tableProps.countCols();
      const isSelectedByRowHeader = this.isSelectedByRowHeader();
      const isSelectedByColumnHeader = this.isSelectedByColumnHeader();
      const minColumn = isSelectedByRowHeader ? -1 : 0;
      const coordsStartAmount = isSelectedByRowHeader ? 0 : amount;

      // After shifting, a single-column selection can land on a column that is hidden (e.g. removing
      // a column next to a hidden one), leaving the highlight on a non-rendered column. Snap it to
      // the nearest visible column. This is scoped to single-column selections only - a wider range
      // legitimately keeps hidden columns within its bounds (they stay part of copy/fill ranges), so
      // its corners are never snapped.
      const isSingleColumn = from.col === to.col;
      const clampToVisibleColumn = (visualColumn: number): number => {
        if (!isSingleColumn || visualColumn < 0) {
          return visualColumn;
        }

        const nearestColumn = this.tableProps.columnIndexMapper.getNearestNotHiddenIndex(visualColumn, 1, true);

        return nearestColumn === null ? visualColumn : nearestColumn;
      };

      // Remove from the stack the last added selection as that selection below will be
      // replaced by new transformed selection.
      this.getSelectedRange().pop();

      const coordsStart = this.tableProps.createCellCoords(
        from.row ?? 0,
        clampToVisibleColumn(clamp((from.col ?? 0) + coordsStartAmount, minColumn, countCols - 1))
      );
      const coordsEnd = this.tableProps.createCellCoords(
        to.row ?? 0,
        clampToVisibleColumn(clamp((to.col ?? 0) + amount, minColumn, countCols - 1))
      );

      this.markSource('shift');

      if ((highlight.col ?? 0) >= visualColumnIndex) {
        this.setRangeStartOnly(coordsStart, true, this.tableProps.createCellCoords(
          highlight.row ?? 0,
          clampToVisibleColumn(clamp((highlight.col ?? 0) + amount, 0, countCols - 1))
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
   * @param {CellRange} [cellRange] The cell range to check. If not provided, the latest selection layer is used.
   * @returns {boolean}
   */
  isMultiple(cellRange = this.getActiveSelectedRange()) {
    if (!this.isSelected() || !cellRange) {
      return false;
    }

    const isMultipleListener = createObjectPropListener(!cellRange.isSingle());

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
    return !this.isSelectedByCorner() && (layerLevel === -1 ?
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
    const tester = (range: CellRange) => {
      const { col } = range.getOuterTopStartCorner();
      const rowHeaders = this.tableProps.countRowHeaders();
      const countCols = this.tableProps.countCols();

      return (rowHeaders > 0 && (col ?? 0) < 0 || rowHeaders === 0) && range.getWidth() === countCols;
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
    const tester = (range: CellRange) => {
      const { row } = range.getOuterTopStartCorner();
      const colHeaders = this.tableProps.countColHeaders();
      const countRows = this.tableProps.countRows();

      return (colHeaders > 0 && (row ?? 0) < 0 || colHeaders === 0) && range.getHeight() === countRows;
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
  inInSelection(coords: CellCoords) {
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
  isCellVisible(coords: CellCoords) {
    const renderableCoords = this.tableProps.visualToRenderableCoords(coords);

    return renderableCoords.row !== null && renderableCoords.col !== null;
  }

  /**
   * Returns `true` if the area corner should be visible.
   *
   * @param {number} layerLevel The layer level.
   * @returns {boolean} `true` if the corner element has to be visible, `false` otherwise.
   */
  isAreaCornerVisible(layerLevel: number) {
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
  selectAll(includeRowHeaders = false, includeColumnHeaders = false, options: {
    focusPosition?: SelectionFocusPosition | boolean; disableHeadersHighlight?: boolean
  } = { focusPosition: false, disableHeadersHighlight: false }) {
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

    let highlight = this.getActiveSelectedRange()?.highlight;
    const {
      focusPosition,
      disableHeadersHighlight
    } = options;

    if (isFocusPositionObject(focusPosition)) {
      highlight = this.tableProps
        .createCellCoords(
          clamp(focusPosition.row, rowFrom, nrOfRows - 1),
          clamp(focusPosition.col, columnFrom, nrOfColumns - 1)
        );
    }

    const startCoords = this.tableProps.createCellCoords(rowFrom, columnFrom);
    const endCoords = this.tableProps.createCellCoords(nrOfRows - 1, nrOfColumns - 1);

    this.clear();
    this.runLocalHooks('beforeSelectAll', startCoords, endCoords, highlight);
    this.setRangeStartOnly(startCoords, undefined, highlight);

    this.#disableHeadersHighlight = disableHeadersHighlight ?? false;

    if (columnFrom < 0) {
      this.selectedByRowHeader.add(this.getLayerLevel());
    }
    if (rowFrom < 0) {
      this.selectedByColumnHeader.add(this.getLayerLevel());
    }

    this.setRangeEnd(endCoords);
    this.runLocalHooks('afterSelectAll', startCoords, endCoords, highlight);
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
  selectCells(selectionRanges: unknown[]) {
    const selectionType = detectSelectionType(selectionRanges);

    if (selectionType === SELECTION_TYPE_EMPTY) {
      return false;

    } else if (selectionType === SELECTION_TYPE_UNRECOGNIZED) {
      throwWithCause(toSingleLine`Unsupported format of the selection ranges was passed. To select cells pass\x20
        the coordinates as an array of arrays ([[rowStart, columnStart/columnPropStart, rowEnd,\x20
        columnEnd/columnPropEnd]]) or as an array of CellRange objects.`);
    }

    const selectionSchemaNormalizer = normalizeSelectionFactory(selectionType, {
      createCellCoords: (...args: [number, number]) => this.tableProps.createCellCoords(...args),
      createCellRange: (...args: [CellCoords, CellCoords, CellCoords]) => this.tableProps.createCellRange(...args),
      propToCol: (prop: string | number) => this.tableProps.propToCol(prop),
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
    const isValid = !selectionRanges.some((selection: unknown) => {
      const cellRange = selectionSchemaNormalizer(selection);
      const rangeValidity = cellRange.isValid(tableParams);

      return !(rangeValidity && !cellRange.containsHeaders() ||
               rangeValidity && cellRange.containsHeaders() && cellRange.isSingleHeader());
    });

    if (isValid) {
      this.clear();
      this.setExpectedLayers(selectionRanges.length);

      selectionRanges.forEach((selection) => {
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
  selectColumns(
    startColumn: number | string, endColumn: number | string = startColumn,
    focusPosition: number | { row?: number; col?: number } = 0) {
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

      if (isFocusPositionObject(focusPosition)) {
        highlightRow = clamp(focusPosition.row ?? 0, columnHeaderLastIndex, countRows - 1);
        highlightColumn = clamp(focusPosition.col ?? 0, Math.min(start, end), Math.max(start, end));
      } else {
        highlightRow = clamp(
          typeof focusPosition === 'number' ? focusPosition : 0, columnHeaderLastIndex, countRows - 1);
        highlightColumn = start;
      }

      const highlight = this.tableProps.createCellCoords(highlightRow, highlightColumn);
      const fromRow = countColHeaders === 0 ? 0 : clamp(highlight.row ?? 0, columnHeaderLastIndex, -1);
      const toRow = countRows - 1;
      const from = this.tableProps.createCellCoords(fromRow, start);
      const to = this.tableProps.createCellCoords(toRow, end);

      this.runLocalHooks('beforeSelectColumns', from, to, highlight);

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
  selectRows(startRow: number, endRow: number = startRow, focusPosition: number | { row?: number; col?: number } = 0) {
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

      if (isFocusPositionObject(focusPosition)) {
        highlightRow = clamp(focusPosition.row ?? 0, Math.min(startRow, endRow), Math.max(startRow, endRow));
        highlightColumn = clamp(focusPosition.col ?? 0, rowHeaderLastIndex, countCols - 1);
      } else {
        highlightRow = startRow;
        highlightColumn = clamp(
          typeof focusPosition === 'number' ? focusPosition : 0, rowHeaderLastIndex, countCols - 1);
      }

      const highlight = this.tableProps.createCellCoords(highlightRow, highlightColumn);
      const fromColumn = countRowHeaders === 0 ? 0 : clamp(highlight.col ?? 0, rowHeaderLastIndex, -1);
      const toColumn = countCols - 1;
      const from = this.tableProps.createCellCoords(startRow, fromColumn);
      const to = this.tableProps.createCellCoords(endRow, toColumn);

      this.runLocalHooks('beforeSelectRows', from, to, highlight);

      this.setRangeStartOnly(from, undefined, highlight);
      this.selectedByRowHeader.add(this.getLayerLevel());
      this.setRangeEnd(to);
      this.runLocalHooks('afterSelectRows', from, to, highlight);
      this.finish();
    }

    return isValid;
  }

  /**
   * Allows importing the selection for all layers from the provided array of CellRange objects.
   * The method clears the current selection and sets the new one without triggering any
   * selection related hooks.
   *
   * @param {SelectionState} selectionState The selection state to import.
   */
  importSelection({
    ranges,
    activeRange,
    activeSelectionLayer,
    selectedByRowHeader,
    selectedByColumnHeader,
    disableHeadersHighlight,
  }: {
    ranges: CellRange[]; activeRange: CellRange; activeSelectionLayer: number;
    selectedByRowHeader: number[]; selectedByColumnHeader: number[]; disableHeadersHighlight: boolean;
  }) {
    if (ranges.length === 0) {
      return;
    }

    this.selectedRange.clear();
    this.highlight.clear();
    this.inProgress = false;
    this.#disableHeadersHighlight = disableHeadersHighlight;

    this.selectedByRowHeader = new Set(selectedByRowHeader);
    this.selectedByColumnHeader = new Set(selectedByColumnHeader);

    this.setActiveSelectionLayerIndex(0);

    ranges.forEach((cellRange: CellRange, selectionLayerIndex: number) => {
      this.selectedRange.push(cellRange);
      this.applyAndCommit(cellRange, selectionLayerIndex);
    });

    this.setRangeFocus(activeRange.highlight, activeSelectionLayer);

    this.#disableHeadersHighlight = false;
    this.inProgress = false;
  }

  /**
   * Exports all selection layers with other properties related to the selection state.
   *
   * @returns {SelectionState}
   */
  exportSelection() {
    return {
      ranges: Array.from(this.selectedRange).map(range => range.clone()),
      activeRange: this.getActiveSelectedRange(),
      activeSelectionLayer: this.getActiveSelectionLayerIndex(),
      selectedByRowHeader: Array.from(this.selectedByRowHeader),
      selectedByColumnHeader: Array.from(this.selectedByColumnHeader),
      disableHeadersHighlight: this.#disableHeadersHighlight,
    };
  }

  /**
   * Refreshes the whole selection by clearing, reapplying and committing (calculating visual to renderable indexes)
   * the selection by using already added visual ranges. The method can be useful when underneath some indexes
   * was hidden/showed or dataset size was changed or the range of the cell ranges was modified. Then, to see the
   * changes in the selection the method may be needed to be called. The method modifies the visual ranges if needed.
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

    const ranges = this.selectedRange.ranges.map(range => range.clone());
    const selectionSource = this.getSelectionSource();

    if (selectionSource === 'unknown') {
      this.markSource('refresh');
    }

    const selectedByRowHeader = new Set(this.selectedByRowHeader);
    const selectedByColumnHeader = new Set(this.selectedByColumnHeader);

    this.clear();
    this.setExpectedLayers(ranges.length);

    ranges.forEach((range) => {
      const { from, to, highlight } = range;
      const maxRows = countRows - 1;
      const maxColumns = countColumns - 1;

      highlight.assign({
        row: clamp(highlight.row ?? 0, this.settings.navigableHeaders ? -Infinity : 0, maxRows),
        col: clamp(highlight.col ?? 0, this.settings.navigableHeaders ? -Infinity : 0, maxColumns),
      });
      from.assign({
        row: clamp(from.row ?? 0, -Infinity, maxRows),
        col: clamp(from.col ?? 0, -Infinity, maxColumns),
      });
      to.assign({
        row: clamp(to.row ?? 0, -Infinity, maxRows),
        col: clamp(to.col ?? 0, -Infinity, maxColumns),
      });

      this.setRangeStartOnly(from, true, highlight);
      this.setRangeEnd(to);
    });

    this.selectedByRowHeader = selectedByRowHeader;
    this.selectedByColumnHeader = selectedByColumnHeader;

    this.finish();
    this.markEndSource();
  }

  /**
   * Refreshes the whole selection by only recommitting values. In terms of the selection the committing
   * values means that the cell ranges are again recalculated to the renderable indexes - the visual
   * indexes are not touched. The method can be useful when underneath some indexes was hidden/showed
   * which affects the selection. In that cases the method may be needed to be called.
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
    const cellRange = this.getActiveSelectedRange();

    if (cellRange && this.highlight.isEnabledFor(FOCUS_TYPE, cellRange.highlight)) {
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

      areaHighlight?.commit();
      areaLayeredHighlight?.commit();
      rowHeaderHighlight?.commit();
      columnHeaderHighlight?.commit();
      activeRowHeaderHighlight?.commit();
      activeColumnHeaderHighlight?.commit();
      activeCornerHeaderHighlight?.commit();
      rowHighlight?.commit();
      columnHighlight?.commit();
    }

    // Reverting starting layer for the Highlight.
    this.highlight.useLayerLevel(currentLayer);
  }
}

mixin(Selection, localHooks);

export default Selection;
