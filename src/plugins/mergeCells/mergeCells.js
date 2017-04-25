import BasePlugin from './../_base';
import Hooks from './../../pluginHooks';
import {registerPlugin} from './../../plugins';
import {stopImmediatePropagation} from './../../helpers/dom/event';
import {CellCoords, CellRange, Table} from './../../3rdparty/walkontable/src';
import CollectionContainer from './cellCollection/collectionContainer';

/**
 * TODO: docs
 * @plugin MergeCells
 * @class MergeCells
 */
class MergeCells extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    //TODO: docs
    this.collectionContainer = null;

    //TODO: docs
    this.lastDesiredCoords = null;
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
   * TODO: docs
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.generateFromSettings(this.hot.getSettings().mergeCells);
    this.addHook('afterInit', (...args) => this.onAfterInit(...args));
    this.addHook('beforeKeyDown', (...args) => this.onBeforeKeyDown(...args));
    this.addHook('modifyTransformStart', (...args) => this.onModifyTransformStart(...args));
    this.addHook('modifyTransformEnd', (...args) => this.onModifyTransformEnd(...args));
    this.addHook('beforeSetRangeEnd', (...args) => this.onBeforeSetRangeEnd(...args));
    this.addHook('beforeDrawBorders', (...args) => this.onBeforeDrawAreaBorders(...args));
    this.addHook('afterIsMultipleSelection', (...args) => this.isMultipleSelection(...args));
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

    super.enablePlugin();
  }

  /**
   * TODO: docs
   */
  disablePlugin() {
    this.clearCollections();
    super.disablePlugin();
  }

  /**
   * TODO: docs
   */
  updatePlugin() {
    const settings = this.hot.getSettings().mergeCells;
    debugger;
    if (settings.constructor === Array) {
      this.clearCollections();
      this.generateFromSettings(settings);
    }
  }

  /**
   * TODO: docs
   * @param settings
   */
  generateFromSettings(settings) {
    this.collectionContainer = new CollectionContainer();

    if (Array.isArray(settings)) {
      for (let i = 0; i < settings.length; i++) {
        this.collectionContainer.add(settings[i]);
      }
    }
  }

  /**
   * TODO: docs
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
   * TODO: docs
   * @param cellRange (CellRange)
   */
  canMergeRange(cellRange) {
    // is more than one cell selected
    return !cellRange.isSingle();
  }

  /**
   * TODO: docs
   * @param cellRange
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

    this.collectionContainer.add(mergeParent);
  }

  /**
   * TODO: docs
   * @param cellRange
   */
  mergeSelection(cellRange) {
    this.mergeRange(cellRange);
  }

  /**
   * TODO: docs
   * @param cellRange
   */
  unmergeSelection(cellRange) {
    const collection = this.collectionContainer.get(cellRange.row, cellRange.col);

    this.collectionContainer.remove(collection.row, collection.col);
  }

  /**
   * TODO: docs (is this function needed?)
   * @param cellRange
   */
  mergeOrUnmergeSelection(cellRange) {
    const collection = this.collectionContainer.get(cellRange.from.row, cellRange.from.col);

    if (collection) {
      // unmerge
      this.unmergeSelection(cellRange.from);
    } else {
      // merge
      this.mergeSelection(cellRange);
    }
  }

  /**
   * TODO: docs
   * @param direction
   * @param index
   * @param count
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
      this.processMergedSection(currentMerge, shiftVector, index);
    }

    for (let i = 0; i < this.collectionContainer.collections.length; i++) {
      let currentMerge = this.collectionContainer.collections[i];
      if (currentMerge.removed) {
        this.collectionContainer.collections.splice(this.collectionContainer.collections.indexOf(currentMerge), 1);
      }
    }

  }

  /**
   * TODO: docs
   * @param mergeInfo
   * @param shiftVector
   * @param indexOfChange
   * @returns {boolean}
   */
  processMergedSection(mergeInfo, shiftVector, indexOfChange) {
    const shiftValue = shiftVector[0] || shiftVector[1];
    const shiftedIndex = indexOfChange + Math.abs(shiftVector[0] || shiftVector[1]) - 1;
    const SPAN = shiftVector[0] ? 'colspan' : 'rowspan';
    const INDEX = shiftVector[0] ? 'col' : 'row';
    const changeStart = Math.min(indexOfChange, shiftedIndex);
    const changeEnd = Math.max(indexOfChange, shiftedIndex);
    const mergeStart = mergeInfo[INDEX];
    const mergeEnd = mergeInfo[INDEX] + mergeInfo[SPAN] - 1;

    if (mergeStart >= indexOfChange) {
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
  }

  /**
   * TODO: docs
   */
  sanitizeRange(range) {
    const totalRows = this.hot.countRows();
    const totalCols = this.hot.countCols();

    if (range.from.row < 0) {
      range.from.row = 0;
    } else if (range.from.row > 0 && range.from.row >= totalRows) {
      range.from.row = range.from - 1;
    }

    if (range.from.col < 0) {
      range.from.col = 0;
    } else if (range.from.col > 0 && range.from.col >= totalCols) {
      range.from.col = totalCols - 1;
    }
  }


  /**
   * TODO: docs
   */
  onModifyTransformStart(delta) {
    const currentlySelectedRange = this.hot.getSelectedRange();
    let newDelta = {
      row: delta.row,
      col: delta.col,
    };
    let nextPosition = null;
    let currentPosition = new CellCoords(currentlySelectedRange.highlight.row, currentlySelectedRange.highlight.col);
    let mergedParent = this.collectionContainer.get(currentPosition.row, currentPosition.col);

    if (!this.lastDesiredCoords) {
      this.lastDesiredCoords = new CellCoords(null, null);
    }

    if (mergedParent) { // only merge selected
      let mergeTopLeft = new CellCoords(mergedParent.row, mergedParent.col);
      let mergeBottomRight = new CellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1);
      let mergeRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

      // TODO: what does it do?
      if (!mergeRange.includes(this.lastDesiredCoords)) {
        this.lastDesiredCoords = new CellCoords(null, null); // reset outdated version of lastDesiredCoords
      }

      newDelta.row = this.lastDesiredCoords.row ? this.lastDesiredCoords.row - currentPosition.row : newDelta.row;
      newDelta.col = this.lastDesiredCoords.col ? this.lastDesiredCoords.col - currentPosition.col : newDelta.col;

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
      this.lastDesiredCoords = nextPosition;
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
   * TODO: docs
   * @param hook
   * @param currentlySelectedRange
   * @param delta
   */
  onModifyTransformEnd(delta) {
    const currentlySelectedRange = this.hot.getSelectedRange();
    let newDelta = {
      row: delta.row,
      col: delta.col,
    };
    let nextPosition = null;
    let currentPosition = new CellCoords(currentlySelectedRange.highlight.row, currentlySelectedRange.highlight.col);

    for (let i = 0, mergesLength = this.collectionContainer.collections.length; i < mergesLength; i++) {
      let currentMerge = this.collectionContainer.collections[i];
      let mergeTopLeft = new CellCoords(currentMerge.row, currentMerge.col);
      let mergeBottomRight = new CellCoords(currentMerge.row + currentMerge.rowspan - 1, currentMerge.col + currentMerge.colspan - 1);
      let mergedRange = new CellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);
      let sharedBorders = currentlySelectedRange.getBordersSharedWith(mergedRange);

      if (mergedRange.isEqual(currentlySelectedRange)) { // only the merged range is selected
        currentlySelectedRange.setDirection('NW-SE');
      } else if (sharedBorders.length > 0) {
        var mergeHighlighted = (currentlySelectedRange.highlight.isEqual(mergedRange.from));

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
   * TODO: docs
   * @param isMultiple
   * @returns {*}
   */
  isMultipleSelection(isMultiple) {
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
   * TODO: docs
   * @param TD
   * @param row
   * @param col
   */
  applySpanProperties(TD, row, col) {
    let info = this.collectionContainer.get(row, col);

    if (info) {
      if (info.row === row && info.col === col) {
        TD.setAttribute('rowspan', info.rowspan);
        TD.setAttribute('colspan', info.colspan);
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

  // TODO: delete this comment, hook callbacks below:


  /**
   * TODO: docs
   */
  onAfterInit() {
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
   * TODO: docs
   * @param event
   */
  onBeforeKeyDown(event) {
    const ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown) {
      if (event.keyCode === 77) { // CTRL + M

        //TODO: rename method to `toggleSth` maybe
        this.mergeOrUnmergeSelection(this.hot.getSelectedRange());

        this.hot.render();
        stopImmediatePropagation(event);
      }
    }
  }

  /**
   * TODO: docs
   * @param defaultOptions
   * @returns {*}
   */
  addMergeActionsToContextMenu(defaultOptions) {
    const plugin = this;

    defaultOptions.items.push({name: '---------'});
    defaultOptions.items.push({
      key: 'mergeCells',
      name() {
        const sel = this.getSelected();
        const info = plugin.collectionContainer.get(sel[0], sel[1]);

        if (info) {
          return 'Unmerge cells';
        }
        return 'Merge cells';

      },
      callback() {
        plugin.mergeOrUnmergeSelection(this.getSelectedRange());
        this.render();
      },
      disabled() {
        return this.selection.selectedHeader.corner;
      },
    });
  }

  /**
   * TODO: docs
   * @param TD
   * @param row
   * @param col
   * @param prop
   * @param value
   * @param cellProperties
   */
  onAfterRenderer(TD, row, col, prop, value, cellProperties) {
    this.applySpanProperties(TD, row, col);
  }

  /**
   * TODO: docs
   * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
   * @param coords
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
        let mergedCellBottomRight = new CellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

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
   * TODO: docs
   * Returns correct coordinates for merged start / end cells in selection for area borders
   * @param corners
   * @param className
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
   * TODO: docs
   * @param row
   * @param col
   * @param cellProperties
   */
  onAfterGetCellMeta(row, col, cellProperties) {
    let mergeParent = this.collectionContainer.get(row, col);
    if (mergeParent && (mergeParent.row !== row || mergeParent.col !== col)) {
      cellProperties.copyable = false;
    }
  }

  /**
   * TODO: docs
   * @param calc
   * @returns {*}
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
   * TODO: docs
   * @param calc
   * @returns {*}
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
   * TODO: docs
   * @param select
   * @param drag
   */
  onModifyAutofillRange(select, drag) {
    if (this.hot.selection.isMultiple()) {
      return;
    }
    let info = this.collectionContainer.get(select[0], select[1]);

    if (info) {
      select[0] = info.row;
      select[1] = info.col;
      select[2] = info.row + info.rowspan - 1;
      select[3] = info.col + info.colspan - 1;
    }
  }

  /**
   * TODO: docs
   * @param col
   * @param count
   */
  onAfterCreateCol(col, count) {
    this.shiftCollection('right', col, count);
  }

  /**
   * TODO: docs
   * @param col
   * @param count
   */
  onAfterRemoveCol(col, count) {
    this.shiftCollection('left', col, count);
  }

  /**
   * TODO: docs
   * @param row
   * @param count
   */
  onAfterCreateRow(row, count) {
    this.shiftCollection('down', row, count);
  }

  /**
   * TODO: docs
   * @param row
   * @param count
   */
  onAfterRemoveRow(row, count) {
    this.shiftCollection('up', row, count);
  }
}

registerPlugin('mergeCells', MergeCells);

export default MergeCells;




