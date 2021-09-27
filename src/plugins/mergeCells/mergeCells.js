import { BasePlugin } from '../base';
import Hooks from '../../pluginHooks';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { CellCoords, CellRange } from '../../3rdparty/walkontable/src';
import MergedCellsCollection from './cellsCollection';
import MergedCellCoords from './cellCoords';
import AutofillCalculations from './calculations/autofill';
import SelectionCalculations from './calculations/selection';
import toggleMergeItem from './contextMenuItem/toggleMerge';
import { arrayEach } from '../../helpers/array';
import { isObject, clone } from '../../helpers/object';
import { warn } from '../../helpers/console';
import { rangeEach } from '../../helpers/number';
import { applySpanProperties } from './utils';
import './mergeCells.css';

Hooks.getSingleton().register('beforeMergeCells');
Hooks.getSingleton().register('afterMergeCells');
Hooks.getSingleton().register('beforeUnmergeCells');
Hooks.getSingleton().register('afterUnmergeCells');

export const PLUGIN_KEY = 'mergeCells';
export const PLUGIN_PRIORITY = 150;
const privatePool = new WeakMap();

/**
 * @plugin MergeCells
 * @class MergeCells
 *
 * @description
 * Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).
 *
 * @example
 *
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *  data: getData(),
 *  mergeCells: [
 *    {row: 0, col: 3, rowspan: 3, colspan: 3},
 *    {row: 2, col: 6, rowspan: 2, colspan: 2},
 *    {row: 4, col: 8, rowspan: 3, colspan: 3}
 *  ],
 * ```
 */
export class MergeCells extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  constructor(hotInstance) {
    super(hotInstance);

    privatePool.set(this, {
      lastDesiredCoords: null
    });

    /**
     * A container for all the merged cells.
     *
     * @private
     * @type {MergedCellsCollection}
     */
    this.mergedCellsCollection = null;
    /**
     * Instance of the class responsible for all the autofill-related calculations.
     *
     * @private
     * @type {AutofillCalculations}
     */
    this.autofillCalculations = null;
    /**
     * Instance of the class responsible for the selection-related calculations.
     *
     * @private
     * @type {SelectionCalculations}
     */
    this.selectionCalculations = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link MergeCells#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.mergedCellsCollection = new MergedCellsCollection(this);
    this.autofillCalculations = new AutofillCalculations(this);
    this.selectionCalculations = new SelectionCalculations(this);

    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('beforeKeyDown', (...args) => this.onBeforeKeyDown(...args));
    this.addHook('modifyTransformStart', (...args) => this.onModifyTransformStart(...args));
    this.addHook('afterModifyTransformStart', (...args) => this.onAfterModifyTransformStart(...args));
    this.addHook('modifyTransformEnd', (...args) => this.onModifyTransformEnd(...args));
    this.addHook('modifyGetCellCoords', (...args) => this.onModifyGetCellCoords(...args));
    this.addHook('beforeSetRangeStart', (...args) => this.onBeforeSetRangeStart(...args));
    this.addHook('beforeSetRangeStartOnly', (...args) => this.onBeforeSetRangeStart(...args));
    this.addHook('beforeSetRangeEnd', (...args) => this.onBeforeSetRangeEnd(...args));
    this.addHook('afterIsMultipleSelection', (...args) => this.onAfterIsMultipleSelection(...args));
    this.addHook('afterRenderer', (...args) => this.onAfterRenderer(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.addMergeActionsToContextMenu(...args));
    this.addHook('afterGetCellMeta', (...args) => this.onAfterGetCellMeta(...args));
    this.addHook('afterViewportRowCalculatorOverride',
      (...args) => this.onAfterViewportRowCalculatorOverride(...args));
    this.addHook('afterViewportColumnCalculatorOverride',
      (...args) => this.onAfterViewportColumnCalculatorOverride(...args));
    this.addHook('modifyAutofillRange', (...args) => this.onModifyAutofillRange(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterChange', (...args) => this.onAfterChange(...args));
    this.addHook('beforeDrawBorders', (...args) => this.onBeforeDrawAreaBorders(...args));
    this.addHook('afterDrawSelection', (...args) => this.onAfterDrawSelection(...args));
    this.addHook('beforeRemoveCellClassNames', (...args) => this.onBeforeRemoveCellClassNames(...args));
    this.addHook('beforeUndoStackChange', (action, source) => {
      if (source === 'MergeCells') {
        return false;
      }
    });

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.clearCollections();
    this.hot.render();
    super.disablePlugin();
  }

  /**
   * Updates the plugin state. This method is executed when {@link Core#updateSettings} is invoked.
   */
  updatePlugin() {
    const settings = this.hot.getSettings()[PLUGIN_KEY];

    this.disablePlugin();
    this.enablePlugin();

    this.generateFromSettings(settings);

    super.updatePlugin();
  }

  /**
   * Validates a single setting object, represented by a single merged cell information object.
   *
   * @private
   * @param {object} setting An object with `row`, `col`, `rowspan` and `colspan` properties.
   * @returns {boolean}
   */
  validateSetting(setting) {
    let valid = true;

    if (!setting) {
      return false;
    }

    if (MergedCellCoords.containsNegativeValues(setting)) {
      warn(MergedCellCoords.NEGATIVE_VALUES_WARNING(setting));

      valid = false;

    } else if (MergedCellCoords.isOutOfBounds(setting, this.hot.countRows(), this.hot.countCols())) {
      warn(MergedCellCoords.IS_OUT_OF_BOUNDS_WARNING(setting));

      valid = false;

    } else if (MergedCellCoords.isSingleCell(setting)) {
      warn(MergedCellCoords.IS_SINGLE_CELL(setting));

      valid = false;

    } else if (MergedCellCoords.containsZeroSpan(setting)) {
      warn(MergedCellCoords.ZERO_SPAN_WARNING(setting));

      valid = false;
    }

    return valid;
  }

  /**
   * Generates the merged cells from the settings provided to the plugin.
   *
   * @private
   * @param {Array|boolean} settings The settings provided to the plugin.
   */
  generateFromSettings(settings) {
    if (Array.isArray(settings)) {
      let populationArgumentsList = [];

      arrayEach(settings, (setting) => {
        if (!this.validateSetting(setting)) {
          return;
        }

        const highlight = new CellCoords(setting.row, setting.col);
        const rangeEnd = new CellCoords(setting.row + setting.rowspan - 1, setting.col + setting.colspan - 1);
        const mergeRange = new CellRange(highlight, highlight, rangeEnd);

        populationArgumentsList.push(this.mergeRange(mergeRange, true, true));
      });

      // remove 'empty' setting objects, caused by improper merge range declarations
      populationArgumentsList = populationArgumentsList.filter(value => value !== true);

      const bulkPopulationData = this.getBulkCollectionData(populationArgumentsList);

      this.hot.populateFromArray(...bulkPopulationData);
    }
  }

  /**
   * Generates a bulk set of all the data to be populated to fill the data "under" the added merged cells.
   *
   * @private
   * @param {Array} populationArgumentsList Array in a form of `[row, column, dataUnderCollection]`.
   * @returns {Array} Array in a form of `[row, column, dataOfAllCollections]`.
   */
  getBulkCollectionData(populationArgumentsList) {
    const populationDataRange = this.getBulkCollectionDataRange(populationArgumentsList);
    const dataAtRange = this.hot.getData(...populationDataRange);
    const newDataAtRange = dataAtRange.splice(0);

    arrayEach(populationArgumentsList, (mergedCellArguments) => {
      const [mergedCellRowIndex, mergedCellColumnIndex, mergedCellData] = mergedCellArguments;

      arrayEach(mergedCellData, (mergedCellRow, rowIndex) => {
        arrayEach(mergedCellRow, (mergedCellElement, columnIndex) => {
          newDataAtRange[mergedCellRowIndex - populationDataRange[0] + rowIndex][mergedCellColumnIndex - populationDataRange[1] + columnIndex] = mergedCellElement; // eslint-disable-line max-len
        });
      });
    });

    return [populationDataRange[0], populationDataRange[1], newDataAtRange];
  }

  /**
   * Gets the range of combined data ranges provided in a form of an array of arrays ([row, column, dataUnderCollection]).
   *
   * @private
   * @param {Array} populationArgumentsList Array containing argument lists for the `populateFromArray` method - row, column and data for population.
   * @returns {Array[]} Start and end coordinates of the merged cell range. (in a form of [rowIndex, columnIndex]).
   */
  getBulkCollectionDataRange(populationArgumentsList) {
    const start = [0, 0];
    const end = [0, 0];
    let mergedCellRow = null;
    let mergedCellColumn = null;
    let mergedCellData = null;

    arrayEach(populationArgumentsList, (mergedCellArguments) => {
      mergedCellRow = mergedCellArguments[0];
      mergedCellColumn = mergedCellArguments[1];
      mergedCellData = mergedCellArguments[2];

      start[0] = Math.min(mergedCellRow, start[0]);
      start[1] = Math.min(mergedCellColumn, start[1]);
      end[0] = Math.max(mergedCellRow + mergedCellData.length - 1, end[0]);
      end[1] = Math.max(mergedCellColumn + mergedCellData[0].length - 1, end[1]);
    });

    return [...start, ...end];
  }

  /**
   * Clears the merged cells from the merged cell container.
   */
  clearCollections() {
    this.mergedCellsCollection.clear();
  }

  /**
   * Returns `true` if a range is mergeable.
   *
   * @private
   * @param {object} newMergedCellInfo Merged cell information object to test.
   * @param {boolean} [auto=false] `true` if triggered at initialization.
   * @returns {boolean}
   */
  canMergeRange(newMergedCellInfo, auto = false) {
    return auto ? true : this.validateSetting(newMergedCellInfo);
  }

  /**
   * Merge or unmerge, based on last selected range.
   *
   * @private
   */
  toggleMergeOnSelection() {
    const currentRange = this.hot.getSelectedRangeLast();

    if (!currentRange) {
      return;
    }

    currentRange.setDirection('NW-SE');

    const { from, to } = currentRange;

    this.toggleMerge(currentRange);
    this.hot.selectCell(from.row, from.col, to.row, to.col, false);
  }

  /**
   * Merges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  mergeSelection(cellRange = this.hot.getSelectedRangeLast()) {
    if (!cellRange) {
      return;
    }

    cellRange.setDirection('NW-SE');

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);
    this.mergeRange(cellRange);
    this.hot.selectCell(from.row, from.col, to.row, to.col, false);
  }

  /**
   * Unmerges the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  unmergeSelection(cellRange = this.hot.getSelectedRangeLast()) {
    if (!cellRange) {
      return;
    }

    const { from, to } = cellRange;

    this.unmergeRange(cellRange, true);
    this.hot.selectCell(from.row, from.col, to.row, to.col, false);
  }

  /**
   * Merges cells in the provided cell range.
   *
   * @private
   * @param {CellRange} cellRange Cell range to merge.
   * @param {boolean} [auto=false] `true` if is called automatically, e.g. At initialization.
   * @param {boolean} [preventPopulation=false] `true`, if the method should not run `populateFromArray` at the end, but rather return its arguments.
   * @returns {Array|boolean} Returns an array of [row, column, dataUnderCollection] if preventPopulation is set to true. If the the merging process went successful, it returns `true`, otherwise - `false`.
   * @fires Hooks#beforeMergeCells
   * @fires Hooks#afterMergeCells
   */
  mergeRange(cellRange, auto = false, preventPopulation = false) {
    const topLeft = cellRange.getTopLeftCorner();
    const bottomRight = cellRange.getBottomRightCorner();
    const mergeParent = {
      row: topLeft.row,
      col: topLeft.col,
      rowspan: bottomRight.row - topLeft.row + 1,
      colspan: bottomRight.col - topLeft.col + 1
    };
    const clearedData = [];
    let populationInfo = null;

    if (!this.canMergeRange(mergeParent, auto)) {
      return false;
    }

    this.hot.runHooks('beforeMergeCells', cellRange, auto);

    rangeEach(0, mergeParent.rowspan - 1, (i) => {
      rangeEach(0, mergeParent.colspan - 1, (j) => {
        let clearedValue = null;

        if (!clearedData[i]) {
          clearedData[i] = [];
        }

        if (i === 0 && j === 0) {
          clearedValue = this.hot.getDataAtCell(mergeParent.row, mergeParent.col);

        } else {
          this.hot.setCellMeta(mergeParent.row + i, mergeParent.col + j, 'hidden', true);
        }

        clearedData[i][j] = clearedValue;
      });
    });

    this.hot.setCellMeta(mergeParent.row, mergeParent.col, 'spanned', true);

    const mergedCellAdded = this.mergedCellsCollection.add(mergeParent);

    if (mergedCellAdded) {
      if (preventPopulation) {
        populationInfo = [mergeParent.row, mergeParent.col, clearedData];

      } else {
        this.hot.populateFromArray(mergeParent.row, mergeParent.col, clearedData, void 0, void 0, this.pluginName);
      }

      this.hot.runHooks('afterMergeCells', cellRange, mergeParent, auto);

      return populationInfo;
    }

    return true;
  }

  /**
   * Unmerges the selection provided as a cell range. If no cell range is provided, it uses the current selection.
   *
   * @private
   * @param {CellRange} cellRange Selection cell range.
   * @param {boolean} [auto=false] `true` if called automatically by the plugin.
   *
   * @fires Hooks#beforeUnmergeCells
   * @fires Hooks#afterUnmergeCells
   */
  unmergeRange(cellRange, auto = false) {
    const mergedCells = this.mergedCellsCollection.getWithinRange(cellRange);

    if (!mergedCells) {
      return;
    }

    this.hot.runHooks('beforeUnmergeCells', cellRange, auto);

    arrayEach(mergedCells, (currentCollection) => {
      this.mergedCellsCollection.remove(currentCollection.row, currentCollection.col);

      rangeEach(0, currentCollection.rowspan - 1, (i) => {
        rangeEach(0, currentCollection.colspan - 1, (j) => {
          this.hot.removeCellMeta(currentCollection.row + i, currentCollection.col + j, 'hidden');
        });
      });

      this.hot.removeCellMeta(currentCollection.row, currentCollection.col, 'spanned');
    });

    this.hot.runHooks('afterUnmergeCells', cellRange, auto);
    this.hot.render();
  }

  /**
   * Merges or unmerges, based on the cell range provided as `cellRange`.
   *
   * @private
   * @param {CellRange} cellRange The cell range to merge or unmerged.
   */
  toggleMerge(cellRange) {
    const mergedCell = this.mergedCellsCollection.get(cellRange.from.row, cellRange.from.col);
    const mergedCellCoversWholeRange = mergedCell.row === cellRange.from.row &&
      mergedCell.col === cellRange.from.col &&
      mergedCell.row + mergedCell.rowspan - 1 === cellRange.to.row &&
      mergedCell.col + mergedCell.colspan - 1 === cellRange.to.col;

    if (mergedCellCoversWholeRange) {
      this.unmergeRange(cellRange);

    } else {
      this.mergeSelection(cellRange);
    }
  }

  /**
   * Merges the specified range.
   *
   * @param {number} startRow Start row of the merged cell.
   * @param {number} startColumn Start column of the merged cell.
   * @param {number} endRow End row of the merged cell.
   * @param {number} endColumn End column of the merged cell.
   * @fires Hooks#beforeMergeCells
   * @fires Hooks#afterMergeCells
   */
  merge(startRow, startColumn, endRow, endColumn) {
    const start = new CellCoords(startRow, startColumn);
    const end = new CellCoords(endRow, endColumn);

    this.mergeRange(new CellRange(start, start, end));
  }

  /**
   * Unmerges the merged cell in the provided range.
   *
   * @param {number} startRow Start row of the merged cell.
   * @param {number} startColumn Start column of the merged cell.
   * @param {number} endRow End row of the merged cell.
   * @param {number} endColumn End column of the merged cell.
   * @fires Hooks#beforeUnmergeCells
   * @fires Hooks#afterUnmergeCells
   */
  unmerge(startRow, startColumn, endRow, endColumn) {
    const start = new CellCoords(startRow, startColumn);
    const end = new CellCoords(endRow, endColumn);

    this.unmergeRange(new CellRange(start, start, end));
  }

  /**
   * `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.generateFromSettings(this.hot.getSettings()[PLUGIN_KEY]);
    this.hot.render();
  }

  /**
   * `beforeKeyDown` hook callback.
   *
   * @private
   * @param {KeyboardEvent} event The `keydown` event object.
   */
  onBeforeKeyDown(event) {
    const ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown && event.keyCode === 77) { // CTRL + M
      this.toggleMerge(this.hot.getSelectedRangeLast());

      this.hot.render();
      stopImmediatePropagation(event);
    }
  }

  /**
   * Modifies the information on whether the current selection contains multiple cells. The `afterIsMultipleSelection` hook callback.
   *
   * @private
   * @param {boolean} isMultiple Determines whether the current selection contains multiple cells.
   * @returns {boolean}
   */
  onAfterIsMultipleSelection(isMultiple) {
    if (isMultiple) {
      const mergedCells = this.mergedCellsCollection.mergedCells;
      const selectionRange = this.hot.getSelectedRangeLast();

      for (let group = 0; group < mergedCells.length; group += 1) {
        if (selectionRange.from.row === mergedCells[group].row &&
          selectionRange.from.col === mergedCells[group].col &&
          selectionRange.to.row === mergedCells[group].row + mergedCells[group].rowspan - 1 &&
          selectionRange.to.col === mergedCells[group].col + mergedCells[group].colspan - 1) {
          return false;
        }
      }
    }

    return isMultiple;
  }

  /**
   * `modifyTransformStart` hook callback.
   *
   * @private
   * @param {object} delta The transformation delta.
   */
  onModifyTransformStart(delta) {
    const priv = privatePool.get(this);
    const currentlySelectedRange = this.hot.getSelectedRangeLast();
    let newDelta = {
      row: delta.row,
      col: delta.col,
    };
    let nextPosition = null;
    const currentPosition = new CellCoords(currentlySelectedRange.highlight.row, currentlySelectedRange.highlight.col);
    const mergedParent = this.mergedCellsCollection.get(currentPosition.row, currentPosition.col);

    if (!priv.lastDesiredCoords) {
      priv.lastDesiredCoords = new CellCoords(null, null);
    }

    if (mergedParent) { // only merge selected
      const mergeTopLeft = new CellCoords(mergedParent.row, mergedParent.col);
      const mergeBottomRight = new CellCoords(
        mergedParent.row + mergedParent.rowspan - 1,
        mergedParent.col + mergedParent.colspan - 1
      );
      const mergeRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

      if (!mergeRange.includes(priv.lastDesiredCoords)) {
        priv.lastDesiredCoords = new CellCoords(null, null); // reset outdated version of lastDesiredCoords
      }

      newDelta.row = priv.lastDesiredCoords.row ? priv.lastDesiredCoords.row - currentPosition.row : newDelta.row;
      newDelta.col = priv.lastDesiredCoords.col ? priv.lastDesiredCoords.col - currentPosition.col : newDelta.col;

      if (delta.row > 0) { // moving down
        newDelta.row = mergedParent.row + mergedParent.rowspan - 1 - currentPosition.row + delta.row;

      } else if (delta.row < 0) { // moving up
        newDelta.row = currentPosition.row - mergedParent.row + delta.row;
      }

      if (delta.col > 0) { // moving right
        newDelta.col = mergedParent.col + mergedParent.colspan - 1 - currentPosition.col + delta.col;

      } else if (delta.col < 0) { // moving left
        newDelta.col = currentPosition.col - mergedParent.col + delta.col;
      }
    }

    nextPosition = new CellCoords(
      currentlySelectedRange.highlight.row + newDelta.row,
      currentlySelectedRange.highlight.col + newDelta.col
    );

    const nextPositionMergedCell = this.mergedCellsCollection.get(nextPosition.row, nextPosition.col);

    if (nextPositionMergedCell) { // skipping the invisible cells in the merge range
      const firstRenderableCoords = this.mergedCellsCollection.getFirstRenderableCoords(
        nextPositionMergedCell.row,
        nextPositionMergedCell.col
      );

      priv.lastDesiredCoords = nextPosition;

      newDelta = {
        row: firstRenderableCoords.row - currentPosition.row,
        col: firstRenderableCoords.col - currentPosition.col
      };
    }

    if (newDelta.row !== 0) {
      delta.row = newDelta.row;
    }
    if (newDelta.col !== 0) {
      delta.col = newDelta.col;
    }
  }

  /**
   * `modifyTransformEnd` hook callback. Needed to handle "jumping over" merged merged cells, while selecting.
   *
   * @private
   * @param {object} delta The transformation delta.
   */
  onModifyTransformEnd(delta) {
    const currentSelectionRange = this.hot.getSelectedRangeLast();
    const newDelta = clone(delta);
    const newSelectionRange = this.selectionCalculations.getUpdatedSelectionRange(currentSelectionRange, delta);
    let tempDelta = clone(newDelta);

    const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(newSelectionRange, true);

    do {
      tempDelta = clone(newDelta);
      this.selectionCalculations.getUpdatedSelectionRange(currentSelectionRange, newDelta);

      arrayEach(mergedCellsWithinRange, (mergedCell) => {
        this.selectionCalculations.snapDelta(newDelta, currentSelectionRange, mergedCell);
      });

    } while (newDelta.row !== tempDelta.row || newDelta.col !== tempDelta.col);

    delta.row = newDelta.row;
    delta.col = newDelta.col;
  }

  /**
   * `modifyGetCellCoords` hook callback. Swaps the `getCell` coords with the merged parent coords.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} column Visual column index.
   * @returns {Array|undefined} Visual coordinates of the merge.
   */
  onModifyGetCellCoords(row, column) {
    if (row < 0 || column < 0) {
      return;
    }

    const mergeParent = this.mergedCellsCollection.get(row, column);

    if (!mergeParent) {
      return;
    }

    const { row: mergeRow, col: mergeColumn, colspan, rowspan } = mergeParent;

    return [
      // Most top-left merged cell coords.
      mergeRow, mergeColumn,
      // Most bottom-right merged cell coords.
      mergeRow + rowspan - 1,
      mergeColumn + colspan - 1];
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @private
   * @param {object} defaultOptions The default context menu options.
   */
  addMergeActionsToContextMenu(defaultOptions) {
    defaultOptions.items.push(
      {
        name: '---------',
      },
      toggleMergeItem(this)
    );
  }

  /**
   * `afterRenderer` hook callback.
   *
   * @private
   * @param {HTMLElement} TD The cell to be modified.
   * @param {number} row Row index.
   * @param {number} col Visual column index.
   */
  onAfterRenderer(TD, row, col) {
    const mergedCell = this.mergedCellsCollection.get(row, col);
    // We shouldn't override data in the collection.
    const mergedCellCopy = isObject(mergedCell) ? clone(mergedCell) : void 0;

    if (isObject(mergedCellCopy)) {
      const { rowIndexMapper: rowMapper, columnIndexMapper: columnMapper } = this.hot;
      const { row: mergeRow, col: mergeColumn, colspan, rowspan } = mergedCellCopy;
      const [lastMergedRowIndex, lastMergedColumnIndex] = this
        .translateMergedCellToRenderable(mergeRow, rowspan, mergeColumn, colspan);

      const renderedRowIndex = rowMapper.getRenderableFromVisualIndex(row);
      const renderedColumnIndex = columnMapper.getRenderableFromVisualIndex(col);

      const maxRowSpan = lastMergedRowIndex - renderedRowIndex + 1; // Number of rendered columns.
      const maxColSpan = lastMergedColumnIndex - renderedColumnIndex + 1; // Number of rendered columns.

      // We just try to determine some values basing on the actual number of rendered indexes (some columns may be hidden).
      mergedCellCopy.row = rowMapper.getFirstNotHiddenIndex(mergedCellCopy.row, 1);
      // We just try to determine some values basing on the actual number of rendered indexes (some columns may be hidden).
      mergedCellCopy.col = columnMapper.getFirstNotHiddenIndex(mergedCellCopy.col, 1);
      // The `rowSpan` property for a `TD` element should be at most equal to number of rendered rows in the merge area.
      mergedCellCopy.rowspan = Math.min(mergedCellCopy.rowspan, maxRowSpan);
      // The `colSpan` property for a `TD` element should be at most equal to number of rendered columns in the merge area.
      mergedCellCopy.colspan = Math.min(mergedCellCopy.colspan, maxColSpan);
    }

    applySpanProperties(TD, mergedCellCopy, row, col);
  }

  /**
   * `beforeSetRangeStart` and `beforeSetRangeStartOnly` hook callback.
   * A selection within merge area should be rewritten to the start of merge area.
   *
   * @private
   * @param {object} coords Cell coords.
   */
  onBeforeSetRangeStart(coords) {
    // TODO: It is a workaround, but probably this hook may be needed. Every selection on the merge area
    // could set start point of the selection to the start of the merge area. However, logic inside `expandByRange` need
    // an initial start point. Click on the merge cell when there are some hidden indexes break the logic in some cases.
    // Please take a look at #7010 for more information. I'm not sure if selection directions are calculated properly
    // and what was idea for flipping direction inside `expandByRange` method.
    if (this.mergedCellsCollection.isFirstRenderableMergedCell(coords.row, coords.col)) {
      const mergeParent = this.mergedCellsCollection.get(coords.row, coords.col);

      [coords.row, coords.col] = [mergeParent.row, mergeParent.col];
    }
  }

  /**
   * `beforeSetRangeEnd` hook callback.
   * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell.
   *
   * Note: Please keep in mind that callback may modify both start and end range coordinates by the reference.
   *
   * @private
   * @param {object} coords Cell coords.
   */
  onBeforeSetRangeEnd(coords) {
    const selRange = this.hot.getSelectedRangeLast();

    selRange.highlight = new CellCoords(selRange.highlight.row, selRange.highlight.col); // clone in case we will modify its reference
    selRange.to = coords;
    let rangeExpanded = false;

    if (this.hot.selection.isSelectedByColumnHeader() || this.hot.selection.isSelectedByRowHeader()) {
      return;
    }

    do {
      rangeExpanded = false;

      for (let i = 0; i < this.mergedCellsCollection.mergedCells.length; i += 1) {
        const cellInfo = this.mergedCellsCollection.mergedCells[i];
        const mergedCellRange = cellInfo.getRange();

        if (selRange.expandByRange(mergedCellRange)) {
          coords.row = selRange.to.row;
          coords.col = selRange.to.col;

          rangeExpanded = true;
        }
      }
    } while (rangeExpanded);
  }

  /**
   * The `afterGetCellMeta` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} col Column index.
   * @param {object} cellProperties The cell properties object.
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    const mergeParent = this.mergedCellsCollection.get(row, col);

    if (mergeParent) {
      if (mergeParent.row !== row || mergeParent.col !== col) {
        cellProperties.copyable = false;

      } else {
        cellProperties.rowspan = mergeParent.rowspan;
        cellProperties.colspan = mergeParent.colspan;
      }
    }
  }

  /**
   * `afterViewportRowCalculatorOverride` hook callback.
   *
   * @private
   * @param {object} calc The row calculator object.
   */
  onAfterViewportRowCalculatorOverride(calc) {
    const nrOfColumns = this.hot.countCols();

    this.modifyViewportRowStart(calc, nrOfColumns);
    this.modifyViewportRowEnd(calc, nrOfColumns);
  }

  /**
   * Modify viewport start when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowStart(calc, nrOfColumns) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualStartRow = rowMapper.getVisualFromRenderableIndex(calc.startRow);

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualStartRow, visualColumnIndex);

      if (isObject(mergeParentForViewportStart)) {
        const renderableIndexAtMergeStart = rowMapper.getRenderableFromVisualIndex(
          rowMapper.getFirstNotHiddenIndex(mergeParentForViewportStart.row, 1));

        // Merge start is out of the viewport (i.e. when we scrolled to the bottom and we can see just part of a merge).
        if (renderableIndexAtMergeStart < calc.startRow) {
          // We extend viewport when some rows have been merged.
          calc.startRow = renderableIndexAtMergeStart;
          // We are looking for next merges inside already extended viewport (starting again from row equal to 0).
          this.modifyViewportRowStart(calc, nrOfColumns); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   *  Modify viewport end when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The row calculator object.
   * @param {number} nrOfColumns Number of visual columns.
   */
  modifyViewportRowEnd(calc, nrOfColumns) {
    const rowMapper = this.hot.rowIndexMapper;
    const visualEndRow = rowMapper.getVisualFromRenderableIndex(calc.endRow);

    for (let visualColumnIndex = 0; visualColumnIndex < nrOfColumns; visualColumnIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualEndRow, visualColumnIndex);

      if (isObject(mergeParentForViewportEnd)) {
        const mergeEnd = mergeParentForViewportEnd.row + mergeParentForViewportEnd.rowspan - 1;
        const renderableIndexAtMergeEnd = rowMapper.getRenderableFromVisualIndex(
          rowMapper.getFirstNotHiddenIndex(mergeEnd, -1));

        // Merge end is out of the viewport.
        if (renderableIndexAtMergeEnd > calc.endRow) {
          // We extend the viewport when some rows have been merged.
          calc.endRow = renderableIndexAtMergeEnd;
          // We are looking for next merges inside already extended viewport (starting again from row equal to 0).
          this.modifyViewportRowEnd(calc, nrOfColumns); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   * `afterViewportColumnCalculatorOverride` hook callback.
   *
   * @private
   * @param {object} calc The column calculator object.
   */
  onAfterViewportColumnCalculatorOverride(calc) {
    const nrOfRows = this.hot.countRows();

    this.modifyViewportColumnStart(calc, nrOfRows);
    this.modifyViewportColumnEnd(calc, nrOfRows);
  }

  /**
   * Modify viewport start when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnStart(calc, nrOfRows) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualStartCol = columnMapper.getVisualFromRenderableIndex(calc.startColumn);

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportStart = this.mergedCellsCollection.get(visualRowIndex, visualStartCol);

      if (isObject(mergeParentForViewportStart)) {
        const renderableIndexAtMergeStart = columnMapper.getRenderableFromVisualIndex(
          columnMapper.getFirstNotHiddenIndex(mergeParentForViewportStart.col, 1));

        // Merge start is out of the viewport (i.e. when we scrolled to the right and we can see just part of a merge).
        if (renderableIndexAtMergeStart < calc.startColumn) {
          // We extend viewport when some columns have been merged.
          calc.startColumn = renderableIndexAtMergeStart;
          // We are looking for next merges inside already extended viewport (starting again from column equal to 0).
          this.modifyViewportColumnStart(calc, nrOfRows); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   *  Modify viewport end when needed. We extend viewport when merged cells aren't fully visible.
   *
   * @private
   * @param {object} calc The column calculator object.
   * @param {number} nrOfRows Number of visual rows.
   */
  modifyViewportColumnEnd(calc, nrOfRows) {
    const columnMapper = this.hot.columnIndexMapper;
    const visualEndCol = columnMapper.getVisualFromRenderableIndex(calc.endColumn);

    for (let visualRowIndex = 0; visualRowIndex < nrOfRows; visualRowIndex += 1) {
      const mergeParentForViewportEnd = this.mergedCellsCollection.get(visualRowIndex, visualEndCol);

      if (isObject(mergeParentForViewportEnd)) {
        const mergeEnd = mergeParentForViewportEnd.col + mergeParentForViewportEnd.colspan - 1;
        const renderableIndexAtMergeEnd = columnMapper.getRenderableFromVisualIndex(
          columnMapper.getFirstNotHiddenIndex(mergeEnd, -1));

        // Merge end is out of the viewport.
        if (renderableIndexAtMergeEnd > calc.endColumn) {
          // We extend the viewport when some columns have been merged.
          calc.endColumn = renderableIndexAtMergeEnd;
          // We are looking for next merges inside already extended viewport (starting again from column equal to 0).
          this.modifyViewportColumnEnd(calc, nrOfRows); // recursively search upwards

          return; // Finish the current loop. Everything will be checked from the beginning by above recursion.
        }
      }
    }
  }

  /**
   * Translates merged cell coordinates to renderable indexes.
   *
   * @private
   * @param {number} parentRow Visual row index.
   * @param {number} rowspan Rowspan which describes shift which will be applied to parent row
   *                         to calculate renderable index which points to the most bottom
   *                         index position. Pass rowspan as `0` to calculate the most top
   *                         index position.
   * @param {number} parentColumn Visual column index.
   * @param {number} colspan Colspan which describes shift which will be applied to parent column
   *                         to calculate renderable index which points to the most right
   *                         index position. Pass colspan as `0` to calculate the most left
   *                         index position.
   * @returns {number[]}
   */
  translateMergedCellToRenderable(parentRow, rowspan, parentColumn, colspan) {
    const { rowIndexMapper: rowMapper, columnIndexMapper: columnMapper } = this.hot;
    let firstNonHiddenRow;
    let firstNonHiddenColumn;

    if (rowspan === 0) {
      firstNonHiddenRow = rowMapper.getFirstNotHiddenIndex(parentRow, 1);
    } else {
      firstNonHiddenRow = rowMapper.getFirstNotHiddenIndex(parentRow + rowspan - 1, -1);
    }

    if (colspan === 0) {
      firstNonHiddenColumn = columnMapper.getFirstNotHiddenIndex(parentColumn, 1);
    } else {
      firstNonHiddenColumn = columnMapper.getFirstNotHiddenIndex(parentColumn + colspan - 1, -1);
    }

    const renderableRow = parentRow >= 0 ?
      rowMapper.getRenderableFromVisualIndex(firstNonHiddenRow) : parentRow;
    const renderableColumn = parentColumn >= 0 ?
      columnMapper.getRenderableFromVisualIndex(firstNonHiddenColumn) : parentColumn;

    return [renderableRow, renderableColumn];
  }

  /**
   * The `modifyAutofillRange` hook callback.
   *
   * @private
   * @param {Array} drag The drag area coordinates.
   * @param {Array} select The selection information.
   * @returns {Array} The new drag area.
   */
  onModifyAutofillRange(drag, select) {
    this.autofillCalculations.correctSelectionAreaSize(select);
    const dragDirection = this.autofillCalculations.getDirection(select, drag);
    let dragArea = drag;

    if (this.autofillCalculations.dragAreaOverlapsCollections(select, dragArea, dragDirection)) {
      dragArea = select;

      return dragArea;
    }

    const mergedCellsWithinSelectionArea = this.mergedCellsCollection.getWithinRange({
      from: { row: select[0], col: select[1] },
      to: { row: select[2], col: select[3] }
    });

    if (!mergedCellsWithinSelectionArea) {
      return dragArea;
    }

    dragArea = this.autofillCalculations.snapDragArea(select, dragArea, dragDirection, mergedCellsWithinSelectionArea);

    return dragArea;
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} count Number of created columns.
   */
  onAfterCreateCol(column, count) {
    this.mergedCellsCollection.shiftCollections('right', column, count);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {number} column Column index.
   * @param {number} count Number of removed columns.
   */
  onAfterRemoveCol(column, count) {
    this.mergedCellsCollection.shiftCollections('left', column, count);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} count Number of created rows.
   * @param {string} source Source of change.
   */
  onAfterCreateRow(row, count, source) {
    if (source === 'auto') {
      return;
    }

    this.mergedCellsCollection.shiftCollections('down', row, count);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {number} row Row index.
   * @param {number} count Number of removed rows.
   */
  onAfterRemoveRow(row, count) {
    this.mergedCellsCollection.shiftCollections('up', row, count);
  }

  /**
   * `afterChange` hook callback. Used to propagate merged cells after using Autofill.
   *
   * @private
   * @param {Array} changes The changes array.
   * @param {string} source Determines the source of the change.
   */
  onAfterChange(changes, source) {
    if (source !== 'Autofill.fill') {
      return;
    }

    this.autofillCalculations.recreateAfterDataPopulation(changes);
  }

  /**
   * `beforeDrawAreaBorders` hook callback.
   *
   * @private
   * @param {Array} corners Visual coordinates of the area corners.
   * @param {string} className Class name for the area.
   */
  onBeforeDrawAreaBorders(corners, className) {
    if (className && className === 'area') {
      const selectedRange = this.hot.getSelectedRangeLast();
      const mergedCellsWithinRange = this.mergedCellsCollection.getWithinRange(selectedRange);

      arrayEach(mergedCellsWithinRange, (mergedCell) => {
        if (selectedRange.getBottomRightCorner().row === mergedCell.getLastRow() &&
            selectedRange.getBottomRightCorner().col === mergedCell.getLastColumn()) {
          corners[2] = mergedCell.row;
          corners[3] = mergedCell.col;
        }
      });
    }
  }

  /**
   * `afterModifyTransformStart` hook callback. Fixes a problem with navigating through merged cells at the edges of the table
   * with the ENTER/SHIFT+ENTER/TAB/SHIFT+TAB keys.
   *
   * @private
   * @param {CellCoords} coords Coordinates of the to-be-selected cell.
   * @param {number} rowTransformDir Row transformation direction (negative value = up, 0 = none, positive value = down).
   * @param {number} colTransformDir Column transformation direction (negative value = up, 0 = none, positive value = down).
   */
  onAfterModifyTransformStart(coords, rowTransformDir, colTransformDir) {
    if (!this.enabled) {
      return;
    }

    const mergedCellAtCoords = this.mergedCellsCollection.get(coords.row, coords.col);

    if (!mergedCellAtCoords) {
      return;
    }

    const goingDown = rowTransformDir > 0;
    const goingUp = rowTransformDir < 0;
    const goingLeft = colTransformDir < 0;
    const goingRight = colTransformDir > 0;
    const mergedCellOnBottomEdge = mergedCellAtCoords.row + mergedCellAtCoords.rowspan - 1 === this.hot.countRows() - 1;
    const mergedCellOnTopEdge = mergedCellAtCoords.row === 0;
    const mergedCellOnRightEdge = mergedCellAtCoords.col + mergedCellAtCoords.colspan - 1 === this.hot.countCols() - 1;
    const mergedCellOnLeftEdge = mergedCellAtCoords.col === 0;

    if (((goingDown && mergedCellOnBottomEdge) || (goingUp && mergedCellOnTopEdge)) ||
      ((goingRight && mergedCellOnRightEdge) || (goingLeft && mergedCellOnLeftEdge))) {
      coords.row = mergedCellAtCoords.row;
      coords.col = mergedCellAtCoords.col;
    }
  }

  /**
   * `afterDrawSelection` hook callback. Used to add the additional class name for the entirely-selected merged cells.
   *
   * @private
   * @param {number} currentRow Visual row index of the currently processed cell.
   * @param {number} currentColumn Visual column index of the currently cell.
   * @param {Array} cornersOfSelection Array of the current selection in a form of `[startRow, startColumn, endRow, endColumn]`.
   * @param {number|undefined} layerLevel Number indicating which layer of selection is currently processed.
   * @returns {string|undefined} A `String`, which will act as an additional `className` to be added to the currently processed cell.
   */
  onAfterDrawSelection(currentRow, currentColumn, cornersOfSelection, layerLevel) {
    // Nothing's selected (hook might be triggered by the custom borders)
    if (!cornersOfSelection) {
      return;
    }

    return this.selectionCalculations
      .getSelectedMergedCellClassName(currentRow, currentColumn, cornersOfSelection, layerLevel);
  }

  /**
   * `beforeRemoveCellClassNames` hook callback. Used to remove additional class name from all cells in the table.
   *
   * @private
   * @returns {string[]} An `Array` of `String`s. Each of these strings will act like class names to be removed from all the cells in the table.
   */
  onBeforeRemoveCellClassNames() {
    return this.selectionCalculations.getSelectedMergedCellClassNameToRemove();
  }
}
