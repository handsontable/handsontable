import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import {offset, outerHeight, outerWidth} from './../../helpers/dom/element';
import EventManager from './../../eventManager';
import {registerPlugin} from './../../plugins';
import {CellCoords} from './../../3rdparty/walkontable/src';
import {getDeltas, getDragDirectionAndRange, DIRECTIONS, getMappedFillHandleSetting} from './utils';

Hooks.getSingleton().register('modifyAutofillRange');
Hooks.getSingleton().register('beforeAutofill');

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
    /**
     * Event manager
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Specifies if adding new row started.
     *
     * @type {Boolean}
     */
    this.addingStarted = false;
    /**
     * Specifies if there was mouse down on the cell corner.
     *
     * @type {Boolean}
     */
    this.mouseDownOnCellCorner = false;
    /**
     * Specifies if mouse was dragged outside Handsontable.
     *
     * @type {Boolean}
     */
    this.mouseDragOutside = false;
    /**
     * Specifies how many cell levels were dragged using the handle.
     *
     * @type {Boolean}
     */
    this.handleDraggedCells = 0;
    /**
     * Specifies allowed directions of drag.
     *
     * @type {Array}
     */
    this.directions = [];
    /**
     * Specifies if can insert new rows if needed.
     *
     * @type {Boolean}
     */
    this.autoInsertRow = false;
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

    this.mapSettings();
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
    super.updatePlugin();
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    this.clearMappedSettings();
    super.disablePlugin();
  }

  /**
   * Get selection data
   *
   * @private
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
   * Try to apply fill values to the area in fill border, omitting the selection border.
   *
   * @private
   * @returns {Boolean} reports if fill was applied.
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
      let fillData = selectionData;

      this.hot.runHooks('beforeAutofill', startOfDragCoords, endOfDragCoords, selectionData);

      if (['up', 'left'].indexOf(directionOfDrag) > -1) {
        fillData = [];

        let dragLength = null;
        let fillOffset = null;

        if (directionOfDrag === 'up') {
          dragLength = endOfDragCoords.row - startOfDragCoords.row + 1;
          fillOffset = dragLength % selectionData.length;

          for (let i = 0; i < dragLength; i++) {
            fillData.push(selectionData[(i + (selectionData.length - fillOffset)) % selectionData.length]);
          }

        } else {
          dragLength = endOfDragCoords.col - startOfDragCoords.col + 1;
          fillOffset = dragLength % selectionData[0].length;

          for (let i = 0; i < selectionData.length; i++) {
            fillData.push([]);
            for (let j = 0; j < dragLength; j++) {
              fillData[i].push(selectionData[i][(j + (selectionData[i].length - fillOffset)) % selectionData[i].length]);
            }
          }
        }
      }

      this.hot.populateFromArray(
        startOfDragCoords.row,
        startOfDragCoords.col,
        fillData,
        endOfDragCoords.row,
        endOfDragCoords.col,
        `${this.pluginName}.fill`,
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
   * Reduce the selection area if the handle was dragged outside of the table or on headers.
   *
   * @private
   * @param {CellCoords} coords indexes of selection corners.
   * @returns {CellCoords}
   */
  reduceSelectionAreaIfNeeded(coords) {
    if (coords.row < 0) {
      coords.row = 0;
    }

    if (coords.col < 0) {
      coords.col = 0;
    }
    return coords;
  }

  /**
   * Get the coordinates of the drag & drop borders.
   *
   * @private
   * @param {CellCoords} coordsOfSelection `CellCoords` coord object.
   * @returns {Array}
   */

  getCoordsOfDragAndDropBorders(coordsOfSelection) {
    const topLeftCorner = this.hot.getSelectedRange().getTopLeftCorner();
    const bottomRightCorner = this.hot.getSelectedRange().getBottomRightCorner();
    let coords;

    if (this.directions.includes(DIRECTIONS.vertical) &&
      (bottomRightCorner.row < coordsOfSelection.row || topLeftCorner.row > coordsOfSelection.row)) {
      coords = new CellCoords(coordsOfSelection.row, bottomRightCorner.col);

    } else if (this.directions.includes(DIRECTIONS.horizontal)) {
      coords = new CellCoords(bottomRightCorner.row, coordsOfSelection.col);

    } else {
      // wrong direction
      return;
    }

    return this.reduceSelectionAreaIfNeeded(coords);
  }

  /**
   * Show the fill border.
   *
   * @private
   * @param {CellCoords} coordsOfSelection `CellCoords` coord object.
   */
  showBorder(coordsOfSelection) {
    const coordsOfDragAndDropBorders = this.getCoordsOfDragAndDropBorders(coordsOfSelection);

    if (coordsOfDragAndDropBorders) {
      this.redrawBorders(coordsOfDragAndDropBorders);
    }
  }

  /**
   * Add new row
   *
   * @private
   */
  addRow() {
    this.hot._registerTimeout(setTimeout(() => {
      this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME, void 0, 1, `${this.pluginName}.fill`);

      this.addingStarted = false;
    }, INTERVAL_FOR_ADDING_ROW));
  }

  /**
   * Add new rows if they are needed to continue auto-filling values.
   *
   * @private
   */
  addNewRowIfNeeded() {
    if (this.hot.view.wt.selections.fill.cellRange && this.addingStarted === false && this.autoInsertRow) {
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

    }
    return this.hot.view.wt.selections.current.getCorners();

  }

  /**
   * Get index of last adjacent filled in row
   *
   * @private
   * @param {Array} cornersOfSelectedCells indexes of selection corners.
   * @returns {Number} gives number greater than or equal to zero when selection adjacent can be applied.
   * or -1 when selection adjacent can't be applied
   */
  getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells) {
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
   * Add a selection from the start area to the specific row index.
   *
   * @private
   * @param {Array} selectStartArea selection area from which we start to create more comprehensive selection.
   * @param {Number} rowIndex
   */
  addSelectionFromStartAreaToSpecificRowIndex(selectStartArea, rowIndex) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(new CellCoords(
      selectStartArea[0],
      selectStartArea[1])
    );
    this.hot.view.wt.selections.fill.add(new CellCoords(
      rowIndex,
      selectStartArea[3])
    );
  }

  /**
   * Set selection based on passed corners.
   *
   * @private
   * @param {Array} cornersOfArea
   */
  setSelection(cornersOfArea) {
    this.hot.selection.setRangeStart(new CellCoords(
      cornersOfArea[0],
      cornersOfArea[1])
    );
    this.hot.selection.setRangeEnd(new CellCoords(
      cornersOfArea[2],
      cornersOfArea[3])
    );
  }

  /**
   * Try to select cells down to the last row in the left column and then returns if selection was applied.
   *
   * @private
   * @returns {Boolean}
   */
  selectAdjacent() {
    const cornersOfSelectedCells = this.getCornersOfSelectedCells();
    const lastFilledInRowIndex = this.getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells);

    if (lastFilledInRowIndex === -1) {
      return false;

    }
    this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);

    return true;

  }

  /**
   * Reset selection of dragged area.
   *
   * @private
   */
  resetSelectionOfDraggedArea() {
    this.handleDraggedCells = 0;

    this.hot.view.wt.selections.fill.clear();
  }

  /**
   * Redraw borders.
   *
   * @private
   * @param {CellCoords} coords `CellCoords` coord object.
   */
  redrawBorders(coords) {
    this.hot.view.wt.selections.fill.clear();
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().from);
    this.hot.view.wt.selections.fill.add(this.hot.getSelectedRange().to);
    this.hot.view.wt.selections.fill.add(coords);
    this.hot.view.render();
  }

  /**
   * Get if mouse was dragged outside.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
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
   * On cell corner double click callback.
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
    this.handleDraggedCells = 1;
    this.mouseDownOnCellCorner = true;
  }

  /**
   * On before cell mouse over listener.
   *
   * @private
   * @param {CellCoords} coords `CellCoords` coord object.
   */
  onBeforeCellMouseOver(coords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handleDraggedCells) {
      this.handleDraggedCells++;

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
    if (this.handleDraggedCells) {
      if (this.handleDraggedCells > 1) {
        this.fillIn();
      }

      this.handleDraggedCells = 0;
      this.mouseDownOnCellCorner = false;
    }
  }

  /**
   * On mouse move listener.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   */
  onMouseMove(event) {
    const mouseWasDraggedOutside = this.getIfMouseWasDraggedOutside(event);

    if (this.addingStarted === false && this.handleDraggedCells > 0 && mouseWasDraggedOutside) {
      this.mouseDragOutside = true;
      this.addingStarted = true;

    } else {
      this.mouseDragOutside = false;
    }

    if (this.mouseDragOutside && this.autoInsertRow) {
      this.addRow();
    }
  }

  /**
   * Clear mapped settings.
   *
   * @private
   */
  clearMappedSettings() {
    this.directions.length = 0;
    this.autoInsertRow = false;
  }

  /**
   * Map settings.
   *
   * @private
   */
  mapSettings() {
    const mappedSettings = getMappedFillHandleSetting(this.hot.getSettings().fillHandle);
    this.directions = mappedSettings.directions;
    this.autoInsertRow = mappedSettings.autoInsertRow;
  }

  /**
   * Destroy plugin instance.
   */
  destroy() {
    super.destroy();
  }
}

registerPlugin('autofill', Autofill);

export default Autofill;
