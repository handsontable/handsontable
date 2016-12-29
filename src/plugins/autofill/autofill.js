import BasePlugin from './../_base';
import {offset, outerHeight, outerWidth} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords';
import {getDeltas, settingsFactory, getDirectionAndRange} from './utils';
import {isObject} from './../../helpers/object';
import {SELECTION_ROW_FROM_INDEX, SELECTION_COLUMN_FROM_INDEX, SELECTION_ROW_TO_INDEX, SELECTION_COLUMN_TO_INDEX} from './utils';

const privatePool = new WeakMap();

const INSERT_ROW_ALTER_ACTION_NAME = 'insert_row';
const INTERVAL_FOR_ADDING_ROW = 200;

const DIRECTIONS = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated
 * using the small square in the right bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring
 * cells when you drag the small square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells
 * below when you double click the small square.
 *
 * @class Autofill
 * @plugin Autofill
 */

class Autofill extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    this.eventManager = eventManagerObject(this);
    this.addingStarted = false;
    this.mouseDownOnCellCorner = false;
    this.mouseDragOutside = false;
    this.handle = {
      isDragged: 0
    };

    privatePool.set(this, {
      settings: settingsFactory(this.hot.getSettings().fillHandle)
    });
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document, 'mouseup', () => this.onMouseUp());
    this.eventManager.addEventListener(document, 'mousemove', (event) => this.onMouseMove(event));
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().fillHandle === true ||
      DIRECTIONS.hasOwnProperty(this.hot.getSettings().fillHandle) ||
      isObject(this.hot.getSettings().fillHandle);
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.registerEvents();

    this.addHook('afterOnCellCornerMouseDown', (event) => this.onAfterCellCornerMouseDown(event));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD) => this.onBeforeCellMouseOver(coords));
    this.addHook('init', () => {
      this.hot.view.wt.wtSettings.settings.onCellCornerDblClick = () => {
        this.selectAdjacent();
      };
    });

    super.enablePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    super.disablePlugin();
  }

  /**
   * Get corners of selected cells.
   *
   * @private
   * @returns {Array}
   */
  getCornersOfSelectedCells() {
    if (this.hot.selection.isMultiple()) {
      return this.hot.view.wt.selections.area.getCorners();

    } else {
      return this.hot.view.wt.selections.current.getCorners();
    }
  }

  /**
   * Get index of last left filled in row
   *
   * @private
   * @returns {*}
   * @param cornersOfSelectedCells
   */

  getIndexOfLastLeftFilledInRow(cornersOfSelectedCells) {
    const data = this.hot.getData();
    const nrOfTableRows = this.hot.countRows();
    let lastFilledInRowIndex;

    for (let rowIndex = cornersOfSelectedCells[SELECTION_ROW_TO_INDEX] + 1; rowIndex < nrOfTableRows; rowIndex++) {
      for (let columnIndex = cornersOfSelectedCells[SELECTION_COLUMN_FROM_INDEX]; columnIndex <= cornersOfSelectedCells[SELECTION_COLUMN_TO_INDEX]; columnIndex++) {
        const dataInCell = data[rowIndex][columnIndex];

        if (dataInCell) {
          return;
        }
      }

      const dataInNextLeftCell = data[rowIndex][cornersOfSelectedCells[SELECTION_COLUMN_FROM_INDEX] - 1];
      const dataInNextRightCell = data[rowIndex][cornersOfSelectedCells[SELECTION_COLUMN_TO_INDEX] + 1];

      if (!!dataInNextLeftCell || !!dataInNextRightCell) {
        lastFilledInRowIndex = rowIndex;
      }
    }
    return lastFilledInRowIndex;
  }

  /**
   * Add selection from start area to specific row index
   *
   * @private
   * @param startArea
   * @param rowIndex
   */

  addSelectionFromStartAreaToSpecificRowIndex (startArea, rowIndex) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(
      startArea[SELECTION_ROW_FROM_INDEX],
      startArea[SELECTION_COLUMN_FROM_INDEX])
    );
    this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(
      rowIndex,
      startArea[SELECTION_COLUMN_TO_INDEX])
    );
  }

  /**
   * Selects cells down to the last row in the left column, then fills down to that cell
   *
   * @function selectAdjacent
   * @memberof Autofill#
   */
  selectAdjacent() {
    const cornersOfSelectedCells = this.getCornersOfSelectedCells();
    const lastFilledInRowIndex = this.getIndexOfLastLeftFilledInRow(cornersOfSelectedCells);

    if (lastFilledInRowIndex) {
      this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);
      this.apply();
    }
  }

  /**
   * Set selection based on passed corners
   *
   * @private
   * @param cornersOfArea
   */

  setSelection(cornersOfArea) {
    this.hot.selection.setRangeStart(new WalkontableCellCoords(
      cornersOfArea[SELECTION_ROW_FROM_INDEX],
      cornersOfArea[SELECTION_COLUMN_FROM_INDEX])
    );
    this.hot.selection.setRangeEnd(new WalkontableCellCoords(
      cornersOfArea[SELECTION_ROW_TO_INDEX],
      cornersOfArea[SELECTION_COLUMN_TO_INDEX])
    );
  }

  /**
   * Reset selection of dragged area
   *
   * @private
   */

  resetSelectionOfDraggedArea() {
    this.handle.isDragged = 0;
    this.hot.view.wt.selections.fill.clear();
  }

  /**
   * Get selection data
   *
   * @returns {*|string|Array}
   */

  getSelectionData() {
    const selRange = {
      from: this.hot.getSelectedRange().from,
      to: this.hot.getSelectedRange().to,
    };

    return this.hot.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
  }

  /**
   * Apply fill values to the area in fill border, omitting the selection border
   *
   * @function apply
   * @memberof Autofill#
   */
  apply() {
    if (this.hot.view.wt.selections.fill.isEmpty()) {
      return;
    }

    const cornersOfSelectedDragArea = this.hot.view.wt.selections.fill.getCorners();
    this.resetSelectionOfDraggedArea();

    const cornersOfSelectedCells = this.getCornersOfSelectedCells();
    const {direction, start, end} = getDirectionAndRange(cornersOfSelectedCells, cornersOfSelectedDragArea);

    this.hot.runHooks('afterAutofillApplyValues', cornersOfSelectedCells, cornersOfSelectedDragArea);

    if (start && start.row > -1 && start.col > -1) {

      const data = this.getSelectionData();
      const deltas = getDeltas(start, end, data, direction);

      this.hot.runHooks('beforeAutofill', start, end, data);

      this.hot.populateFromArray(start.row, start.col, data, end.row, end.col, 'autofill', null, direction, deltas);
      this.setSelection(cornersOfSelectedDragArea);

    } else {
      // reset to avoid some range bug
      this.hot.selection.refreshBorders();
    }
  }

  /**
   * Redraw borders
   *
   * @private
   * @param coords
   */

  redrawBorders(coords) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().from);
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().to);
    this.hot.view.wt.selections.fill.add(coords);
    this.hot.view.render();
  }

  /**
   * Show fill border
   *
   * @function showBorder
   * @memberof Autofill#
   * @param {WalkontableCellCoords} coords `WalkontableCellCoords` coord object.
   */
  showBorder(coords) {
    const topLeft = this.hot.getSelectedRange().getTopLeftCorner();
    const bottomRight = this.hot.getSelectedRange().getBottomRightCorner();
    const priv = privatePool.get(this);

    if (priv.settings('direction') !== DIRECTIONS.horizontal && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
      coords = new WalkontableCellCoords(coords.row, bottomRight.col);

    } else if (priv.settings('direction') !== DIRECTIONS.vertical) { // jscs:ignore disallowNotOperatorsInConditionals
      coords = new WalkontableCellCoords(bottomRight.row, coords.col);

    } else {
      // wrong direction
      return;
    }

    this.redrawBorders(coords);
  }

  /**
   * Adds new rows if they are needed to continue auto-filling values
   * @function addNewRowIfNeeded
   * @memberof Autofill#
   */
  addNewRowIfNeeded() {
    const priv = privatePool.get(this);

    if (this.hot.view.wt.selections.fill.cellRange && this.addingStarted === false && priv.settings('autoInsertRow')) {
      const cornersOfSelectedCells = this.hot.getSelected();
      const cornersOfSelectedDragArea = this.hot.view.wt.selections.fill.getCorners();
      const nrOfTableRows = this.hot.countRows();

      if (cornersOfSelectedCells[SELECTION_ROW_TO_INDEX] < nrOfTableRows - 1 &&
        cornersOfSelectedDragArea[SELECTION_ROW_TO_INDEX] === nrOfTableRows - 1) {

        this.addingStarted = true;

        this.hot._registerTimeout(setTimeout(() => {
          this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME);
          this.addingStarted = false;
        }, INTERVAL_FOR_ADDING_ROW));
      }
    }
  }

  /**
   * On after cell corner mouse down listener.
   * @private
   */

  onAfterCellCornerMouseDown() {
    this.handle.isDragged = 1;
    this.mouseDownOnCellCorner = true;
  }

  /**
   * On before cell mouse over listener.
   *
   * @private
   * @param coords
   */

  onBeforeCellMouseOver(coords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handle.isDragged) {
      this.handle.isDragged++;
      this.showBorder(coords);
      this.addNewRowIfNeeded();
    }
  }

  /**
   * On mouse up listener.
   *
   * @private
   */

  onMouseUp() {
    if (this.handle.isDragged) {
      if (this.handle.isDragged > 1) {
        this.apply();
      }
      this.handle.isDragged = 0;
      this.mouseDownOnCellCorner = false;
    }
  }

  /**
   * Get if mouse was dragged outside
   *
   * @private
   * @param event
   * @returns {boolean}
   */

  getIfMouseWasDraggedOutside(event) {
    const tableBottom = offset(this.hot.table).top - (window.pageYOffset ||
      document.documentElement.scrollTop) + outerHeight(this.hot.table);
    const tableRight = offset(this.hot.table).left - (window.pageXOffset ||
      document.documentElement.scrollLeft) + outerWidth(this.hot.table);

    return event.clientY > tableBottom && event.clientX <= tableRight;
  }

  /**
   * On mouse move listener.
   *
   * @private
   * @param event
   */

  onMouseMove(event) {
    const priv = privatePool.get(this);
    const mouseWasDraggedOutside = this.getIfMouseWasDraggedOutside(event);

    if (this.addingStarted === false && this.handle.isDragged > 0 && mouseWasDraggedOutside) {
      this.mouseDragOutside = true;
      this.addingStarted = true;

    } else {
      this.mouseDragOutside = false;
    }

    if (this.mouseDragOutside && priv.settings('autoInsertRow')) {
      setTimeout(() => {
        this.addingStarted = false;
        this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME);
      }, INTERVAL_FOR_ADDING_ROW);
    }
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

export {Autofill};

registerPlugin('autofill', Autofill);
