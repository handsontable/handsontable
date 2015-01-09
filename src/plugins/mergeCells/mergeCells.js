function CellInfoCollection() {

  var collection = [];

  collection.getInfo = function (row, col) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row <= row && this[i].row + this[i].rowspan - 1 >= row && this[i].col <= col && this[i].col + this[i].colspan - 1 >= col) {
        return this[i];
      }
    }
  };

  collection.setInfo = function (info) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row === info.row && this[i].col === info.col) {
        this[i] = info;
        return;
      }
    }
    this.push(info);
  };

  collection.removeInfo = function (row, col) {
    for (var i = 0, ilen = this.length; i < ilen; i++) {
      if (this[i].row === row && this[i].col === col) {
        this.splice(i, 1);
        break;
      }
    }
  };

  return collection;

}


/**
 * Plugin used to merge cells in Handsontable
 * @constructor
 */
function MergeCells(mergeCellsSetting) {
  this.mergedCellInfoCollection = new CellInfoCollection();

  if (Array.isArray(mergeCellsSetting)) {
    for (var i = 0, ilen = mergeCellsSetting.length; i < ilen; i++) {
      this.mergedCellInfoCollection.setInfo(mergeCellsSetting[i]);
    }
  }
}

/**
 * @param cellRange (WalkontableCellRange)
 */
MergeCells.prototype.canMergeRange = function (cellRange) {
  //is more than one cell selected
  return !cellRange.isSingle();
};

MergeCells.prototype.mergeRange = function (cellRange) {
  if (!this.canMergeRange(cellRange)) {
    return;
  }

  //normalize top left corner
  var topLeft = cellRange.getTopLeftCorner();
  var bottomRight = cellRange.getBottomRightCorner();

  var mergeParent = {};
  mergeParent.row = topLeft.row;
  mergeParent.col = topLeft.col;
  mergeParent.rowspan = bottomRight.row - topLeft.row + 1; //TD has rowspan == 1 by default. rowspan == 2 means spread over 2 cells
  mergeParent.colspan = bottomRight.col - topLeft.col + 1;
  this.mergedCellInfoCollection.setInfo(mergeParent);
};

MergeCells.prototype.mergeOrUnmergeSelection = function (cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.from.row, cellRange.from.col);
  if (info) {
    //unmerge
    this.unmergeSelection(cellRange.from);
  }
  else {
    //merge
    this.mergeSelection(cellRange);
  }
};

MergeCells.prototype.mergeSelection = function (cellRange) {
  this.mergeRange(cellRange);
};

MergeCells.prototype.unmergeSelection = function (cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.row, cellRange.col);
  this.mergedCellInfoCollection.removeInfo(info.row, info.col);
};

MergeCells.prototype.applySpanProperties = function (TD, row, col) {
  var info = this.mergedCellInfoCollection.getInfo(row, col);

  if (info) {
    if (info.row === row && info.col === col) {
      TD.setAttribute('rowspan', info.rowspan);
      TD.setAttribute('colspan', info.colspan);
    }
    else {
      TD.removeAttribute('rowspan');
      TD.removeAttribute('colspan');

      TD.style.display = "none";
    }
  }
  else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');
  }
};

MergeCells.prototype.modifyTransform = function (hook, currentSelectedRange, delta) {
  var sameRowspan = function (merged, coords) {
      if (coords.row >= merged.row && coords.row <= (merged.row + merged.rowspan - 1)) {
        return true;
      }
      return false;
    }
    , sameColspan = function (merged, coords) {
      if (coords.col >= merged.col && coords.col <= (merged.col + merged.colspan - 1)) {
        return true;
      }
      return false;
    }
    , getNextPosition = function (newDelta) {
      return new WalkontableCellCoords(currentSelectedRange.to.row + newDelta.row, currentSelectedRange.to.col + newDelta.col);
    };

  var newDelta = {
    row: delta.row,
    col: delta.col
  };


  if (hook == 'modifyTransformStart') {

    if (!this.lastDesiredCoords) {
      this.lastDesiredCoords = new WalkontableCellCoords(null, null);
    }
    var currentPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col)
      , mergedParent = this.mergedCellInfoCollection.getInfo(currentPosition.row, currentPosition.col)// if current position's parent is a merged range, returns it
      , currentRangeContainsMerge; // if current range contains a merged range

    for (var i = 0, mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var range = this.mergedCellInfoCollection[i];
      range = new WalkontableCellCoords(range.row + range.rowspan - 1, range.col + range.colspan - 1);
      if (currentSelectedRange.includes(range)) {
        currentRangeContainsMerge = true;
        break;
      }
    }

    if (mergedParent) { // only merge selected
      var mergeTopLeft = new WalkontableCellCoords(mergedParent.row, mergedParent.col)
        , mergeBottomRight = new WalkontableCellCoords(mergedParent.row + mergedParent.rowspan - 1, mergedParent.col + mergedParent.colspan - 1)
        , mergeRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight);

      if (!mergeRange.includes(this.lastDesiredCoords)) {
        this.lastDesiredCoords = new WalkontableCellCoords(null, null); // reset outdated version of lastDesiredCoords
      }

      newDelta.row = this.lastDesiredCoords.row ? this.lastDesiredCoords.row - currentPosition.row : newDelta.row;
      newDelta.col = this.lastDesiredCoords.col ? this.lastDesiredCoords.col - currentPosition.col : newDelta.col;

      if (delta.row > 0) { // moving down
        newDelta.row = mergedParent.row + mergedParent.rowspan - 1 - currentPosition.row + delta.row;
      } else if (delta.row < 0) { //moving up
        newDelta.row = currentPosition.row - mergedParent.row + delta.row;
      }
      if (delta.col > 0) { // moving right
        newDelta.col = mergedParent.col + mergedParent.colspan - 1 - currentPosition.col + delta.col;
      } else if (delta.col < 0) { // moving left
        newDelta.col = currentPosition.col - mergedParent.col + delta.col;
      }
    }

    var nextPosition = new WalkontableCellCoords(currentSelectedRange.highlight.row + newDelta.row, currentSelectedRange.highlight.col + newDelta.col)
      , nextParentIsMerged = this.mergedCellInfoCollection.getInfo(nextPosition.row, nextPosition.col);

    if (nextParentIsMerged) { // skipping the invisible cells in the merge range
      this.lastDesiredCoords = nextPosition;
      newDelta = {
        row: nextParentIsMerged.row - currentPosition.row,
        col: nextParentIsMerged.col - currentPosition.col
      }
    }
  } else if (hook == 'modifyTransformEnd') {
    for (var i = 0, mergesLength = this.mergedCellInfoCollection.length; i < mergesLength; i++) {
      var currentMerge = this.mergedCellInfoCollection[i]
        , mergeTopLeft = new WalkontableCellCoords(currentMerge.row, currentMerge.col)
        , mergeBottomRight = new WalkontableCellCoords(currentMerge.row + currentMerge.rowspan - 1, currentMerge.col + currentMerge.colspan - 1)
        , mergedRange = new WalkontableCellRange(mergeTopLeft, mergeTopLeft, mergeBottomRight)
        , sharedBorders = currentSelectedRange.getBordersSharedWith(mergedRange);

      if (mergedRange.isEqual(currentSelectedRange)) { // only the merged range is selected
        currentSelectedRange.setDirection("NW-SE");
      }
      else if (sharedBorders.length > 0) {
        var mergeHighlighted = (currentSelectedRange.highlight.isEqual(mergedRange.from));

        if (sharedBorders.indexOf('top') > -1) { // if range shares a border with the merged section, change range direction accordingly
          if (currentSelectedRange.to.isSouthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NW-SE");
          } else if (currentSelectedRange.to.isSouthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("NE-SW");
          }
        } else if (sharedBorders.indexOf('bottom') > -1) {
          if (currentSelectedRange.to.isNorthEastOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SW-NE");
          } else if (currentSelectedRange.to.isNorthWestOf(mergedRange.from) && mergeHighlighted) {
            currentSelectedRange.setDirection("SE-NW");
          }
        }
      }

      var nextPosition = getNextPosition(newDelta)
        , withinRowspan = sameRowspan(currentMerge, nextPosition)
        , withinColspan = sameColspan(currentMerge, nextPosition);

      if (currentSelectedRange.includesRange(mergedRange) && (mergedRange.includes(nextPosition) || withinRowspan || withinColspan)) { // if next step overlaps a merged range, jump past it
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
  }

  if (newDelta.row != 0) delta.row = newDelta.row;
  if (newDelta.col != 0) delta.col = newDelta.col;
};

if (typeof Handsontable == 'undefined') {
  throw new Error('Handsontable is not defined');
}

var beforeInit = function () {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;

  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(mergeCellsSetting);
    }
  }
};

var afterInit = function () {
  var instance = this;
  if (instance.mergeCells) {
    /**
     * Monkey patch WalkontableTable.prototype.getCell to return TD for merged cell parent if asked for TD of a cell that is
     * invisible due to the merge. This is not the cleanest solution but there is a test case for it (merged cells scroll) so feel free to refactor it!
     */
    instance.view.wt.wtTable.getCell = function (coords) {
      if (instance.getSettings().mergeCells) {
        var mergeParent = instance.mergeCells.mergedCellInfoCollection.getInfo(coords.row, coords.col);
        if (mergeParent) {
          coords = mergeParent;
        }
      }
      return WalkontableTable.prototype.getCell.call(this, coords);
    };
  }
};

var onBeforeKeyDown = function (event) {
  if (!this.mergeCells) {
    return;
  }

  var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

  if (ctrlDown) {
    if (event.keyCode === 77) { //CTRL + M
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
      event.stopImmediatePropagation();
    }
  }
};

var addMergeActionsToContextMenu = function (defaultOptions) {
  if (!this.getSettings().mergeCells) {
    return;
  }

  defaultOptions.items.push(Handsontable.ContextMenu.SEPARATOR);

  defaultOptions.items.push({
    key: 'mergeCells',
    name: function () {
      var sel = this.getSelected();
      var info = this.mergeCells.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
      if (info) {
        return 'Unmerge cells';
      }
      else {
        return 'Merge cells';
      }
    },
    callback: function () {
      this.mergeCells.mergeOrUnmergeSelection(this.getSelectedRange());
      this.render();
    },
    disabled: function () {
      return false;
    }
  });
};

var afterRenderer = function (TD, row, col, prop, value, cellProperties) {
  if (this.mergeCells) {
    this.mergeCells.applySpanProperties(TD, row, col);
  }
};

var modifyTransformFactory = function (hook) {
  return function (delta) {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var currentSelectedRange = this.getSelectedRange();
      this.mergeCells.modifyTransform(hook, currentSelectedRange, delta);

      if (hook === "modifyTransformEnd") {
        //sanitize "from" (core.js will sanitize to)
        var totalRows = this.countRows();
        var totalCols = this.countCols();
        if (currentSelectedRange.from.row < 0) {
          currentSelectedRange.from.row = 0;
        }
        else if (currentSelectedRange.from.row > 0 && currentSelectedRange.from.row >= totalRows) {
          currentSelectedRange.from.row = currentSelectedRange.from - 1;
        }

        if (currentSelectedRange.from.col < 0) {
          currentSelectedRange.from.col = 0;
        }
        else if (currentSelectedRange.from.col > 0 && currentSelectedRange.from.col >= totalCols) {
          currentSelectedRange.from.col = totalCols - 1;
        }
      }
    }
  }
};

/**
 * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
 * @param coords
 */
var beforeSetRangeEnd = function (coords) {

  this.lastDesiredCoords = null; //unset lastDesiredCoords when selection is changed with mouse
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var selRange = this.getSelectedRange();
    selRange.highlight = new WalkontableCellCoords(selRange.highlight.row, selRange.highlight.col); //clone in case we will modify its reference
    selRange.to = coords;

    var rangeExpanded = false;
    do {
      rangeExpanded = false;

      for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
        if (selRange.expandByRange(mergedCellRange)) {
          coords.row = selRange.to.row;
          coords.col = selRange.to.col;

          rangeExpanded = true;
        }
      }
    } while (rangeExpanded);

  }
};

/**
 * Returns correct coordinates for merged start / end cells in selection for area borders
 * @param corners
 * @param className
 */
var beforeDrawAreaBorders = function (corners, className) {
  if (className && className == 'area') {
    var mergeCellsSetting = this.getSettings().mergeCells;
    if (mergeCellsSetting) {
      var selRange = this.getSelectedRange();
      var startRange = new WalkontableCellRange(selRange.from, selRange.from, selRange.from);
      var stopRange = new WalkontableCellRange(selRange.to, selRange.to, selRange.to);

      for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
        var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
        var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
        var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);
        var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);

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
};

var afterGetCellMeta = function (row, col, cellProperties) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(row, col);
    if (mergeParent && (mergeParent.row != row || mergeParent.col != col)) {
      cellProperties.copyable = false;
    }
  }
};

var afterViewportRowCalculatorOverride = function (calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var colCount = this.countCols();
    var mergeParent;
    for (var c = 0; c < colCount; c++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.startRow, c);
      if (mergeParent) {
        if (mergeParent.row < calc.startRow) {
          calc.startRow = mergeParent.row;
          return afterViewportRowCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(calc.endRow, c);
      if (mergeParent) {
        var mergeEnd = mergeParent.row + mergeParent.rowspan - 1;
        if (mergeEnd > calc.endRow) {
          calc.endRow = mergeEnd;
          return afterViewportRowCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
    }
  }
};

var afterViewportColumnCalculatorOverride = function (calc) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var rowCount = this.countRows();
    var mergeParent;
    for (var r = 0; r < rowCount; r++) {
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.startColumn);

      if (mergeParent) {
        if (mergeParent.col < calc.startColumn) {
          calc.startColumn = mergeParent.col;
          return afterViewportColumnCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
      mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(r, calc.endColumn);
      if (mergeParent) {
        var mergeEnd = mergeParent.col + mergeParent.colspan - 1;
        if (mergeEnd > calc.endColumn) {
          calc.endColumn = mergeEnd;
          return afterViewportColumnCalculatorOverride.call(this, calc); //recursively search upwards
        }
      }
    }
  }
};

var isMultipleSelection = function (isMultiple) {
  if (isMultiple && this.mergeCells) {
    var mergedCells = this.mergeCells.mergedCellInfoCollection
      , selectionRange = this.getSelectedRange();

    for (var group in mergedCells) {
      if (selectionRange.highlight.row == mergedCells[group].row && selectionRange.highlight.col == mergedCells[group].col
        && selectionRange.to.row == mergedCells[group].row + mergedCells[group].rowspan - 1
        && selectionRange.to.col == mergedCells[group].col + mergedCells[group].colspan - 1) {
        return false;
      }
    }
  }
  return isMultiple;
};

Handsontable.hooks.add('beforeInit', beforeInit);
Handsontable.hooks.add('afterInit', afterInit);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('beforeDrawBorders', beforeDrawAreaBorders);
Handsontable.hooks.add('afterIsMultipleSelection', isMultipleSelection);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);
Handsontable.hooks.add('afterGetCellMeta', afterGetCellMeta);
Handsontable.hooks.add('afterViewportRowCalculatorOverride', afterViewportRowCalculatorOverride);
Handsontable.hooks.add('afterViewportColumnCalculatorOverride', afterViewportColumnCalculatorOverride);

Handsontable.MergeCells = MergeCells;

