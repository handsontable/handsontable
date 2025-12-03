import { BasePlugin } from '../base';
import { Hooks } from '../../core/hooks';
import { offset, outerHeight, outerWidth } from '../../helpers/dom/element';
import { isObject } from '../../helpers/object';
import { arrayEach, arrayMap } from '../../helpers/array';
import { isEmpty } from '../../helpers/mixed';
import {
  getDragDirectionAndRange,
  getCellCoordsFromMousePosition,
} from './utils';
import { DIRECTIONS } from './constants';

Hooks.getSingleton().register('modifyAutofillRange');
Hooks.getSingleton().register('beforeAutofill');
Hooks.getSingleton().register('afterAutofill');

export const PLUGIN_KEY = 'autofill';
export const PLUGIN_PRIORITY = 20;
const SETTING_KEY = 'fillHandle';
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
      SETTING_KEY,
    ];
  }

  static get PLUGIN_OPTION_KEY() {
    return SETTING_KEY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      direction: undefined,
      autoInsertRow: true,
    };
  }

  static get SETTINGS_VALIDATORS() {
    return {
      direction: value => value === undefined || Object.values(DIRECTIONS).includes(value),
      autoInsertRow: value => typeof value === 'boolean',
    };
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
   * Specifies the current drag direction ('vertical', 'horizontal', or null).
   *
   * @private
   * @type {string|null}
   */
  #currentDragDirection = null;

  /**
   * Checks if the plugin is enabled in the Handsontable settings.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this.hot.getSettings()[SETTING_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    const settings = this.hot.getSettings()[SETTING_KEY];
    const pluginSettings = {};

    if (typeof settings === 'string') {
      pluginSettings.direction = settings;
    }

    this.updatePluginSettings(pluginSettings);

    if (this.getSetting('direction')) {
      this.directions = [this.getSetting('direction')];
    } else {
      this.directions = Object.values(DIRECTIONS);
    }

    this.autoInsertRow = this.getSetting('autoInsertRow');

    if (this.directions.length === 1 && this.directions.includes('horizontal')) {
      this.autoInsertRow = false;
    }

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
   * @param {boolean} [useSource=false] If `true`, returns copyable source data instead of copyable data.
   * @returns {object[]} Ranges Array of objects with properties `startRow`, `startCol`, `endRow` and `endCol`.
   */
  getSelectionData(useSource = false) {
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
        const sourceDataAtSource = useSource ? this.hot.getSourceDataAtCell(row, column) : null;

        if (useSource && isObject(sourceDataAtSource)) {
          rowSet.push(this.hot.getCopyableSourceData(row, column));

        } else {
          rowSet.push(this.hot.getCopyableData(row, column));
        }

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
      const selectionSourceData = this.getSelectionData(true);
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

      // If the source data contains objects, we need to check every target cell for the data type.
      if (selectionSourceData.some(row => row.some(cell => isObject(cell)))) {
        const fullFillData = this.#extendFillDataWithSourceData(
          fillData,
          selectionSourceData,
          startOfDragCoords,
          endOfDragCoords,
          directionOfDrag,
        );

        if (fullFillData.length) {
          fillData = fullFillData;
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
   * @param {CellCoords} cellCoords `CellCoords` coord object.
   */
  redrawBorders(cellCoords) {
    const allowedDirections = this.directions;
    const lastRange = this.hot.getSelectedRangeLast();
    const highlight = lastRange.getBottomEndCorner();
    const topStartCorner = lastRange.getTopStartCorner();
    const bottomEndCorner = lastRange.getBottomEndCorner();

    const rowChanged = cellCoords.row < topStartCorner.row || cellCoords.row > bottomEndCorner.row;
    const colChanged = cellCoords.col < topStartCorner.col || cellCoords.col > bottomEndCorner.col;
    const isAtHighlightPosition = lastRange.includes(cellCoords);

    if (isAtHighlightPosition) {
      this.#currentDragDirection = null;
    }

    if (this.#currentDragDirection === 'vertical' && !rowChanged && colChanged) {
      if (allowedDirections.includes('horizontal')) {
        this.#currentDragDirection = 'horizontal';
      }

    } else if (this.#currentDragDirection === 'horizontal' && !colChanged && rowChanged) {
      if (allowedDirections.includes('vertical')) {
        this.#currentDragDirection = 'vertical';
      }
    }

    let toRow = highlight.row;
    let toCol = highlight.col;

    if (this.#currentDragDirection === null) {
      if (rowChanged && !colChanged && allowedDirections.includes('vertical')) {
        this.#currentDragDirection = 'vertical';

      } else if (colChanged && !rowChanged && allowedDirections.includes('horizontal')) {
        this.#currentDragDirection = 'horizontal';
      }
    }

    if (this.#currentDragDirection === 'vertical' && allowedDirections.includes('vertical')) {
      toRow = cellCoords.row;
      toCol = topStartCorner.col;

    } else if (this.#currentDragDirection === 'horizontal' && allowedDirections.includes('horizontal')) {
      toRow = topStartCorner.row;
      toCol = cellCoords.col;
    }

    const to = this.hot._createCellCoords(toRow, toCol);

    // console.log('to', to);

    this.hot.selection.highlight.getFill()
      .clear()
      .add(lastRange.from)
      .add(lastRange.to)
      .add(to)
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
   * Extends the fill data with the source data based on the content of the target cells.
   *
   * @param {Array} fillData The fill data to extend.
   * @param {Array} selectionSourceData The source data to extend the fill data with.
   * @param {CellCoords} startOfDragCoords The start of the drag area.
   * @param {CellCoords} endOfDragCoords The end of the drag area.
   * @returns {Array} The extended fill data.
   */
  #extendFillDataWithSourceData(fillData, selectionSourceData, startOfDragCoords, endOfDragCoords) {
    const fullFillData = [];

    for (
      let rowIndex = Math.min(startOfDragCoords.row, endOfDragCoords.row);
      rowIndex <= Math.max(startOfDragCoords.row, endOfDragCoords.row);
      rowIndex += 1
    ) {
      fullFillData.push([]);

      for (
        let columnIndex = Math.min(startOfDragCoords.col, endOfDragCoords.col);
        columnIndex <= Math.max(startOfDragCoords.col, endOfDragCoords.col);
        columnIndex += 1
      ) {
        const sourceCell = this.hot.getSourceDataAtCell(rowIndex, columnIndex);
        const relativeRowIndex = rowIndex - Math.min(startOfDragCoords.row, endOfDragCoords.row);
        const relativeColumnIndex = columnIndex - Math.min(startOfDragCoords.col, endOfDragCoords.col);
        const modRelativeRowIndex = relativeRowIndex % selectionSourceData.length;
        const modRelativeColumnIndex = relativeColumnIndex % selectionSourceData[0].length;

        if (isObject(sourceCell)) {
          fullFillData[relativeRowIndex][relativeColumnIndex] =
            selectionSourceData[modRelativeRowIndex][modRelativeColumnIndex];

        } else {
          fullFillData[relativeRowIndex][relativeColumnIndex] = fillData[modRelativeRowIndex][modRelativeColumnIndex];
        }
      }
    }

    return fullFillData;
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
    this.#currentDragDirection = null;
  }

  /**
   * On before cell mouse over listener.
   */
  #onBeforeCellMouseOver() {
    if (this.mouseDownOnCellCorner && !this.hot.view.isMouseDown() && this.handleDraggedCells) {
      this.handleDraggedCells += 1;

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
      this.#currentDragDirection = null;
    }
  }

  /**
   * On mouse move listener.
   *
   * @param {MouseEvent} event `mousemove` event properties.
   */
  #onMouseMove(event) {
    if (this.mouseDownOnCellCorner) {
      const { clientX, clientY } = event;
      const cellCoords = getCellCoordsFromMousePosition(this.hot, clientX, clientY);

      this.redrawBorders(cellCoords);
    }

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
   * Destroys the plugin instance.
   */
  destroy() {
    super.destroy();
  }
}
