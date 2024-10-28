import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { offset, outerHeight, outerWidth } from '../../helpers/dom/element';
import { arrayEach, arrayMap } from '../../helpers/array';
import { isEmpty } from '../../helpers/mixed';
import { getDragDirectionAndRange, DIRECTIONS, getMappedFillHandleSetting } from './utils';

Hooks.getSingleton().register('modifyAutofillRange');
Hooks.getSingleton().register('beforeAutofill');
Hooks.getSingleton().register('afterAutofill');

export const PLUGIN_KEY = 'autofill';
export const PLUGIN_PRIORITY = 20;
const SETTING_KEYS = ['fillHandle'];
const INSERT_ROW_ALTER_ACTION_NAME = 'insert_row_below';
const INTERVAL_FOR_ADDING_ROW = 200;

/* eslint-disable jsdoc/require-description-complete-sentence */

/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated using the small square in the right
 * bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring cells when you drag the small
 * square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells below when you double click the small square.
 *
 * @class Autofill
 * @plugin Autofill
 */

export class Autofill extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get SETTING_KEYS() {
    return [
      PLUGIN_KEY,
      ...SETTING_KEYS
    ];
  }

  /**
   * Specifies if adding new row started.
   *
   * @private
   * @type {boolean}
   */
  addingStarted = false;
  /**
   * Specifies if there was mouse down on the cell corner.
   *
   * @private
   * @type {boolean}
   */
  mouseDownOnCellCorner = false;
  /**
   * Specifies if mouse was dragged outside Handsontable.
   *
   * @private
   * @type {boolean}
   */
  mouseDragOutside = false;
  /**
   * Specifies how many cell levels were dragged using the handle.
   *
   * @private
   * @type {boolean}
   */
  handleDraggedCells = 0;
  /**
   * Specifies allowed directions of drag (`'horizontal'` or '`vertical`').
   *
   * @private
   * @type {string[]}
   */
  directions = [];
  /**
   * Specifies if can insert new rows if needed.
   *
   * @private
   * @type {boolean}
   */
  autoInsertRow = false;

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.hot.getSettings().fillHandle;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.mapSettings();
    this.registerEvents();

    this.addHook('afterOnCellCornerMouseDown', event => this.#onAfterCellCornerMouseDown(event));
    this.addHook('afterOnCellCornerDblClick', event => this.#onCellCornerDblClick(event));
    this.addHook('beforeOnCellMouseOver', (_, coords) => this.#onBeforeCellMouseOver(coords));

    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *  - `autofill`
   *  - [`fillHandle`](@/api/options.md#fillhandle)
   */
  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearMappedSettings();
    super.disablePlugin();
  }

  /**
   * Gets selection data.
   *
   * @private
   * @returns {object[]} Ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   */
  getSelectionData() {
    const selection = this.hot.getSelectedRangeLast();
    const { row: startRow, col: startCol } = selection.getTopStartCorner();
    const { row: endRow, col: endCol } = selection.getBottomEndCorner();

    const copyableRanges = this.hot.runHooks('modifyCopyableRange', [{
      startRow,
      startCol,
      endRow,
      endCol
    }]);
    const copyableRows = [];
    const copyableColumns = [];
    const data = [];

    arrayEach(copyableRanges, (range) => {
      for (let visualRow = range.startRow; visualRow <= range.endRow; visualRow += 1) {
        if (copyableRows.indexOf(visualRow) === -1) {
          copyableRows.push(visualRow);
        }
      }

      for (let visualColumn = range.startCol; visualColumn <= range.endCol; visualColumn += 1) {
        if (copyableColumns.indexOf(visualColumn) === -1) {
          copyableColumns.push(visualColumn);
        }
      }
    });

    arrayEach(copyableRows, (row) => {
      const rowSet = [];

      arrayEach(copyableColumns, (column) => {
        rowSet.push(this.hot.getCopyableData(row, column));
      });

      data.push(rowSet);
    });

    return data;
  }

  /**
   * Try to apply fill values to the area in fill border, omitting the selection border.
   *
   * @private
   * @returns {boolean} Reports if fill was applied.
   *
   * @fires Hooks#modifyAutofillRange
   * @fires Hooks#beforeAutofill
   * @fires Hooks#afterAutofill
   */
  fillIn() {
    if (this.hot.selection.highlight.getFill().isEmpty()) {
      return false;
    }

    // Fill area may starts or ends with invisible cell. There won't be any information about it as highlighted
    // selection store just renderable indexes (It's part of Walkontable). I extrapolate where the start or/and
    // the end is.
    const [fillStartRow, fillStartColumn, fillEndRow, fillEndColumn] =
      this.hot.selection.highlight.getFill().getVisualCorners();
    const selectionRangeLast = this.hot.getSelectedRangeLast();
    const topStartCorner = selectionRangeLast.getTopStartCorner();
    const bottomEndCorner = selectionRangeLast.getBottomEndCorner();

    this.resetSelectionOfDraggedArea();

    const cornersOfSelectedCells = [
      topStartCorner.row,
      topStartCorner.col,
      bottomEndCorner.row,
      bottomEndCorner.col,
    ];

    const cornersOfSelectionAndDragAreas = this.hot
      .runHooks(
        'modifyAutofillRange',
        [
          Math.min(topStartCorner.row, fillStartRow),
          Math.min(topStartCorner.col, fillStartColumn),
          Math.max(bottomEndCorner.row, fillEndRow),
          Math.max(bottomEndCorner.col, fillEndColumn),
        ],
        cornersOfSelectedCells
      );

    const {
      directionOfDrag,
      startOfDragCoords,
      endOfDragCoords
    } = getDragDirectionAndRange(
      cornersOfSelectedCells,
      cornersOfSelectionAndDragAreas,
      (row, column) => this.hot._createCellCoords(row, column),
    );

    if (startOfDragCoords && startOfDragCoords.row > -1 && startOfDragCoords.col > -1) {
      const selectionData = this.getSelectionData();
      const sourceRange = selectionRangeLast.clone();
      const targetRange = this.hot._createCellRange(startOfDragCoords, startOfDragCoords, endOfDragCoords);

      const beforeAutofillHookResult = this.hot.runHooks(
        'beforeAutofill',
        selectionData,
        sourceRange,
        targetRange,
        directionOfDrag
      );

      if (beforeAutofillHookResult === false) {
        this.hot.selection.highlight.getFill().clear();
        this.hot.render();

        return false;
      }

      let fillData = beforeAutofillHookResult;
      const res = beforeAutofillHookResult;

      if (
        ['up', 'left'].indexOf(directionOfDrag) > -1 &&
        !(res.length === 1 && res[0].length === 0)
      ) {
        fillData = [];

        if (directionOfDrag === 'up') {
          const dragLength = endOfDragCoords.row - startOfDragCoords.row + 1;
          const fillOffset = dragLength % res.length;

          for (let i = 0; i < dragLength; i++) {
            fillData.push(res[(i + (res.length - fillOffset)) % res.length]);
          }

        } else {
          const dragLength = endOfDragCoords.col - startOfDragCoords.col + 1;
          const fillOffset = dragLength % res[0].length;

          for (let i = 0; i < res.length; i++) {
            fillData.push([]);

            for (let j = 0; j < dragLength; j++) {
              fillData[i]
                .push(res[i][(j + (res[i].length - fillOffset)) % res[i].length]);
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
        null
      );

      this.setSelection(cornersOfSelectionAndDragAreas);
      this.hot.runHooks('afterAutofill', fillData, sourceRange, targetRange, directionOfDrag);
      this.hot.render();

    } else {
      // reset to avoid some range bug
      this.hot.view.render();
    }

    return true;
  }

  /**
   * Reduces the selection area if the handle was dragged outside of the table or on headers.
   *
   * @private
   * @param {CellCoords} coords Indexes of selection corners.
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
   * Gets the coordinates of the drag & drop borders.
   *
   * @private
   * @param {CellCoords} coordsOfSelection `CellCoords` coord object.
   * @returns {CellCoords}
   */
  getCoordsOfDragAndDropBorders(coordsOfSelection) {
    const currentSelection = this.hot.getSelectedRangeLast();
    const bottomRightCorner = currentSelection.getBottomEndCorner();
    let coords = coordsOfSelection;

    if (this.directions.includes(DIRECTIONS.vertical) && this.directions.includes(DIRECTIONS.horizontal)) {
      const topStartCorner = currentSelection.getTopStartCorner();

      if (bottomRightCorner.col <= coordsOfSelection.col || topStartCorner.col >= coordsOfSelection.col) {
        coords = this.hot._createCellCoords(bottomRightCorner.row, coordsOfSelection.col);
      }

      if (bottomRightCorner.row < coordsOfSelection.row || topStartCorner.row > coordsOfSelection.row) {
        coords = this.hot._createCellCoords(coordsOfSelection.row, bottomRightCorner.col);
      }

    } else if (this.directions.includes(DIRECTIONS.vertical)) {
      coords = this.hot._createCellCoords(coordsOfSelection.row, bottomRightCorner.col);

    } else if (this.directions.includes(DIRECTIONS.horizontal)) {
      coords = this.hot._createCellCoords(bottomRightCorner.row, coordsOfSelection.col);

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
   * Add new row.
   *
   * @private
   */
  addRow() {
    this.hot._registerTimeout(() => {
      this.hot.alter(INSERT_ROW_ALTER_ACTION_NAME, undefined, 1, `${this.pluginName}.fill`);

      this.addingStarted = false;
    }, INTERVAL_FOR_ADDING_ROW);
  }

  /**
   * Add new rows if they are needed to continue auto-filling values.
   *
   * @private
   */
  addNewRowIfNeeded() {
    if (!this.hot.selection.highlight.getFill().isEmpty() && this.addingStarted === false && this.autoInsertRow) {
      const cornersOfSelectedCells = this.hot.getSelectedLast();
      const cornersOfSelectedDragArea = this.hot.selection.highlight.getFill().getVisualCorners();
      const nrOfTableRows = this.hot.countRows();

      if (cornersOfSelectedCells[2] < nrOfTableRows - 1 && cornersOfSelectedDragArea[2] === nrOfTableRows - 1) {
        this.addingStarted = true;

        this.addRow();
      }
    }
  }

  /**
   * Get index of last adjacent filled in row.
   *
   * @private
   * @param {Array} cornersOfSelectedCells Indexes of selection corners.
   * @returns {number} Gives number greater than or equal to zero when selection adjacent can be applied.
   *                   Or -1 when selection adjacent can't be applied.
   */
  getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells) {
    const data = this.hot.getData();
    const nrOfTableRows = this.hot.countRows();
    let lastFilledInRowIndex;

    for (let rowIndex = cornersOfSelectedCells[2] + 1; rowIndex < nrOfTableRows; rowIndex++) {
      for (let columnIndex = cornersOfSelectedCells[1]; columnIndex <= cornersOfSelectedCells[3]; columnIndex++) {
        const dataInCell = data[rowIndex][columnIndex];

        if (!isEmpty(dataInCell)) {
          return -1;
        }
      }

      const dataInNextLeftCell = data[rowIndex][cornersOfSelectedCells[1] - 1];
      const dataInNextRightCell = data[rowIndex][cornersOfSelectedCells[3] + 1];

      if (!isEmpty(dataInNextLeftCell) || !isEmpty(dataInNextRightCell)) {
        lastFilledInRowIndex = rowIndex;
      }
    }

    return lastFilledInRowIndex;
  }

  /**
   * Adds a selection from the start area to the specific row index.
   *
   * @private
   * @param {Array} selectStartArea Selection area from which we start to create more comprehensive selection.
   * @param {number} rowIndex The row index into the selection will be added.
   */
  addSelectionFromStartAreaToSpecificRowIndex(selectStartArea, rowIndex) {
    this.hot.selection.highlight.getFill()
      .clear()
      .add(this.hot._createCellCoords(selectStartArea[0], selectStartArea[1]))
      .add(this.hot._createCellCoords(rowIndex, selectStartArea[3]))
      .commit();
  }

  /**
   * Sets selection based on passed corners.
   *
   * @private
   * @param {Array} cornersOfArea An array witch defines selection.
   */
  setSelection(cornersOfArea) {
    this.hot.selectCell(...arrayMap(cornersOfArea, index => Math.max(index, 0)), false, false);
  }

  /**
   * Try to select cells down to the last row in the left column and then returns if selection was applied.
   *
   * @private
   * @returns {boolean}
   */
  selectAdjacent() {
    const cornersOfSelectedCells = this.hot.getSelectedLast();
    const lastFilledInRowIndex = this.getIndexOfLastAdjacentFilledInRow(cornersOfSelectedCells);

    if (lastFilledInRowIndex === -1 || lastFilledInRowIndex === undefined) {
      return false;
    }

    this.addSelectionFromStartAreaToSpecificRowIndex(cornersOfSelectedCells, lastFilledInRowIndex);

    return true;

  }

  /**
   * Resets selection of dragged area.
   *
   * @private
   */
  resetSelectionOfDraggedArea() {
    this.handleDraggedCells = 0;

    this.hot.selection.highlight.getFill().clear();
  }

  /**
   * Redraws borders.
   *
   * @private
   * @param {CellCoords} coords `CellCoords` coord object.
   */
  redrawBorders(coords) {
    this.hot.selection.highlight.getFill()
      .clear()
      .add(this.hot.getSelectedRangeLast().from)
      .add(this.hot.getSelectedRangeLast().to)
      .add(coords)
      .commit();

    this.hot.view.render();
  }

  /**
   * Get if mouse was dragged outside.
   *
   * @private
   * @param {MouseEvent} event `mousemove` event properties.
   * @returns {boolean}
   */
  getIfMouseWasDraggedOutside(event) {
    const { documentElement } = this.hot.rootDocument;
    const tableBottom = offset(this.hot.table).top - (this.hot.rootWindow.pageYOffset ||
      documentElement.scrollTop) + outerHeight(this.hot.table);
    const tableRight = offset(this.hot.table).left - (this.hot.rootWindow.pageXOffset ||
      documentElement.scrollLeft) + outerWidth(this.hot.table);

    return event.clientY > tableBottom && event.clientX <= tableRight;
  }

  /**
   * Bind the events used by the plugin.
   *
   * @private
   */
  registerEvents() {
    const { documentElement } = this.hot.rootDocument;

    this.eventManager.addEventListener(documentElement, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(documentElement, 'mousemove', event => this.#onMouseMove(event));
  }

  /**
   * On cell corner double click callback.
   *
   * @private
   */
  #onCellCornerDblClick() {
    const selectionApplied = this.selectAdjacent();

    if (selectionApplied) {
      this.fillIn();
    }
  }

  /**
   * On after cell corner mouse down listener.
   */
  #onAfterCellCornerMouseDown() {
    this.handleDraggedCells = 1;
    this.mouseDownOnCellCorner = true;
  }

  /**
   * On before cell mouse over listener.
   *
   * @param {CellCoords} coords `CellCoords` coord object.
   */
  #onBeforeCellMouseOver(coords) {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handleDraggedCells) {
      this.handleDraggedCells += 1;

      this.showBorder(coords);
      this.addNewRowIfNeeded();
    }
  }

  /**
   * On mouse up listener.
   */
  #onMouseUp() {
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
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event) {
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
   * Clears mapped settings.
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
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
