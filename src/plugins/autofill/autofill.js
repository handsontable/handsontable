import BasePlugin from './../_base';
import Handsontable from './../../browser';
import {offset, outerHeight, outerWidth} from './../../helpers/dom/element';
import {eventManager as eventManagerObject} from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {WalkontableCellCoords} from './../../3rdparty/walkontable/src/cell/coords';
import {getDeltas, getDragDirectionAndRange, DIRECTIONS, getMappedFillHandleSetting} from './utils';

const INSERT_ROW_ALTER_ACTION_NAME = 'insert_row';
const INTERVAL_FOR_ADDING_ROW = 200;

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

    this.mappedSettings = {};
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().fillHandle;
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
    this.addHook('afterOnCellCornerDblClick', (event) => this.onCellCornerDblClick(event));
    this.addHook('beforeOnCellMouseOver', (event, coords, TD) => this.onBeforeCellMouseOver(coords));

    super.enablePlugin();
  }

  /**
   * Update plugin for this Handsontable instance.
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    this.mappedSettings = getMappedFillHandleSetting(this.hot.getSettings().fillHandle);
    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.mappedSettings = {};
    super.disablePlugin();
  }

  /**
   * Get selection data
   *
   * @returns {Array} Array with the data.
   */
  getSelectionData() {
    const selRange = {
      from: this.hot.getSelectedRange().from,
      to: this.hot.getSelectedRange().to,
    };

    return this.hot.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);
  }

  /**
   * Try to apply fill values to the area in fill border, omitting the selection border
   *
   * @returns {Boolean} reports if fill was applied
   */
  fillIn() {
    if (this.hot.view.wt.selections.fill.isEmpty()) {
      return false;
    }

    const cornersOfSelectionAndDragAreas = this.hot.view.wt.selections.fill.getCorners();
    this.resetSelectionOfDraggedArea();

    const cornersOfSelectedCells = this.getCornersOfSelectedCells();
    const {directionOfDrag, startOfDragCoords, endOfDragCoords} = getDragDirectionAndRange(cornersOfSelectedCells, cornersOfSelectionAndDragAreas);

    this.hot.runHooks('modifyAutofillRange', cornersOfSelectedCells, cornersOfSelectionAndDragAreas);

    if (startOfDragCoords && startOfDragCoords.row > -1 && startOfDragCoords.col > -1) {

      const selectionData = this.getSelectionData();
      const deltas = getDeltas(startOfDragCoords, endOfDragCoords, selectionData, directionOfDrag);

      this.hot.runHooks('beforeAutofill', startOfDragCoords, endOfDragCoords, selectionData);

      this.hot.populateFromArray(
        startOfDragCoords.row,
        startOfDragCoords.col,
        selectionData,
        endOfDragCoords.row,
        endOfDragCoords.col,
        'autofill',
        null,
        directionOfDrag,
        deltas
      );

      this.setSelection(cornersOfSelectionAndDragAreas);

    } else {
      // reset to avoid some range bug
      this.hot.selection.refreshBorders();
    }
    return true;
  }

  /**
   * Show fill border
   *
   * @private
   * @param {WalkontableCellCoords} coords `WalkontableCellCoords` coord object.
   */
  showBorder(coords) {
    const topLeft = this.hot.getSelectedRange().getTopLeftCorner();
    const bottomRight = this.hot.getSelectedRange().getBottomRightCorner();
    const directions = this.mappedSettings.directions;

    if (directions.includes(DIRECTIONS.vertical) && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
      coords = new WalkontableCellCoords(coords.row, bottomRight.col);

    } else if (directions.includes(DIRECTIONS.horizontal)) {
      coords = new WalkontableCellCoords(bottomRight.row, coords.col);

    } else {
      // wrong direction
      return;
    }

    this.redrawBorders(coords);
  }

  /**
   * Adds new row
   *
   * @private
   */
  addRow() {
    this.hot._registerTimeout(setTimeout(() => {
      this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME);
      this.addingStarted = false;
    }, INTERVAL_FOR_ADDING_ROW));
  }

  /**
   * Adds new rows if they are needed to continue auto-filling values
   *
   * @private
   */
  addNewRowIfNeeded() {
    const autoInsertRowOptionWasSet = this.mappedSettings.autoInsertRow;

    if (this.hot.view.wt.selections.fill.cellRange && this.addingStarted === false && autoInsertRowOptionWasSet) {
      const cornersOfSelectedCells = this.hot.getSelected();
      const cornersOfSelectedDragArea = this.hot.view.wt.selections.fill.getCorners();
      const nrOfTableRows = this.hot.countRows();

      if (cornersOfSelectedCells[2] < nrOfTableRows - 1 && cornersOfSelectedDragArea[2] === nrOfTableRows - 1) {

        this.addingStarted = true;
        this.addRow();
      }
    }
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
   * @param {Array} cornersOfSelectedCells
   * @returns {Number} gives number greater than or equal to zero when selection adjacent can be applied
   * or -1 when selection adjacent can't be applied
   */
  getIndexOfLastLeftFilledInRow(cornersOfSelectedCells) {
    const data = this.hot.getData();
    const nrOfTableRows = this.hot.countRows();
    let lastFilledInRowIndex;

    for (let rowIndex = cornersOfSelectedCells[2] + 1; rowIndex < nrOfTableRows; rowIndex++) {
      for (let columnIndex = cornersOfSelectedCells[1]; columnIndex <= cornersOfSelectedCells[3]; columnIndex++) {
        const dataInCell = data[rowIndex][columnIndex];

        if (dataInCell) {
          return -1;
        }
      }

      const dataInNextLeftCell = data[rowIndex][cornersOfSelectedCells[1] - 1];
      const dataInNextRightCell = data[rowIndex][cornersOfSelectedCells[3] + 1];

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
   * @param {Array} selectStartArea selection area from which we start to create more comprehensive selection
   * @param {Number} rowIndex
   */
  addSelectionFromStartAreaToSpecificRowIndex (selectStartArea, rowIndex) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(
      selectStartArea[0],
      selectStartArea[1])
    );
    this.hot.view.wt.selections.fill.add(new WalkontableCellCoords(
      rowIndex,
      selectStartArea[3])
    );
  }

  /**
   * Set selection based on passed corners
   *
   * @private
   * @param {Array} cornersOfArea
   */
  setSelection(cornersOfArea) {
    this.hot.selection.setRangeStart(new WalkontableCellCoords(
      cornersOfArea[0],
      cornersOfArea[1])
    );
    this.hot.selection.setRangeEnd(new WalkontableCellCoords(
      cornersOfArea[2],
      cornersOfArea[3])
    );
  }

  /**
   * Try to select cells down to the last row in the left column and then returns if selection was applied
   *
   * @private
   * @returns {Boolean}
   */
  selectAdjacent() {
    const cornersOfSelectedCells = this.getCornersOfSelectedCells();
    const lastFilledInRowIndex = this.getIndexOfLastLeftFilledInRow(cornersOfSelectedCells);

    if (lastFilledInRowIndex === -1) {
      return false;
    } else {
      this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);
      return true;
    }
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
   * Redraw borders
   *
   * @private
   * @param {WalkontableCellCoords} coords `WalkontableCellCoords` coord object.
   */
  redrawBorders(coords) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().from);
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().to);
    this.hot.view.wt.selections.fill.add(coords);
    this.hot.view.render();
  }

  /**
   * Get if mouse was dragged outside
   *
   * @private
   * @param {Event} event
   * @returns {Boolean}
   */
  getIfMouseWasDraggedOutside(event) {
    const tableBottom = offset(this.hot.table).top - (window.pageYOffset ||
      document.documentElement.scrollTop) + outerHeight(this.hot.table);
    const tableRight = offset(this.hot.table).left - (window.pageXOffset ||
      document.documentElement.scrollLeft) + outerWidth(this.hot.table);

    return event.clientY > tableBottom && event.clientX <= tableRight;
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(document.documentElement, 'mouseup', () => this.onMouseUp());
    this.eventManager.addEventListener(document.documentElement, 'mousemove', (event) => this.onMouseMove(event));
  }

  /**
   * On cell corner double click
   *
   * @private
   */
  onCellCornerDblClick() {
    const selectionApplied = this.selectAdjacent();

    if (selectionApplied) {
      this.fillIn();
    }
  }

  /**
   * On after cell corner mouse down listener.
   *
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
   * @param {WalkontableCellCoords} coords `WalkontableCellCoords` coord object.
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
        this.fillIn();
      }
      this.handle.isDragged = 0;
      this.mouseDownOnCellCorner = false;
    }
  }

  /**
   * On mouse move listener.
   *
   * @private
   * @param {Event} event
   */
  onMouseMove(event) {
    const autoInsertRowOptionWasSet = this.mappedSettings.autoInsertRow;
    const mouseWasDraggedOutside = this.getIfMouseWasDraggedOutside(event);

    if (this.addingStarted === false && this.handle.isDragged > 0 && mouseWasDraggedOutside) {
      this.mouseDragOutside = true;
      this.addingStarted = true;

    } else {
      this.mouseDragOutside = false;
    }

    if (this.mouseDragOutside && autoInsertRowOptionWasSet) {
      this.addRow();
    }
  }

  /**
   * On after plugins initialized
   *
   * @private
   */
  onAfterPluginsInitialized() {
    this.mappedSettings = getMappedFillHandleSetting(this.hot.getSettings().fillHandle);
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
Handsontable.hooks.register('modifyAutofillRange');
Handsontable.hooks.register('beforeAutofill');
