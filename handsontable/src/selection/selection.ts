import type { default as CellCoords } from '../3rdparty/walkontable/src/cell/coords';
import type { default as CellRange } from '../3rdparty/walkontable/src/cell/range';
import type { SelectionFocusPosition, SelectionSettings, SelectionTableProps } from './types';
import type { IndexMapper } from '../translations';
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
import { canMoveRange } from './moveCells';
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
 * Snaps a shifted index to the nearest non-hidden index. Used after a selection shift so a
 * single-line selection does not land on a hidden (non-rendered) row or column. Snapping is
 * limited to single-line selections - a wider range legitimately keeps hidden indexes within its
 * bounds (they stay part of copy/fill ranges), so its corners are returned unchanged. Headers
 * (negative indexes) are returned unchanged as well.
 *
 * @param {IndexMapper} indexMapper The row or column index mapper to query for visibility.
 * @param {number} index The shifted visual index to snap.
 * @param {boolean} isSingleLine Whether the selection spans a single row/column on this axis.
 * @returns {number}
 */
function snapToNearestVisible(indexMapper: IndexMapper, index: number, isSingleLine: boolean): number {
  if (!isSingleLine || index < 0) {
    return index;
  }

  const nearestIndex = indexMapper.getNearestNotHiddenIndex(index, 1, true);

  return nearestIndex === null ? index : nearestIndex;
}

/**
 * @typedef {object} SelectionState
 * @property {CellRange[]} ranges The array of all ranges.
 * @property {CellRange} activeRange The active range.
 * @property {number} activeSelectionLayer The active selection layer.
 * @property {number[]} selectedByRowHeader The state of the selected row headers.
 * @property {number[]} selectedByColumnHeader The state of the selected column headers.
 * @property {boolean} disableHeadersHighlight The state of the disable headers highlight.
 * @property {boolean} rowExtentSpansGrid Whether the row extent spans the whole grid.
 * @property {boolean} columnExtentSpansGrid Whether the column extent spans the whole grid.
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
   * Visual layer index of the range currently hovered while `selectionHandles` is on, or `null`.
   *
   * @type {number | null}
   */
  #handlesHoveredLayer: number | null = null;
  /**
   * The PHYSICAL row of the record the active highlight points at, or `null` when there is no
   * selection or the highlight sits on a header.
   *
   * The highlight itself stores a VISUAL coordinate, which a trimming index map can invalidate
   * without touching it - the collapsed visual space no longer holds the record the user picked.
   * The physical index is what survives that, and `IndexMapper#updateCache()` rebuilds every cache
   * BEFORE it fires `cacheUpdated`, so it cannot be recovered afterwards. It has to be captured
   * while the selection is being laid, which is what `#captureHighlightRecord()` does.
   *
   * @type {number | null}
   */
  #highlightPhysicalRow: number | null = null;
  /**
   * The PHYSICAL column of the record the active highlight points at, or `null`. The column twin of
   * {@link Selection#highlightPhysicalRow}.
   *
   * @type {number | null}
   */
  #highlightPhysicalColumn: number | null = null;
  /**
   * Whether the active selection's ROW extent spans the whole grid by construction rather than
   * naming particular records - a full-column selection or a select-all.
   *
   * Recorded by the API that creates such a selection, because nothing about the resulting range
   * can be read back to tell the two apart later. The tempting signals all fail: the range's own
   * corner is only negative when the grid renders headers (`colHeaders` is off by default),
   * `isEntireColumnSelected()` measures the range against the CURRENT row count that a trim has
   * already changed, and the header-selection sets exclude a corner select-all by design.
   *
   * @type {boolean}
   */
  #rowExtentSpansGrid = false;
  /**
   * Whether the active selection's COLUMN extent spans the whole grid by construction - a full-row
   * selection or a select-all. The column counterpart of {@link Selection#rowExtentSpansGrid}.
   *
   * @type {boolean}
   */
  #columnExtentSpansGrid = false;

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
      adjustHandlesVisible: (layerLevel: number) => this.isAdjustHandlesVisibleFor(layerLevel),
      moveEnabled: () => this.isRangeMovable(),
      cellMoveEnabled: () => this.isSingleCellMovable(),
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
    // Cleared for every selection. The three APIs that DO span an axis - `selectColumns()`,
    // `selectRows()`, `selectAll()` - set it back after their range is laid, and the paths that
    // merely re-lay an existing selection (`refresh()`, `shiftRows()`, `shiftColumns()`) carry it
    // across, so only a genuinely new selection lands here with both cleared.
    this.#rowExtentSpansGrid = false;
    this.#columnExtentSpansGrid = false;
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

    // Captured here as well as in `setRangeFocus()`, for the `fragment` path: it leaves the
    // highlight written above as the final one, because `setRangeEnd()` never runs.
    this.#captureHighlightRecord();

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

    // Last, because two things move the highlight after it is written above: `syncWith()` snaps it
    // onto the nearest visible cell, and a consumer of `afterSetFocus` can reassign it outright -
    // `mergeCells` does, to pull the focus onto a merged parent. Capturing any earlier records the
    // cell the focus was on BEFORE the merge, so the next trim judges the wrong record.
    this.#captureHighlightRecord();
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

      // After shifting, a single-row selection can land on a row that is hidden (e.g. removing a
      // row next to a hidden one), leaving the highlight on a non-rendered row. Snap it to the
      // nearest visible row (see snapToNearestVisible for the single-line scoping rationale).
      const isSingleRow = from.row === to.row;
      const clampToVisibleRow = (visualRow: number): number =>
        snapToNearestVisible(this.tableProps.rowIndexMapper, visualRow, isSingleRow);

      const rowExtentSpansGrid = this.#rowExtentSpansGrid;
      const columnExtentSpansGrid = this.#columnExtentSpansGrid;

      // Remove from the stack the last added selection as that selection below will be
      // replaced by new transformed selection.
      this.getSelectedRange().pop();

      const coordsStart = this.tableProps.createCellCoords(
        clampToVisibleRow(clamp((from.row ?? 0) + coordsStartAmount, minRow, countRows - 1)),
        from.col ?? 0
      );
      const coordsEnd = this.tableProps.createCellCoords(
        clampToVisibleRow(clamp((to.row ?? 0) + amount, minRow, countRows - 1)),
        to.col ?? 0
      );

      this.markSource('shift');

      if ((highlight.row ?? 0) >= visualRowIndex) {
        this.setRangeStartOnly(coordsStart, true, this.tableProps.createCellCoords(
          clampToVisibleRow(clamp((highlight.row ?? 0) + amount, 0, countRows - 1)),
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

      // Re-laying the range through `setRangeStartOnly()` cleared these, and a shift does not change
      // what the selection spans - a full column is still a full column after a row is inserted.
      this.#rowExtentSpansGrid = rowExtentSpansGrid;
      this.#columnExtentSpansGrid = columnExtentSpansGrid;

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
      // the nearest visible column (see snapToNearestVisible for the single-line scoping rationale).
      const isSingleColumn = from.col === to.col;
      const clampToVisibleColumn = (visualColumn: number): number =>
        snapToNearestVisible(this.tableProps.columnIndexMapper, visualColumn, isSingleColumn);

      const rowExtentSpansGrid = this.#rowExtentSpansGrid;
      const columnExtentSpansGrid = this.#columnExtentSpansGrid;

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

      // Re-laying the range through `setRangeStartOnly()` cleared these, and a shift does not change
      // what the selection spans - a full column is still a full column after a row is inserted.
      this.#rowExtentSpansGrid = rowExtentSpansGrid;
      this.#columnExtentSpansGrid = columnExtentSpansGrid;

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
   * Captures the record the active highlight points at, so a later trimming index map can be asked
   * whether that record is still there. Runs wherever the highlight settles - see
   * {@link Selection#highlightPhysicalRow} for why it cannot be read back on demand.
   *
   * @private
   */
  #captureHighlightRecord() {
    const highlight = this.getActiveSelectedRange()?.highlight;

    if (!highlight) {
      this.#highlightPhysicalRow = null;
      this.#highlightPhysicalColumn = null;

      return;
    }

    const { row, col } = highlight;

    // A header carries no record, so there is nothing to follow - a negative index captures as
    // `null` and the stranded check then falls back to the range test for that axis.
    this.#highlightPhysicalRow = row === null || row < 0 ?
      null : this.tableProps.rowIndexMapper.getPhysicalFromVisualIndex(row);
    this.#highlightPhysicalColumn = col === null || col < 0 ?
      null : this.tableProps.columnIndexMapper.getPhysicalFromVisualIndex(col);
  }

  /**
   * Tells whether one axis of a coordinate has been left past the last index.
   *
   * Applied to the highlight AND to both range corners, because a paste sizes its fill loop from
   * the corners: a range whose far corner outruns the axis writes down to it and appends records,
   * whatever the highlight is doing.
   *
   * @private
   * @param {number | null} visualIndex The visual index on that axis.
   * @param {number} count The number of visual indexes on that axis.
   * @returns {boolean}
   */
  #isAxisOutOfRange(visualIndex: number | null, count: number): boolean {
    // Headers are outside the record space and keep their own coordinates. An axis trimmed away
    // ENTIRELY is excluded too: that is a grid with nothing on that axis rather than a stale
    // selection, and selecting headers over it stays meaningful - copying with every row trimmed
    // yields an empty table, and column headers still copy. Established, tested behavior.
    if (visualIndex === null || visualIndex < 0 || count === 0) {
      return false;
    }

    return visualIndex > count - 1;
  }

  /**
   * Tells whether one axis of the highlight no longer addresses the record it was captured on,
   * although the coordinate itself still addresses something.
   *
   * This is the half an open editor is exempt from: a write through such a coordinate lands on a
   * real record rather than appending, and `EditorManager` keeps the selection there on purpose.
   *
   * @private
   * @param {number | null} visualIndex The highlight's visual index on that axis.
   * @param {number | null} physicalIndex The captured physical index on that axis, if any.
   * @param {IndexMapper} indexMapper The index mapper for that axis.
   * @param {number} count The number of visual indexes on that axis.
   * @returns {boolean}
   */
  #isAxisRecordGone(
    visualIndex: number | null, physicalIndex: number | null, indexMapper: IndexMapper, count: number): boolean {
    if (visualIndex === null || visualIndex < 0 || count === 0 || physicalIndex === null) {
      return false;
    }

    return indexMapper.getVisualFromPhysicalIndex(physicalIndex) === null;
  }

  /**
   * Tells whether the current selection is eligible for a `moveCells` drag at all: the feature is
   * on (the setting is enabled AND the plugin has not been disabled at runtime), no editor is open,
   * visual selection is not disabled, and the selection shape passes {@link canMoveRange}
   * (exactly one contiguous range that is not a full row, full column, or header selection).
   * Mirrors the eligibility gate applied when a move drag starts, so the move zone and grab
   * cursor never show for a selection that a drag would reject. The editor check matches
   * {@link Selection#isCellCornerVisible} — starting a drag mid-edit would swallow the mousedown
   * that normally commits the editor, so the release could rewrite a cell whose editor still holds
   * an uncommitted value.
   *
   * @private
   * @returns {boolean}
   */
  #isSelectionMovable() {
    if (this.settings.moveCells !== true || this.settings.disableVisualSelection ||
        this.tableProps.isEditorOpened() || !this.tableProps.isPluginEnabled('moveCells')) {
      return false;
    }

    return canMoveRange({
      rangeCount: this.getSelectedRange().size(),
      isEntireRow: this.isEntireRowSelected(),
      isEntireColumn: this.isEntireColumnSelected(),
      isHeader: this.isSelectedByRowHeader() || this.isSelectedByColumnHeader(),
    });
  }

  /**
   * Tells whether the `moveCells` move zone should show on the area (multi-cell) selection border:
   * the selection is movable (see {@link Selection##isSelectionMovable}) and spans more than one cell.
   *
   * @private
   * @returns {boolean}
   */
  isRangeMovable() {
    const range = this.getActiveSelectedRange();

    return this.#isSelectionMovable() && !!range && !range.isSingle();
  }

  /**
   * Tells whether the `moveCells` move zone should show on the focus (single-cell) selection border:
   * the selection is movable (see {@link Selection##isSelectionMovable}) and there is exactly one
   * selected cell.
   *
   * @private
   * @returns {boolean}
   */
  isSingleCellMovable() {
    const range = this.getActiveSelectedRange();

    return this.#isSelectionMovable() && !!range && range.isSingle();
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
   * Returns the visual layer index of the selected range containing the given coords, or `null`.
   * When multiple ranges overlap the coord, the topmost layer (highest index) wins.
   *
   * @param {CellCoords} coords The visual cell coordinates to test.
   * @returns {number | null} The highest-index (topmost) layer that contains `coords`, or `null` if none do.
   */
  getLayerContaining(coords: CellCoords): number | null {
    if (this.selectedRange.isEmpty()) {
      return null;
    }

    for (let layer = this.selectedRange.size() - 1; layer >= 0; layer--) {
      if (this.selectedRange.peekByIndex(layer)?.includes(coords)) {
        return layer;
      }
    }

    return null;
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
   * Tells whether the adjustment handles should render for the given highlight layer.
   *
   * @private
   * @param {number} layerLevel The area highlight layer level.
   * @returns {boolean}
   */
  isAdjustHandlesVisibleFor(layerLevel: number) {
    // The editor check matches `isCellCornerVisible`/`isAreaCornerVisible`: the handles must not
    // render (nor start a drag) while a cell editor holds an uncommitted value. The plugin check
    // keeps a runtime `disablePlugin()` effective even though the setting still reads `true`.
    if (this.settings.selectionHandles !== true || this.tableProps.isEditorOpened() ||
        !this.tableProps.isPluginEnabled('selectionHandles')) {
      return false;
    }

    if (this.settings.selectionMode === 'single') {
      return false;
    }

    if (this.#handlesHoveredLayer !== layerLevel) {
      return false;
    }

    // Hide handles for full-row, full-column, and select-all selections
    // because those cannot be meaningfully resized via edge handles.
    // A select-all range spans all columns (isEntireRowSelected) AND all rows
    // (isEntireColumnSelected), so it is already covered by those two checks —
    // no separate isSelectedByCorner() call is needed here, and adding one would
    // incorrectly suppress handles on valid non-top layers in multiple-selection
    // mode (isSelectedByCorner() always inspects the topmost layer via getLayerLevel()).
    if (this.isEntireRowSelected(layerLevel) ||
        this.isEntireColumnSelected(layerLevel)) {
      return false;
    }

    return true;
  }

  /**
   * Returns the selection layer currently showing adjustment handles, or `null`.
   * This is an internal method used by the SelectionHandles plugin's hover and drag wiring, and is
   * not part of the public API.
   *
   * @private
   * @returns {number | null}
   */
  getHandlesHoveredLayer() {
    return this.#handlesHoveredLayer;
  }

  /**
   * Sets which selection layer currently shows adjustment handles and refreshes the borders.
   * This is an internal method called by the SelectionHandles plugin's hover wiring, and is not part
   * of the public API.
   *
   * @private
   * @param {number | null} layer The hovered layer level, or `null` to hide all handles.
   */
  setHandlesHoveredLayer(layer: number | null) {
    if (this.#handlesHoveredLayer === layer) {
      return;
    }

    this.#handlesHoveredLayer = layer;
    this.refresh();
  }

  /**
   * Clear the selection by resetting the collected ranges and highlights.
   */
  clear() {
    // TODO: collections selectedByColumnHeader and selectedByRowHeader should be clear too.
    this.selectedRange.clear();
    this.highlight.clear();
    this.#highlightPhysicalRow = null;
    this.#highlightPhysicalColumn = null;
    this.#rowExtentSpansGrid = false;
    this.#columnExtentSpansGrid = false;
  }

  /**
   * Re-reads the record the active highlight points at from its VISUAL coordinate.
   *
   * Called when a structural change (a row or column insert or remove) has renumbered the physical
   * space: the captured physical index then addresses a different record, while the visual
   * coordinate came through intact because the index mapper moved the visual space with it. So the
   * visual side is the trustworthy one here, and the record is read back from it - the same repair
   * `EditorManager#recaptureEditedRecord()` applies to the edited cell.
   *
   * Called for the same reason after a PERMUTATION (a sort, a row move), which rewrites the
   * visual-to-physical mapping while trimming nothing.
   *
   * This method is not part of the public API and should not be called by a consumer.
   *
   * @private
   */
  recaptureHighlightRecord() {
    this.#captureHighlightRecord();
  }

  /**
   * Deselects when a trimming index map has left the active highlight pointing at something other
   * than the record it was put on. Returns whether the selection was dropped.
   *
   * A trimmed row leaves the visual space entirely, unlike a hidden one, so the highlight's visual
   * coordinate can outlive the record it addressed. Writing through such a coordinate is what makes
   * `applyChanges()` APPEND records to the data set - a paste, a Ctrl+Enter commit or an autofill
   * all read the selection corners directly - so the selection is dropped rather than moved.
   *
   * Three shapes reach that corruption and all are checked here:
   *   - the record is gone, and the coordinate now addresses a different one that took its place;
   *   - the record survives further up, and the coordinate is left past the last row;
   *   - the highlight is fine but a CORNER of the range is left past the last row, which a paste
   *     still writes down to.
   *
   * ONE shape is deliberately not covered: a trim above the highlight that leaves the coordinate in
   * range while shifting the record out from under it (trimming row 0 with row 3 highlighted moves
   * that record to visual 2, and visual 3 now holds its neighbor). Closing it means deselecting on
   * every trim above the selection, which is a wider behavior change than this repair takes on.
   *
   * The rule reads the ACTIVE layer's highlight only. When it fires the whole selection goes, so a
   * stranded coordinate in a non-active layer of a multi-layer selection is not tracked.
   *
   * This method is not part of the public API and should not be called by a consumer.
   *
   * @private
   * @param {object} [options] Options.
   * @param {boolean} [options.unresolvableOnly=false] Drop only a coordinate that addresses nothing
   *                                                   at all, leaving one whose record merely
   *                                                   changed. Set while an editor is open, where
   *                                                   `EditorManager` keeps the selection on purpose
   *                                                   so the user can carry on typing into the cell
   *                                                   now under the cursor - a write there lands on
   *                                                   a real record, while an unresolvable
   *                                                   coordinate would append new ones.
   * @returns {boolean}
   */
  deselectIfHighlightStranded({ unresolvableOnly = false }: { unresolvableOnly?: boolean } = {}): boolean {
    if (!this.isSelected()) {
      return false;
    }

    const range = this.getActiveSelectedRange();

    if (!range) {
      return false;
    }

    const { highlight, from, to } = range;
    const { row, col } = highlight;
    const maxRow = this.tableProps.rowIndexMapper.getNotTrimmedIndexesLength() - 1;
    const maxColumn = this.tableProps.columnIndexMapper.getNotTrimmedIndexesLength() - 1;

    // Both counts are sized from the index mappers rather than `countRows()`/`countCols()`: those
    // read through the DataMap, which `updateData()` tears down and rebuilds while cache updates
    // are still firing. The mappers own the trimmed visual space anyway, which is what is tested.
    //
    // The two measures differ only where `maxRows`/`maxCols` binds - `DataMap#getLength()` is
    // `Math.min(notTrimmedLength, maxRows)` - which makes this test the more permissive of the two,
    // while `applyChanges()` grows the data set against the clamped one. That gap is unreachable:
    // it is non-empty only when the setting is below the not-trimmed length, and in exactly that
    // case a trim leaves the clamped count untouched, so a coordinate that was in range before the
    // trim is still in range after it.
    //
    // The HIGHLIGHT is tested alongside both corners. It normally sits between them, so the corner
    // test usually subsumes it - but it is checked in its own right rather than by assumption,
    // because nothing in this class holds the highlight inside the range, and a highlight the
    // corners do not cover is exactly the coordinate a commit would write through.
    const isRowOutOfRange =
      this.#isAxisOutOfRange(row, maxRow + 1) ||
      this.#isAxisOutOfRange(from.row, maxRow + 1) ||
      this.#isAxisOutOfRange(to.row, maxRow + 1);
    const isColumnOutOfRange =
      this.#isAxisOutOfRange(col, maxColumn + 1) ||
      this.#isAxisOutOfRange(from.col, maxColumn + 1) ||
      this.#isAxisOutOfRange(to.col, maxColumn + 1);

    if (isRowOutOfRange || isColumnOutOfRange) {
      // A header anchor says an extent TRACKS THE GRID rather than naming records, and it says so
      // PER AXIS. Anchoring in the column header (`from.row < 0`) is what makes a full-column
      // selection span every row, so a shorter grid means a shorter selection and clamping is what
      // it already meant. Anchoring in the row header (`from.col < 0`) says the same about columns.
      //
      // The two must not be conflated: a full-row selection is anchored in the ROW header, yet its
      // row index still names one particular record. Clamping that onto whichever row survives
      // would slide the selection to a neighbor, and the next paste would overwrite it - the silent
      // wrong-record write this repair exists to prevent. So each axis is judged by its own anchor.
      //
      // Read from the header-selection state rather than the range's corners. A negative corner
      // says the same thing only when the grid HAS headers - `selectColumns()` on a grid without
      // `colHeaders`, which is the default, anchors `from.row` at 0 - so testing the coordinate
      // would drop exactly the full-column selections this branch exists to keep. The state sets
      // are written by `selectColumns()`/`selectRows()` whether or not headers are rendered, and
      // `refresh()` carries them across, so they survive the trim.
      //
      // `isEntireColumnSelected()` cannot answer this either: it compares the range height against
      // the CURRENT row count, which the trim has already changed, so it reads false exactly here.
      const isRowExtentTracked = this.#rowExtentSpansGrid;
      const isColumnExtentTracked = this.#columnExtentSpansGrid;

      if ((isRowOutOfRange && !isRowExtentTracked) || (isColumnOutOfRange && !isColumnExtentTracked)) {
        this.deselect();

        return true;
      }

      this.refresh();

      return false;
    }

    if (unresolvableOnly) {
      return false;
    }

    const isRecordGone =
      this.#isAxisRecordGone(row, this.#highlightPhysicalRow, this.tableProps.rowIndexMapper, maxRow + 1) ||
      this.#isAxisRecordGone(col, this.#highlightPhysicalColumn,
        this.tableProps.columnIndexMapper, maxColumn + 1);

    if (!isRecordGone) {
      return false;
    }

    this.deselect();

    return true;
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
   * position won't be changed. When the {@link Options#navigableHeaders} option is disabled (the default), a
   * `focusPosition` that points to a header is relocated to the nearest cell in the data set.
   * @param {boolean} [options.disableHeadersHighlight] If `true`, disables highlighting the headers even when
   * the logical coordinates points on them. This only suppresses the highlight shown on headers of a fully-selected
   * row or column. It doesn't affect the focus indicator on the individual cell or header that holds the focus,
   * which stays visible even when {@link Options#navigableHeaders} moves the focus onto a header.
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

    // Recorded for BOTH axes and without a header condition. The header-state writes below are
    // deliberately conditional - they drive header highlighting, which only means something when a
    // header is rendered - so they cannot answer "does this extent span the grid".
    this.#rowExtentSpansGrid = true;
    this.#columnExtentSpansGrid = true;

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
      // A column selection covers every row by construction, so its row extent follows the grid.
      this.#rowExtentSpansGrid = true;
      this.setRangeEnd(to);
      this.runLocalHooks('afterSelectColumns', from, to, highlight);

      // For mouse-driven selection the process is finished by the document-level `mouseup`/`touchend`
      // handler once the user releases the button. Finishing here as well would fire `afterSelectionEnd`
      // prematurely on the initial `mousedown`, causing it to run twice for a header drag (#7133).
      if (this.getSelectionSource() !== 'mouse') {
        this.finish();
      }
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
      // A row selection covers every column by construction.
      this.#columnExtentSpansGrid = true;
      this.setRangeEnd(to);
      this.runLocalHooks('afterSelectRows', from, to, highlight);

      // For mouse-driven selection the process is finished by the document-level `mouseup`/`touchend`
      // handler once the user releases the button. Finishing here as well would fire `afterSelectionEnd`
      // prematurely on the initial `mousedown`, causing it to run twice for a header drag (#7133).
      if (this.getSelectionSource() !== 'mouse') {
        this.finish();
      }
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
    rowExtentSpansGrid = false,
    columnExtentSpansGrid = false,
  }: {
    ranges: CellRange[]; activeRange: CellRange; activeSelectionLayer: number;
    selectedByRowHeader: number[]; selectedByColumnHeader: number[]; disableHeadersHighlight: boolean;
    rowExtentSpansGrid?: boolean; columnExtentSpansGrid?: boolean;
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
    this.#rowExtentSpansGrid = rowExtentSpansGrid;
    this.#columnExtentSpansGrid = columnExtentSpansGrid;

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
      // Carried like the header state beside it: a consumer that stashes the selection, deselects,
      // and restores it later - `dialog` and `emptyDataState` both do - would otherwise hand back a
      // full-column or select-all selection that no longer knows it spans the grid, and the next
      // trim would drop it instead of clamping it.
      rowExtentSpansGrid: this.#rowExtentSpansGrid,
      columnExtentSpansGrid: this.#columnExtentSpansGrid,
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
    const rowExtentSpansGrid = this.#rowExtentSpansGrid;
    const columnExtentSpansGrid = this.#columnExtentSpansGrid;

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
    this.#rowExtentSpansGrid = rowExtentSpansGrid;
    this.#columnExtentSpansGrid = columnExtentSpansGrid;

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

    // `syncWith()` above can move the visual highlight onto the nearest visible cell, so the record
    // it points at goes stale here. Re-reading it is deliberately NOT done inside this method: a
    // single cache update can carry a hiding change and a trimming one together, and a re-read
    // would rebase the captured record onto whichever record now sits at the stale coordinate,
    // defeating the very test the caller is about to run. The Core owns that call and makes it only
    // when nothing was trimmed - see `repairSelection()` in `core.ts`.

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
