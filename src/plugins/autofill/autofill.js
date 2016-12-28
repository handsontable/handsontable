import BasePlugin from './../_base';
import {offset, outerHeight, outerWidth} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords';
import {getDeltas, settingsFactory, getDirectionAndRange} from './utils';
import {isObject} from './../../helpers/object';

const privatePool = new WeakMap();

const SELECTION_ROW_FROM_INDEX = 0;
const SELECTION_COLUMN_FROM_INDEX = 1;
const SELECTION_ROW_TO_INDEX = 2;
const SELECTION_COLUMN_TO_INDEX = 3;

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
      isDragged: 0,
      disabled: false
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
   * Selects cells down to the last row in the left column, then fills down to that cell
   *
   * @function selectAdjacent
   * @memberof Autofill#
   */
  selectAdjacent() {
    let cornersOfSelectedCells, lastFilledInRowIndex;
    const data = this.hot.getData();
    const nrOfTableRows = this.hot.countRows();

    if (this.hot.selection.isMultiple()) {
      cornersOfSelectedCells = this.hot.view.wt.selections.area.getCorners();

    } else {
      cornersOfSelectedCells = this.hot.view.wt.selections.current.getCorners();
    }

    for (let rowIndex = cornersOfSelectedCells[SELECTION_ROW_TO_INDEX] + 1; rowIndex < nrOfTableRows; rowIndex++) {
      for (let columnIndex = cornersOfSelectedCells[SELECTION_COLUMN_FROM_INDEX]; columnIndex <= cornersOfSelectedCells[SELECTION_COLUMN_TO_INDEX]; columnIndex++) {
        let dataInCell = data[rowIndex][columnIndex];

        if (dataInCell) {
          return;
        }
      }

      let dataInNextLeftCell = data[rowIndex][cornersOfSelectedCells[SELECTION_COLUMN_FROM_INDEX] - 1];
      let dataInNextRightCell = data[rowIndex][cornersOfSelectedCells[SELECTION_COLUMN_TO_INDEX] + 1];

      if (!!dataInNextLeftCell || !!dataInNextRightCell) {
        lastFilledInRowIndex = rowIndex;
      }
    }

    if (lastFilledInRowIndex) {
      this.hot.view.wt.selections.fill.clear();
      this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(cornersOfSelectedCells[SELECTION_ROW_FROM_INDEX], cornersOfSelectedCells[SELECTION_COLUMN_FROM_INDEX]));
      this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(lastFilledInRowIndex, cornersOfSelectedCells[SELECTION_COLUMN_TO_INDEX]));
      this.apply();
    }
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
    let cornersOfSelectedCells;

    this.handle.isDragged = 0;
    this.hot.view.wt.selections.fill.clear();

    if (this.hot.selection.isMultiple()) {
      cornersOfSelectedCells = this.hot.view.wt.selections.area.getCorners();
    } else {
      cornersOfSelectedCells = this.hot.view.wt.selections.current.getCorners();
    }

    const {direction, start, end} = getDirectionAndRange(cornersOfSelectedCells, cornersOfSelectedDragArea);

    this.hot.runHooks('afterAutofillApplyValues', cornersOfSelectedCells, cornersOfSelectedDragArea);

    if (start && start.row > -1 && start.col > -1) {
      const selRange = {
        from: this.hot.getSelectedRange().from,
        to: this.hot.getSelectedRange().to,
      };

      const data = this.hot.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
      const deltas = getDeltas(start, end, data, direction);

      this.hot.runHooks('beforeAutofill', start, end, data);
      this.hot.populateFromArray(start.row, start.col, data, end.row, end.col, 'autofill', null, direction, deltas);

      this.hot.selection.setRangeStart(new WalkontableCellCoords(cornersOfSelectedDragArea[SELECTION_ROW_FROM_INDEX], cornersOfSelectedDragArea[SELECTION_COLUMN_FROM_INDEX]));
      this.hot.selection.setRangeEnd(new WalkontableCellCoords(cornersOfSelectedDragArea[SELECTION_ROW_TO_INDEX], cornersOfSelectedDragArea[SELECTION_COLUMN_TO_INDEX]));

    } else {
      // reset to avoid some range bug
      this.hot.selection.refreshBorders();
    }
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
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().from);
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().to);
    this.hot.view.wt.selections.fill.add(coords);
    this.hot.view.render();
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

  onAfterCellCornerMouseDown() {
    this.handle.isDragged = 1;
    this.mouseDownOnCellCorner = true;
  }

  onBeforeCellMouseOver(coords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handle.isDragged) {
      this.handle.isDragged++;
      this.showBorder(coords);
      this.addNewRowIfNeeded();
    }
  }

  onMouseUp() {
    if (this.handle.isDragged) {
      if (this.handle.isDragged > 1) {
        this.apply();
      }
      this.handle.isDragged = 0;
      this.mouseDownOnCellCorner = false;
    }
  }

  getIfMouseDraggedOutside(event) {
    let tableBottom = offset(this.hot.table).top - (window.pageYOffset ||
      document.documentElement.scrollTop) + outerHeight(this.hot.table);
    let tableRight = offset(this.hot.table).left - (window.pageXOffset ||
      document.documentElement.scrollLeft) + outerWidth(this.hot.table);

    return event.clientY > tableBottom && event.clientX <= tableRight;
  }

  onMouseMove(event) {
    const priv = privatePool.get(this);
    const mouseDraggedOutside = this.getIfMouseDraggedOutside(event);

    if (this.addingStarted === false && this.handle.isDragged > 0 && mouseDraggedOutside) {
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
