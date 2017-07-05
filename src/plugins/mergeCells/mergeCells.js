import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import {registerPlugin} from './../../plugins';
import {stopImmediatePropagation} from './../../helpers/dom/event';
import {CellCoords, CellRange, Table} from './../../3rdparty/walkontable/src';
import CollectionContainer from './cellCollection/collectionContainer';
import AutofillCalculations from './calculations/autofill';

const privatePool = new WeakMap();

/**
 * @plugin MergeCells
 * @class MergeCells
 * @dependencies ContextMenu
 *
 * @description Plugin, which allows merging cells in the table (using the initial configuration, API or context menu).
 *
 * @example
 *
 * ```js
 * ...
 * let hot = new Handsontable(document.getElementById('example'), {
 *  data: getData(),
 *  mergeCells: [
 *    {row: 0, col: 3, rowspan: 3, colspan: 3},
 *    {row: 2, col: 6, rowspan: 2, colspan: 2},
 *    {row: 4, col: 8, rowspan: 3, colspan: 3}
 *  ],
 * ...
 * ```
 */
class MergeCells extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    privatePool.set(this, {
      lastDesiredCoords: null
    });

    /**
     * A container for all the merged cells collections.
     *
     * @type {CollectionContainer}
     */
    this.collectionContainer = null;

    /**
     * Instance of the class responsible for all the autofill-related calculations.
     *
     * @private
     * @type {AutofillCalculations}
     */
    this.autofillCalculations = null;
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().mergeCells;
  }

  /**
   * Enable the plugin.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.collectionContainer = new CollectionContainer(this.hot);
    this.autofillCalculations = new AutofillCalculations(this);

    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('beforeKeyDown', (...args) => this.onBeforeKeyDown(...args));
    this.addHook('modifyTransformStart', (...args) => this.onModifyTransformStart(...args));
    this.addHook('modifyTransformEnd', (...args) => this.onModifyTransformEnd(...args));
    this.addHook('beforeSetRangeEnd', (...args) => this.onBeforeSetRangeEnd(...args));
    this.addHook('beforeDrawBorders', (...args) => this.onBeforeDrawAreaBorders(...args));
    this.addHook('afterIsMultipleSelection', (...args) => this.onAfterIsMultipleSelection(...args));
    this.addHook('afterRenderer', (...args) => this.onAfterRenderer(...args));
    this.addHook('afterContextMenuDefaultOptions', (...args) => this.addMergeActionsToContextMenu(...args));
    this.addHook('afterGetCellMeta', (...args) => this.onAfterGetCellMeta(...args));
    this.addHook('afterViewportRowCalculatorOverride', (...args) => this.onAfterViewportRowCalculatorOverride(...args));
    this.addHook('afterViewportColumnCalculatorOverride', (...args) => this.onAfterViewportColumnCalculatorOverride(...args));
    this.addHook('modifyAutofillRange', (...args) => this.onModifyAutofillRange(...args));
    this.addHook('afterCreateCol', (...args) => this.onAfterCreateCol(...args));
    this.addHook('afterRemoveCol', (...args) => this.onAfterRemoveCol(...args));
    this.addHook('afterCreateRow', (...args) => this.onAfterCreateRow(...args));
    this.addHook('afterRemoveRow', (...args) => this.onAfterRemoveRow(...args));
    this.addHook('afterChange', (...args) => this.onAfterChange(...args));

    super.enablePlugin();
  }

  /**
   * Disable the plugin.
   */
  disablePlugin() {
    this.clearCollections();
    super.disablePlugin();
  }

  /**
   * Update the plugin (after using the `updateSettings` method)
   */
  updatePlugin() {
    const settings = this.hot.getSettings().mergeCells;

    if (settings.constructor === Array) {
      this.clearCollections();
      this.generateFromSettings(settings);
    }
  }

  /**
   * Generate the collection container from the settings provided to the plugin.
   *
   * @param {Array|Boolean} settings The settings provided to the plugin.
   */
  generateFromSettings(settings) {
    if (Array.isArray(settings)) {
      for (let i = 0; i < settings.length; i++) {
        const setting = settings[i];
        const highlight = new CellCoords(setting.row, setting.col);
        const rangeEnd = new CellCoords(setting.row + setting.rowspan - 1, setting.col + setting.colspan - 1);

        const mergeRange = new CellRange(highlight, highlight, rangeEnd);
        this.mergeRange(mergeRange);
      }
    }
  }

  /**
   * Clear the collections from the collection container.
   */
  clearCollections() {
    const collections = this.collectionContainer.collections;
    const cellsToClear = [];

    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];

      cellsToClear.push([this.hot.getCell(collection.row, collection.col), collection.row, collection.col]);
    }

    this.collectionContainer.clear();

    for (let i = 0; i < cellsToClear.length; i++) {
      this.applySpanProperties(...cellsToClear[i]);
    }
  }

  /**
   * Returns `true` if a range is mergeable.
   * TODO: unit tests
   *
   * @param {CellRange} cellRange Cell range to test.
   */
  canMergeRange(cellRange) {
    // is more than one cell selected
    return !cellRange.isSingle();
  }

  /**
   * Merge cells in the provided cell range.
   *
   * @param {CellRange} cellRange Cell range to merge.
   */
  mergeRange(cellRange) {
    if (!this.canMergeRange(cellRange)) {
      return;
    }

    // normalize top left corner
    const topLeft = cellRange.getTopLeftCorner();
    const bottomRight = cellRange.getBottomRightCorner();
    const mergeParent = {
      row: topLeft.row,
      col: topLeft.col,
      // TD has rowspan == 1 by default. rowspan == 2 means spread over 2 cells
      rowspan: bottomRight.row - topLeft.row + 1,
      colspan: bottomRight.col - topLeft.col + 1
    };
    const clearedData = [];

    for (let i = 0; i < mergeParent.rowspan; i++) {
      for (let j = 0; j < mergeParent.colspan; j++) {
        let clearedValue = null;

        if (!clearedData[i]) {
          clearedData[i] = [];
        }

        if (i === 0 && j === 0) {
          clearedValue = this.hot.getDataAtCell(mergeParent.row, mergeParent.col);
        }

        clearedData[i][j] = clearedValue;
      }
    }

    this.collectionContainer.add(mergeParent);
    this.hot.populateFromArray(mergeParent.row, mergeParent.col, clearedData);
  }

  /**
   * Merge the selection provided as a cell range.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  mergeSelection(cellRange) {
    if (!cellRange) {
      cellRange = this.hot.getSelectedRange();
    }

    this.unmergeSelection(cellRange);
    this.mergeRange(cellRange);
  }

  /**
   * Unmerge the selection provided as a cell range. If no cell range is provided, it uses the current selection.
   *
   * @param {CellRange} [cellRange] Selection cell range.
   */
  unmergeSelection(cellRange) {
    if (!cellRange) {
      cellRange = this.hot.getSelectedRange();
    }

    const collections = this.collectionContainer.getWithinRange(cellRange);

    for (let i = 0; i < collections.length; i++) {
      this.collectionContainer.remove(collections[i].row, collections[i].col);
    }
  }

  /**
   * Merge or unmerge, based on the cell range provided as `cellRange`.
   *
   * @param {CellRange} cellRange The cell range to merge or unmerged.
   */
  toggleMerge(cellRange) {
    const collection = this.collectionContainer.get(cellRange.from.row, cellRange.from.col);
    const collectionCoversWholeRange = collection.row === cellRange.from.row && collection.col === cellRange.from.col &&
      collection.row + collection.rowspan - 1 === cellRange.to.row && collection.col + collection.colspan - 1 === cellRange.to.col;

    if (collectionCoversWholeRange) {
      // unmerge
      this.unmergeSelection(cellRange);

    } else {
      // merge
      this.mergeSelection(cellRange);
    }
  }

  /**
   * Shift the collection in the direction and by an offset defined in the arguments.
   *
   * @private
   * @param {String} direction `right`, `left`, `up` or `down`.
   * @param {Number} index Index where the change, which caused the shifting took place.
   * @param {Number} count Number of rows/columns added/removed in the preceding action.
   */
  shiftCollection(direction, index, count) {
    const shiftVector = [0, 0];

    switch (direction) {
      case 'right':
        shiftVector[0] += count;

        break;
      case 'left':
        shiftVector[0] -= count;

        break;
      case 'down':
        shiftVector[1] += count;

        break;
      case 'up':
        shiftVector[1] -= count;

        break;
      default:
        break;
    }

    for (let i = 0, collectionLength = this.collectionContainer.collections.length; i < collectionLength; i++) {
      let currentMerge = this.collectionContainer.collections[i];

      this.processCollection(currentMerge, shiftVector, index);
    }

    for (let i = 0; i < this.collectionContainer.collections.length; i++) {
      let currentMerge = this.collectionContainer.collections[i];

      if (currentMerge.removed) {
        this.collectionContainer.collections.splice(this.collectionContainer.collections.indexOf(currentMerge), 1);
      }
    }

  }

  /**
   * Processes the merged collection (in terms of modifying the position and size of the collection).
   *
   * @private
   * @param {Collection} mergeInfo Object containing the collection information.
   * @param {Array} shiftVector 2-element array containing the information on the shifting in the `x` and `y` axis.
   * @param {Number} indexOfChange Index of the preceding change.
   * @returns {Boolean} Returns `false` if the whole collection was removed.
   */
  processCollection(mergeInfo, shiftVector, indexOfChange) {
    const shiftValue = shiftVector[0] || shiftVector[1];
    const shiftedIndex = indexOfChange + Math.abs(shiftVector[0] || shiftVector[1]) - 1;
    const SPAN = shiftVector[0] ? 'colspan' : 'rowspan';
    const INDEX = shiftVector[0] ? 'col' : 'row';
    const changeStart = Math.min(indexOfChange, shiftedIndex);
    const changeEnd = Math.max(indexOfChange, shiftedIndex);
    const mergeStart = mergeInfo[INDEX];
    const mergeEnd = mergeInfo[INDEX] + mergeInfo[SPAN] - 1;

    if (mergeStart > indexOfChange) {
      mergeInfo[INDEX] += shiftValue;
    }

    // adding rows/columns
    if (shiftValue > 0) {

      if (indexOfChange <= mergeEnd && indexOfChange > mergeStart) {
        mergeInfo[SPAN] += shiftValue;
      }

      // removing rows/columns
    } else if (shiftValue < 0) {

      // removing the whole merge
      if (changeStart <= mergeStart && changeEnd >= mergeEnd) {
        mergeInfo.removed = true;
        return false;

        // removing the merge partially, including the beginning
      } else if (mergeStart >= changeStart && mergeStart <= changeEnd) {
        const removedOffset = changeEnd - mergeStart + 1;
        const preRemovedOffset = Math.abs(shiftValue) - removedOffset;

        mergeInfo[INDEX] -= preRemovedOffset;
        mergeInfo[SPAN] -= removedOffset;

        // removing the middle part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeEnd) {
        mergeInfo[SPAN] += shiftValue;

        // removing the end part of the merge
      } else if (mergeStart <= changeStart && mergeEnd >= changeStart && mergeEnd < changeEnd) {
        const removedPart = mergeEnd - changeStart + 1;

        mergeInfo[SPAN] -= removedPart;
      }
    }

    return true;
  }

  /**
   * Apply the `colspan`/`rowspan` properties.
   *
   * @private
   * @param {HTMLElement} TD The soon-to-be-modified cell.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   */
  applySpanProperties(TD, row, col) {
    // TODO: maybe move to dom?
    let info = this.collectionContainer.get(row, col);

    if (info) {
      if (info.row === row && info.col === col) {
        TD.setAttribute('rowspan', info.rowspan.toString());
        TD.setAttribute('colspan', info.colspan.toString());

      } else {
        TD.removeAttribute('rowspan');
        TD.removeAttribute('colspan');

        TD.style.display = 'none';
      }

    } else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');
    }
  }

  /**
   * `afterInit` hook callback.
   *
   * @private
   */
  onAfterInit() {
    this.generateFromSettings(this.hot.getSettings().mergeCells);
    this.hot.render();

    // TODO: maybe try to remove this and use a hook-ish solution?
    if (this.isEnabled()) {
      let plugin = this;
      /**
       * Monkey patch Table.prototype.getCell to return TD for merged cell parent if asked for TD of a cell that is
       * invisible due to the merge. This is not the cleanest solution but there is a test case for it (merged cells scroll) so feel free to refactor it!
       */
      this.hot.view.wt.wtTable.getCell = function(coords) {
        const mergeParent = plugin.collectionContainer.get(coords.row, coords.col);

        if (mergeParent) {
          coords = mergeParent;
        }
        return Table.prototype.getCell.call(this, coords);
      };
    }
  }

  /**
   * `beforeKeyDown` hook callback.
   *
   * @private
   * @param {KeyboardEvent} event The `keydown` event object.
   */
  onBeforeKeyDown(event) {
    const ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown) {
      if (event.keyCode === 77) { // CTRL + M

        this.toggleMerge(this.hot.getSelectedRange());

        this.hot.render();
        stopImmediatePropagation(event);
      }
    }
  }

  /**
   * Modify the information on whether the current selection contains multiple cells. The `afterIsMultipleSelection` hook callback.
   *
   * @private
   * @param {Boolean} isMultiple
   * @returns {Boolean}
   */
  onAfterIsMultipleSelection(isMultiple) {
    if (isMultiple) {
      let mergedCells = this.collectionContainer.collections,
        selectionRange = this.hot.getSelectedRange();

      for (let group in mergedCells) {
        if (selectionRange.highlight.row === mergedCells[group].row &&
          selectionRange.highlight.col === mergedCells[group].col &&
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
   * @param {Object} delta The transformation delta.
   */
  onModifyTransformStart(delta) {
    const priv = privatePool.get(this);
    const currentlySelectedRange = this.hot.getSelectedRange();
    let newDelta = {
      row: delta.row,
      col: delta.col,
    };
    let nextPosition = null;
    let currentPosition = new CellCoords(currentlySelectedRange.highlight.row, currentlySelectedRange.highlight.col);
    let mergedParent = this.collectionContainer.get(currentPosition.row, currentPosition.col);

    if (!priv.lastDesiredCoords) {
      priv.lastDesiredCoords = new CellCoords(null, null);
    }

    if (mergedParent) { // only merge selected
      let mergeTopLeft = new CellCoords(mergedParent.row, mergedParent.col);
      let mergeBottomRight = new CellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1);
      let mergeRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

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

    nextPosition = new CellCoords(currentlySelectedRange.highlight.row + newDelta.row, currentlySelectedRange.highlight.col + newDelta.col);

    let nextParentIsMerged = this.collectionContainer.get(nextPosition.row, nextPosition.col);

    if (nextParentIsMerged) { // skipping the invisible cells in the merge range
      priv.lastDesiredCoords = nextPosition;
      newDelta = {
        row: nextParentIsMerged.row - currentPosition.row,
        col: nextParentIsMerged.col - currentPosition.col
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
   * `modifyTransformEnd` hook callback.
   *
   * @private
   * @param {Object} delta The transformation delta.
   */
  onModifyTransformEnd(delta) {
    const currentlySelectedRange = this.hot.getSelectedRange();
    let newDelta = {
      row: delta.row,
      col: delta.col,
    };
    let nextPosition = null;

    for (let i = 0, mergesLength = this.collectionContainer.collections.length; i < mergesLength; i++) {
      let currentMerge = this.collectionContainer.collections[i];
      let mergeTopLeft = new CellCoords(currentMerge.row, currentMerge.col);
      let mergeBottomRight = new CellCoords(currentMerge.row + currentMerge.rowspan - 1, currentMerge.col + currentMerge.colspan - 1);
      let mergedRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);
      let sharedBorders = currentlySelectedRange.getBordersSharedWith(mergedRange);

      if (mergedRange.isEqual(currentlySelectedRange)) { // only the merged range is selected
        currentlySelectedRange.setDirection('NW-SE');

      } else if (sharedBorders.length > 0) {
        let mergeHighlighted = (currentlySelectedRange.highlight.isEqual(mergedRange.from));

        if (sharedBorders.indexOf('top') > -1) { // if range shares a border with the merged section, change range direction accordingly
          if (currentlySelectedRange.to.isSouthEastOf(mergedRange.from) && mergeHighlighted) {
            currentlySelectedRange.setDirection('NW-SE');
          } else if (currentlySelectedRange.to.isSouthWestOf(mergedRange.from) && mergeHighlighted) {
            currentlySelectedRange.setDirection('NE-SW');
          }
        } else if (sharedBorders.indexOf('bottom') > -1) {
          if (currentlySelectedRange.to.isNorthEastOf(mergedRange.from) && mergeHighlighted) {
            currentlySelectedRange.setDirection('SW-NE');
          } else if (currentlySelectedRange.to.isNorthWestOf(mergedRange.from) && mergeHighlighted) {
            currentlySelectedRange.setDirection('SE-NW');
          }
        }
      }

      nextPosition = new CellCoords(currentlySelectedRange.to.row + newDelta.row, currentlySelectedRange.to.col + newDelta.col);

      let withinRowspan = currentMerge.includesVertically(nextPosition.row);
      let withinColspan = currentMerge.includesHorizontally(nextPosition.col);

      if (currentlySelectedRange.includesRange(mergedRange) && (mergedRange.includes(nextPosition) ||
        withinRowspan || withinColspan)) { // if next step overlaps a merged range, jump past it
        if (withinRowspan) {
          if (newDelta.row < 0) {
            newDelta.row -= currentMerge.rowspan - 1;
          } else if (newDelta.row > 0) {
            newDelta.row += currentMerge.rowspan - 1;
          }
        }
        if (withinColspan) {
          if (newDelta.col < 0) {
            newDelta.col -= currentMerge.colspan - 1;
          } else if (newDelta.col > 0) {
            newDelta.col += currentMerge.colspan - 1;
          }
        }
      }
    }

    if (newDelta.row !== 0) {
      delta.row = newDelta.row;
    }
    if (newDelta.col !== 0) {
      delta.col = newDelta.col;
    }
  }

  /**
   * `afterContextMenuDefaultOptions` hook callback.
   *
   * @private
   * @param {Object} defaultOptions The default context menu options.
   */
  addMergeActionsToContextMenu(defaultOptions) {
    const plugin = this;

    defaultOptions.items.push({name: '---------'});
    defaultOptions.items.push({
      key: 'mergeCells',
      name() {
        const sel = this.getSelected();
        const info = plugin.collectionContainer.get(sel[0], sel[1]);

        if (info.row === sel[0] && info.col === sel[1] && info.row + info.rowspan - 1 === sel[2] && info.col + info.colspan - 1 === sel[3]) {
          return 'Unmerge cells';
        }
        return 'Merge cells';

      },
      callback() {
        plugin.toggleMerge(this.getSelectedRange());
        this.render();
      },
      disabled() {
        return this.selection.selectedHeader.corner;
      },
    });
  }

  /**
   * `afterRenderer` hook callback.
   *
   * @private
   * @param {HTMLElement} TD The cell to be modified.
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {String|Number} prop The prop for the current coordinates.
   * @param {String|Number} value The cell value.
   * @param {Object} cellProperties The current cell properties.
   */
  onAfterRenderer(TD, row, col, prop, value, cellProperties) {
    this.applySpanProperties(TD, row, col);
  }

  /**
   * `beforeSetRangeEnd` hook callback.
   * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
   *
   * @private
   * @param {Object} coords Cell coords.
   */
  onBeforeSetRangeEnd(coords) {
    let selRange = this.hot.getSelectedRange();
    selRange.highlight = new CellCoords(selRange.highlight.row, selRange.highlight.col); // clone in case we will modify its reference
    selRange.to = coords;
    let rangeExpanded = false;

    do {
      rangeExpanded = false;

      for (let i = 0, ilen = this.collectionContainer.collections.length; i < ilen; i++) {
        let cellInfo = this.collectionContainer.collections[i];
        let mergedCellTopLeft = new CellCoords(cellInfo.row, cellInfo.col);
        let bottomRightCoords = {
          row: Math.min(cellInfo.row + cellInfo.rowspan - 1, this.hot.countRows() - 1),
          column: Math.min(cellInfo.col + cellInfo.colspan - 1, this.hot.countCols() - 1)
        };
        let mergedCellBottomRight = new CellCoords(bottomRightCoords.row, bottomRightCoords.column);

        let mergedCellRange = new CellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
        if (selRange.expandByRange(mergedCellRange)) {
          coords.row = selRange.to.row;
          coords.col = selRange.to.col;

          rangeExpanded = true;
        }
      }
    } while (rangeExpanded);
  }

  /**
   * Returns correct coordinates for merged start / end cells in selection for area borders. `beforeDrawAreaBorders` hook callback.
   *
   * @private
   * @param {Array} corners The area corners.
   * @param {String} className The area className.
   */
  onBeforeDrawAreaBorders(corners, className) {
    if (className && className === 'area') {
      let selRange = this.hot.getSelectedRange();
      let startRange = new CellRange(selRange.from, selRange.from, selRange.from);
      let stopRange = new CellRange(selRange.to, selRange.to, selRange.to);

      for (let i = 0, ilen = this.collectionContainer.collections.length; i < ilen; i++) {
        let cellInfo = this.collectionContainer.collections[i];
        let mergedCellTopLeft = new CellCoords(cellInfo.row, cellInfo.col);
        let mergedCellBottomRight = new CellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);
        let mergedCellRange = new CellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

        if (startRange.expandByRange(mergedCellRange)) {
          corners[0] = startRange.from.row;
          corners[1] = startRange.from.col;
        }

        if (stopRange.expandByRange(mergedCellRange)) {
          corners[2] = stopRange.from.row;
          corners[3] = stopRange.from.col;
        }
      }
    }
  }

  /**
   * The `afterGetCellMeta` hook callback.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} col Column index.
   * @param {Object} cellProperties The cell properties object.
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    let mergeParent = this.collectionContainer.get(row, col);

    if (mergeParent && (mergeParent.row !== row || mergeParent.col !== col)) {
      cellProperties.copyable = false;
    }
  }

  /**
   * `afterViewportRowCalculatorOverride` hook callback.
   *
   * @private
   * @param {Object} calc The row calculator object.
   */
  onAfterViewportRowCalculatorOverride(calc) {
    let colCount = this.hot.countCols();
    let mergeParent;

    for (let c = 0; c < colCount; c++) {
      mergeParent = this.collectionContainer.get(calc.startRow, c);
      if (mergeParent) {
        if (mergeParent.row < calc.startRow) {
          calc.startRow = mergeParent.row;
          return this.onAfterViewportRowCalculatorOverride.call(this, calc); // recursively search upwards
        }
      }
      mergeParent = this.collectionContainer.get(calc.endRow, c);
      if (mergeParent) {
        let mergeEnd = mergeParent.row + mergeParent.rowspan - 1;
        if (mergeEnd > calc.endRow) {
          calc.endRow = mergeEnd;
          return this.onAfterViewportRowCalculatorOverride.call(this, calc); // recursively search upwards
        }
      }
    }
  }

  /**
   * `afterViewportColumnCalculatorOverride` hook callback.
   *
   * @private
   * @param {Object} calc The column calculator object.
   */
  onAfterViewportColumnCalculatorOverride(calc) {
    let rowCount = this.hot.countRows();
    let mergeParent;
    for (let r = 0; r < rowCount; r++) {
      mergeParent = this.collectionContainer.get(r, calc.startColumn);

      if (mergeParent) {
        if (mergeParent.col < calc.startColumn) {
          calc.startColumn = mergeParent.col;
          return this.onAfterViewportColumnCalculatorOverride.call(this, calc); // recursively search upwards
        }
      }
      mergeParent = this.collectionContainer.get(r, calc.endColumn);
      if (mergeParent) {
        let mergeEnd = mergeParent.col + mergeParent.colspan - 1;
        if (mergeEnd > calc.endColumn) {
          calc.endColumn = mergeEnd;
          return this.onAfterViewportColumnCalculatorOverride.call(this, calc); // recursively search upwards
        }
      }
    }
  }

  /**
   * The `modifyAutofillRange` hook callback.
   *
   * @private
   * @param {Array} drag The drag area coordinates.
   * @param {Array} select The selection information.
   */
  onModifyAutofillRange(drag, select) {
    this.autofillCalculations.correctSelectionAreaSize(select);
    const dragDirection = this.autofillCalculations.getDirection(select, drag);

    if (this.autofillCalculations.dragAreaOverlapsCollections(select, drag, dragDirection)) {
      drag = select;
      return drag;
    }

    const collectionsWithinSelectionArea = this.collectionContainer.getWithinRange({
      from: {row: select[0], col: select[1]},
      to: {row: select[2], col: select[3]}
    });

    if (!collectionsWithinSelectionArea) {
      return drag;
    }

    drag = this.autofillCalculations.snapDragArea(select, drag, dragDirection, collectionsWithinSelectionArea);

    return drag;
  }

  /**
   * `afterCreateCol` hook callback.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} count Number of created columns.
   */
  onAfterCreateCol(column, count) {
    this.shiftCollection('right', column, count);
  }

  /**
   * `afterRemoveCol` hook callback.
   *
   * @private
   * @param {Number} column Column index.
   * @param {Number} count Number of removed columns.
   * @param {String} source Source of change.
   */
  onAfterRemoveCol(column, count, source) {
    this.shiftCollection('left', column, count);
  }

  /**
   * `afterCreateRow` hook callback.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} count Number of created rows.
   * @param {String} source Source of change.
   */
  onAfterCreateRow(row, count, source) {
    if (source === 'auto') {
      return;
    }

    this.shiftCollection('down', row, count);
  }

  /**
   * `afterRemoveRow` hook callback.
   *
   * @private
   * @param {Number} row Row index.
   * @param {Number} count Number of removed rows.
   */
  onAfterRemoveRow(row, count) {
    this.shiftCollection('up', row, count);
  }

  /**
   * `afterChange` hook callback. Used to propagate collections after using Autofill.
   *
   * @private
   * @param {Array} changes The changes array.
   * @param {String} source Determines the source of the change.
   */
  onAfterChange(changes, source) {
    if (source !== 'Autofill.fill') {
      return;
    }

    this.autofillCalculations.recreateAfterDataPopulation(changes);
  }
}

registerPlugin('mergeCells', MergeCells);

export default MergeCells;
