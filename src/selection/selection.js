import Highlight, {AREA_TYPE, HEADER_TYPE, CELL_TYPE} from './highlight/highlight';
import SelectionRange from './range';
import {CellRange, CellCoords} from './../3rdparty/walkontable/src';
import {isPressedCtrlKey} from './../utils/keyStateObserver';
import {createObjectPropListener, mixin} from './../helpers/object';
import {isUndefined} from './../helpers/mixed';
import {addClass, removeClass} from './../helpers/dom/element';
import {arrayEach} from './../helpers/array';
import localHooks from './../mixins/localHooks';
import Transformation from './transformation';

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
     * @type {Object}
     */
    this.tableProps = tableProps;
    /**
     * The flag which determines if the selection is in progress.
     *
     * @type {Boolean}
     */
    this.inProgress = false;
    /**
     * An object with flags which indicates what header is currently selected.
     *
     * @type {Object}
     */
    this.selectedHeader = {
      cols: false,
      rows: false,
      corner: false,
    };
    /**
     * Selection data layer.
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
      rowClassName: settings.currentRowClassName,
      columnClassName: settings.currentColClassName,
      disableHighlight: this.settings.disableVisualSelection,
      cellCornerVisible: () => this.settings.fillHandle && !this.tableProps.isEditorOpened() && !this.isMultiple(),
      areaCornerVisible: () => this.settings.fillHandle && !this.tableProps.isEditorOpened() && this.isMultiple(),
    });
    /**
     * The module for modifying coordinates.
     *
     * @type {Transformation}
     */
    this.transformation = new Transformation(this.selectedRange, {
      countRows: () => this.tableProps.countRows(),
      countCols: () => this.tableProps.countCols(),
      fixedRowsBottom: () => settings.fixedRowsBottom,
      minSpareRows: () => settings.minSpareRows,
      minSpareCols: () => settings.minSpareCols,
      autoWrapRow: () => settings.autoWrapRow,
      autoWrapCol: () => settings.autoWrapCol,
    });

    this.transformation.addLocalHook('beforeTransformStart', (...args) => this.runLocalHooks('beforeModifyTransformStart', ...args));
    this.transformation.addLocalHook('afterTransformStart', (...args) => this.runLocalHooks('afterModifyTransformStart', ...args));
    this.transformation.addLocalHook('beforeTransformEnd', (...args) => this.runLocalHooks('beforeModifyTransformEnd', ...args));
    this.transformation.addLocalHook('afterTransformEnd', (...args) => this.runLocalHooks('afterModifyTransformEnd', ...args));
    this.transformation.addLocalHook('insertRowRequire', (...args) => this.runLocalHooks('insertRowRequire', ...args));
    this.transformation.addLocalHook('insertColRequire', (...args) => this.runLocalHooks('insertColRequire', ...args));
  }

  /**
   * Get data layer for current selection.
   *
   * @return {SelectionRange}
   */
  getSelectedRange() {
    return this.selectedRange;
  }

  /**
   * Set indication of what table header is currently selected.
   *
   * @param {Boolean} [rows=false] Indication for row header.
   * @param {Boolean} [cols=false] Indication for column header.
   * @param {Boolean} [corner=false] Indication for corner.
   */
  setSelectedHeaders(rows = false, cols = false, corner = false) {
    this.selectedHeader.rows = rows;
    this.selectedHeader.cols = cols;
    this.selectedHeader.corner = corner;
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
   * @returns {Boolean}
   */
  isInProgress() {
    return this.inProgress;
  }

  /**
   * Starts selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {Boolean} [keepEditorOpened=false] If `true`, cell editor will be still opened after changing selection range.
   * @param {Boolean} [multipleSelection] If `true`, selection will be worked in 'multiple' mode. This option works
   *                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined
   *                                      the default trigger will be used (isPressedCtrlKey() helper).
   */
  setRangeStart(coords, keepEditorOpened = false, multipleSelection) {
    const isMultipleMode = this.settings.selectionMode === 'multiple';
    const isMultipleSelection = isUndefined(multipleSelection) ? isPressedCtrlKey() : multipleSelection;

    this.runLocalHooks('beforeSetRangeStart', coords);

    if (!isMultipleMode || (isMultipleMode && !isMultipleSelection)) {
      this.selectedRange.clear();
    }

    this.selectedRange.add(coords);
    this.setRangeEnd(coords, null, keepEditorOpened);
  }

  /**
   * Starts selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {Boolean} [multipleSelection] If `true`, selection will be worked in 'multiple' mode. This option works
   *                                      only when 'selectionMode' is set as 'multiple'. If the argument is not defined
   *                                      the default trigger will be used (isPressedCtrlKey() helper).
   */
  setRangeStartOnly(coords, multipleSelection) {
    const isMultipleMode = this.settings.selectionMode === 'multiple';
    const isMultipleSelection = isUndefined(multipleSelection) ? isPressedCtrlKey() : multipleSelection;

    this.runLocalHooks('beforeSetRangeStartOnly', coords);

    if (!isMultipleMode || (isMultipleMode && !isMultipleSelection)) {
      this.selectedRange.clear();
    }

    this.selectedRange.add(coords);
  }

  /**
   * Ends selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to the range end.
   * @param {Boolean} [keepEditorOpened=false] If `true`, cell editor will be still opened after changing selection range.
   */
  setRangeEnd(coords, scrollToCell = true, keepEditorOpened = false) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    this.runLocalHooks('beforeSetRangeEnd', coords);
    this.begin();

    const cellRange = this.selectedRange.current();

    if (this.settings.selectionMode !== 'single') {
      cellRange.setTo(new CellCoords(coords.row, coords.col));
    }

    // set up current selection
    this.highlight.getCell().clear();

    if (this.highlight.isEnabledFor(CELL_TYPE)) {
      this.highlight.getCell().add(this.selectedRange.current().highlight);
    }

    const highlightLayerLevel = this.selectedRange.size() - 1;

    // If the next layer level is lower than previous then clear all area and header highlights. This is the
    // indication that the new selection is performing.
    if (highlightLayerLevel < this.highlight.layerLevel) {
      arrayEach(this.highlight.getAreas(), (area) => {
        area.clear();
      });
      arrayEach(this.highlight.getHeaders(), (header) => {
        header.clear();
      });
    }

    this.highlight.useLayerLevel(highlightLayerLevel);

    const areaHighlight = this.highlight.createOrGetArea();
    const headerHighlight = this.highlight.createOrGetHeader();

    areaHighlight.clear();
    headerHighlight.clear();

    if (this.highlight.isEnabledFor(AREA_TYPE)) {
      if (this.isMultiple() || highlightLayerLevel >= 1) {
        areaHighlight
          .add(cellRange.from)
          .add(cellRange.to);

        if (highlightLayerLevel === 1) {
          // For single cell selection in the same layer, we do not create area selection to prevent blue background.
          // When non-consecutive selection is performed we have to add that missing area selection to the previous layer
          // based on previous coordinates. It only occurs when the previous selection wasn't select multiple cells.
          this.highlight
            .useLayerLevel(highlightLayerLevel - 1)
            .createOrGetArea()
            .add(this.selectedRange.previous().from);

          this.highlight.useLayerLevel(highlightLayerLevel);
        }
      }
    }

    if (this.highlight.isEnabledFor(HEADER_TYPE)) {
      if (this.settings.selectionMode === 'single') {
        headerHighlight.add(cellRange.highlight);

      } else {
        headerHighlight
          .add(cellRange.from)
          .add(cellRange.to);
      }
    }

    this.runLocalHooks('afterSetRangeEnd', coords, scrollToCell, keepEditorOpened);
  }

  /**
   * Returns information if we have a multiselection. This method check multiselection only on the latest layer of
   * the selection.
   *
   * @returns {Boolean}
   */
  isMultiple() {
    const isMultipleListener = createObjectPropListener(!this.selectedRange.current().isSingle());

    this.runLocalHooks('afterIsMultipleSelection', isMultipleListener);

    return isMultipleListener.value;
  }

  /**
   * Selects cell relative to the current cell (if possible).
   *
   * @param {Number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {Number} colDelta Columns number to move, value can be passed as negative number.
   * @param {Boolean} force If `true` the new rows/columns will be created if necessary. Otherwise, row/column will
   *                        be created according to `minSpareRows/minSpareCols` settings of Handsontable.
   * @param {Boolean} [keepEditorOpened] If `true`, cell editor will be still opened after transforming the selection.
   */
  transformStart(rowDelta, colDelta, force, keepEditorOpened) {
    const newCoords = this.transformation.transformStart(rowDelta, colDelta, force);

    this.setRangeStart(newCoords, keepEditorOpened, false);
  }

  /**
   * Sets selection end cell relative to the current selection end cell (if possible).
   *
   * @param {Number} rowDelta Rows number to move, value can be passed as negative number.
   * @param {Number} colDelta Columns number to move, value can be passed as negative number.
   */
  transformEnd(rowDelta, colDelta) {
    const newCoords = this.transformation.transformEnd(rowDelta, colDelta);

    this.setRangeEnd(newCoords, true, false);
  }

  /**
   * Returns `true` if currently there is a selection on the screen, `false` otherwise.
   *
   * @returns {Boolean}
   */
  isSelected() {
    return !this.selectedRange.isEmpty();
  }

  /**
   * Returns `true` if coords is within current selection coords. This method only checks the latest
   * layer of the selection.
   *
   * @param {CellCoords} coords Visual coordinates to check.
   * @returns {Boolean}
   */
  inInSelection(coords) {
    // TODO(budnix): This ".includes" should be checked for all layers?
    return this.isSelected() ? this.selectedRange.current().includes(coords) : false;
  }

  /**
   * Deselects all selected cells.
   */
  deselect() {
    if (!this.isSelected()) {
      return;
    }

    this.inProgress = false;
    this.selectedRange.clear();
    this.highlight.clear();

    this.runLocalHooks('afterDeselect');
  }

  /**
   * Select all cells.
   */
  selectAll() {
    if (this.settings.selectionMode === 'single') {
      return;
    }

    this.setSelectedHeaders(true, true, true);
    this.highlight.clear();
    this.setRangeStart(new CellCoords(0, 0));
    this.setRangeEnd(new CellCoords(this.tableProps.countRows() - 1, this.tableProps.countCols() - 1), false);
  }
}

mixin(Selection, localHooks);

export default Selection;
