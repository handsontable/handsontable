import Highlight from './highlight/highlight';
import SelectionRange from './range';
import {CellRange, CellCoords} from './../3rdparty/walkontable/src';
import {isPressed} from './../utils/keyStateObserver';
import {createObjectPropListener, mixin} from './../helpers/object';
import {addClass, removeClass} from './../helpers/dom/element';
import {arrayEach} from './../helpers/array';
import localHooks from './../mixins/localHooks';
import Transformation from './transformation';

class Selection {
  constructor(settings, tableProps) {
    this.settings = settings;
    this.tableProps = tableProps;
    this.inProgress = false;
    this.selectedHeader = {
      cols: false,
      rows: false,
      corner: false,
    };

    this.selectedRange = new SelectionRange();
    this.highlight = new Highlight({
      headerClassName: settings.currentHeaderClassName,
      rowClassName: settings.currentRowClassName,
      columnClassName: settings.currentColClassName,
      cellCornerVisible: () => this.settings.fillHandle && !this.tableProps.isEditorOpened() && !this.isMultiple(),
      areaCornerVisible: () => this.settings.fillHandle && !this.tableProps.isEditorOpened() && this.isMultiple(),
    });
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

  getSelectedRange() {
    return this.selectedRange;
  }

  /**
   * @param {Boolean} [rows=false]
   * @param {Boolean} [cols=false]
   * @param {Boolean} [corner=false]
   */
  setSelectedHeaders(rows = false, cols = false, corner = false) {
    this.selectedHeader.rows = rows;
    this.selectedHeader.cols = cols;
    this.selectedHeader.corner = corner;
  }

  /**
   * Sets inProgress to `true`. This enables onSelectionEnd and onSelectionEndByProp to function as desired.
   */
  begin() {
    this.inProgress = true;
  }

  /**
   * Sets inProgress to `false`. Triggers onSelectionEnd and onSelectionEndByProp.
   */
  finish() {
    this.runLocalHooks('afterSelectionFinished', this.selectedRange);
    this.inProgress = false;
  }

  /**
   * @returns {Boolean}
   */
  isInProgress() {
    return this.inProgress;
  }

  /**
   * Starts selection range on given coordinate object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param keepEditorOpened
   */
  setRangeStart(coords, keepEditorOpened) {
    if (!isPressed('COMMAND_LEFT')) {
      this.selectedRange.clear();
    }

    this.runLocalHooks('beforeSetRangeStart', coords);
    this.selectedRange.add(coords);

    this.setRangeEnd(coords, null, keepEditorOpened);
  }

  /**
   * Starts selection range on given td object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param keepEditorOpened
   */
  setRangeStartOnly(coords) {
    if (!isPressed('COMMAND_LEFT')) {
      this.selectedRange.clear();
    }

    this.runLocalHooks('beforeSetRangeStartOnly', coords);
    this.selectedRange.add(coords);
  }

  /**
   * Ends selection range on given td object.
   *
   * @param {CellCoords} coords Visual coords.
   * @param {Boolean} [scrollToCell=true] If `true`, viewport will be scrolled to range end
   * @param {Boolean} [keepEditorOpened] If `true`, cell editor will be still opened after changing selection range
   */
  setRangeEnd(coords, scrollToCell = true, keepEditorOpened = false) {
    if (this.selectedRange.isEmpty()) {
      return;
    }

    this.runLocalHooks('beforeSetRangeEnd', coords);
    this.begin();

    const cellRange = this.selectedRange.current();

    cellRange.setTo(new CellCoords(coords.row, coords.col));

    if (!this.settings.multiSelect) {
      cellRange.setFrom(coords);
    }

    let disableVisualSelection = this.settings.disableVisualSelection;

    if (typeof disableVisualSelection === 'string') {
      disableVisualSelection = [disableVisualSelection];
    }

    // set up current selection
    this.highlight.getCell().clear();

    if (disableVisualSelection === false ||
        Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('current') === -1) {
      this.highlight.getCell().add(this.selectedRange.current().highlight);
    }

    const highlightLayerLevel = this.selectedRange.size() - 1;

    // If the next layer level is lower than previous then clear all area and header highlights. The new
    // selection is performing.
    if (highlightLayerLevel < this.highlight.layerLevel) {
      arrayEach(this.highlight.getAreas(), (area) => {
        area.clear();
      });
      arrayEach(this.highlight.getHeaders(), (header) => {
        header.clear();
      });
    }

    this.highlight.useLayerLevel(highlightLayerLevel);

    this.highlight.getArea().clear();
    this.highlight.getHeader().clear();

    if ((disableVisualSelection === false ||
        Array.isArray(disableVisualSelection) && disableVisualSelection.indexOf('area') === -1) && this.isMultiple()) {
      this.highlight.getArea()
        .add(cellRange.from)
        .add(cellRange.to);
    }
    this.highlight.getHeader()
      .add(cellRange.from)
      .add(cellRange.to);

    this.runLocalHooks('afterSetRangeEnd', coords, scrollToCell, keepEditorOpened);
  }

  /**
   * Returns information if we have a multiselection.
   *
   * @returns {Boolean}
   */
  isMultiple() {
    const isMultipleListener = createObjectPropListener(!this.selectedRange.current().isSingle());

    this.runLocalHooks('afterIsMultipleSelection', isMultipleListener);

    return isMultipleListener.value;
  }

  /**
   * Selects cell relative to current cell (if possible).
   */
  transformStart(rowDelta, colDelta, force, keepEditorOpened) {
    const newCoords = this.transformation.transformStart(rowDelta, colDelta, force);

    this.setRangeStart(newCoords, keepEditorOpened);
  }

  /**
   * Sets selection end cell relative to current selection end cell (if possible).
   */
  transformEnd(rowDelta, colDelta) {
    const newCoords = this.transformation.transformEnd(rowDelta, colDelta);

    this.setRangeEnd(newCoords, true);
  }

  /**
   * Returns `true` if currently there is a selection on screen, `false` otherwise.
   *
   * @returns {Boolean}
   */
  isSelected() {
    return !this.selectedRange.isEmpty();
  }

  /**
   * Returns `true` if coords is within current selection coords.
   *
   * @param {CellCoords} coords
   * @returns {Boolean}
   */
  inInSelection(coords) {
    if (!this.isSelected()) {
      return false;
    }

    // TODO(budnix): `includes` in all ranges need to be implemented not only current one.
    return this.selectedRange.current().includes(coords);
  }

  /**
   * Deselects all selected cells
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
   * Select all cells
   */
  selectAll() {
    if (!this.settings.multiSelect) {
      return;
    }
    this.setSelectedHeaders(true, true, true);
    this.setRangeStart(new CellCoords(0, 0));
    this.setRangeEnd(new CellCoords(this.tableProps.countRows() - 1, this.tableProps.countCols() - 1), false);
  }
}

mixin(Selection, localHooks);

export default Selection;
