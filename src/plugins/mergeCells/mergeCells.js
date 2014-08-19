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

  if (Handsontable.helper.isArray(mergeCellsSetting)) {
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
      TD.style.display = "none";
    }
  }
  else {
    TD.removeAttribute('rowspan');
    TD.removeAttribute('colspan');
  }
};

MergeCells.prototype.modifyTransform = function (hook, currentSelectedRange, delta) {
  var current;
  switch (hook) {
    case 'modifyTransformStart':
      current = currentSelectedRange.highlight;
      break;

    case 'modifyTransformEnd':
      current = currentSelectedRange.to;
      break;
  }

  if (hook == "modifyTransformStart") {
    //in future - can this take the logic from modifyTransformEnd?
    var mergeParent = this.mergedCellInfoCollection.getInfo(current.row + delta.row, current.col + delta.col);
    if (mergeParent) {
      if (current.row > mergeParent.row) { //entering merge by going up or left
        this.lastDesiredCoords = new WalkontableCellCoords(current.row + delta.row, current.col + delta.col); //copy
        delta.row += (mergeParent.row - current.row) - delta.row;
      }
      else if (current.row == mergeParent.row && delta.row > 0) { //leaving merge by going down
        delta.row += mergeParent.row - current.row + mergeParent.rowspan - 1;
      }
      else { //leaving merge by going right
        if (this.lastDesiredCoords && delta.row === 0) {
          delta.row += this.lastDesiredCoords.row - current.row;
          this.lastDesiredCoords = null;
        }
      }

      if (current.col > mergeParent.col) { //entering merge by going up or left
        if (!this.lastDesiredCoords) {
          this.lastDesiredCoords = new WalkontableCellCoords(current.row + delta.row, current.col + delta.col); //copy
        }
        delta.col += (mergeParent.col - current.col) - delta.col;
      }
      else if (current.col == mergeParent.col && delta.col > 0) { //leaving merge by going right
        delta.col += mergeParent.col - current.col + mergeParent.colspan - 1;
      }
      else { //leaving merge by going down
        if (this.lastDesiredCoords && delta.col === 0) {
          delta.col += this.lastDesiredCoords.col - current.col;
          this.lastDesiredCoords = null;
        }
      }
    }
    else {
      if (this.lastDesiredCoords) {
        if (delta.col == 0) { //leaving merge by going up
          delta.col += this.lastDesiredCoords.col - current.col;
        }
        else if (delta.row == 0) { //leaving merge by going left
          delta.row += this.lastDesiredCoords.row - current.row;
        }
        this.lastDesiredCoords = null;
      }
    }
  }
  else {
    //modify transform end
    var hightlightMergeParent = this.mergedCellInfoCollection.getInfo(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
    if (hightlightMergeParent) {
      if (currentSelectedRange.isSingle()) {
        currentSelectedRange.from = new WalkontableCellCoords(hightlightMergeParent.row, hightlightMergeParent.col);
        currentSelectedRange.to = new WalkontableCellCoords(hightlightMergeParent.row + hightlightMergeParent.rowspan - 1, hightlightMergeParent.col + hightlightMergeParent.colspan - 1);
      }
    }

    if (currentSelectedRange.isSingle()) {
      //make sure objects are clones but not reference to the same instance
      //because we will mutate them
      currentSelectedRange.from = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
      currentSelectedRange.to = new WalkontableCellCoords(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
    }

    var solveDimension = function (dim) {
      var altDim = dim == "col" ? "row" : "col";

      function changeCoords(obj, altDimValue, dimValue) {
        obj[altDim] = altDimValue;
        obj[dim] = dimValue;
      }

      if (delta[dim] != 0) {
        var topLeft;
        var bottomRight;

        var updateCornerInfo = function () {
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
        };
        updateCornerInfo();

        var expanding = false; //expanding false means shrinking
        var examinedCol;
        //now check if maybe we are expanding?
        if (delta[dim] < 0) {
          examinedCol = bottomRight[dim] + delta[dim];
          if (bottomRight[dim] == currentSelectedRange.highlight[dim]) {
            examinedCol = topLeft[dim] + delta[dim];
            expanding = true;
          }
          else {
            for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
              var mergeParent = this.mergedCellInfoCollection.getInfo(i, bottomRight[dim]);
              if (mergeParent) {
                if (mergeParent[dim] <= currentSelectedRange.highlight[dim]) {
                  examinedCol = topLeft[dim] + delta[dim];
                  expanding = true;
                  break;
                }
              }
            }
          }
        }
        else if (delta[dim] > 0) {
          examinedCol = topLeft[dim] + delta[dim];
          if (topLeft[dim] == currentSelectedRange.highlight[dim]) {
            examinedCol = bottomRight[dim] + delta[dim];
            expanding = true;
          }
          else {
            for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
              var mergeParent = this.mergedCellInfoCollection.getInfo(i, topLeft[dim]);
              if (mergeParent) {
                if (mergeParent[dim] + mergeParent[dim + "span"] > currentSelectedRange.highlight[dim]) {
                  examinedCol = bottomRight[dim] + delta[dim];
                  expanding = true;
                  break;
                }
              }
            }
          }
        }

        if (expanding) {
          if (delta[dim] > 0) { //moving East wall further East
            changeCoords(currentSelectedRange.from, topLeft[altDim], topLeft[dim]);
            changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], examinedCol));
            updateCornerInfo();
          }
          else { //moving West wall further West
            changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], examinedCol));
            changeCoords(currentSelectedRange.to, bottomRight[altDim], bottomRight[dim]);
            updateCornerInfo();
          }

        }
        else {
          if (delta[dim] > 0) { //shrinking West wall towards East
            changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], examinedCol));
            changeCoords(currentSelectedRange.to, bottomRight[altDim], bottomRight[dim]);
            updateCornerInfo();
          }
          else { //shrinking East wall towards West
            changeCoords(currentSelectedRange.from, topLeft[altDim], topLeft[dim]);
            changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], examinedCol));
            updateCornerInfo();
          }
        }

        for (var i = topLeft[altDim]; i <= bottomRight[altDim]; i++) {
          var mergeParent = dim == "col" ? this.mergedCellInfoCollection.getInfo(i, examinedCol) : this.mergedCellInfoCollection.getInfo(examinedCol, i);
          if (mergeParent) {
            if (expanding) {
              if (delta[dim] > 0) { //moving East wall further East
                changeCoords(currentSelectedRange.from, Math.min(topLeft[altDim], mergeParent[altDim]), Math.min(topLeft[dim], mergeParent[dim]));
                if (examinedCol > mergeParent[dim]) {
                  changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                else {
                  changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                }
                updateCornerInfo();
              }
              else { //moving West wall further West
                changeCoords(currentSelectedRange.from, Math.min(topLeft[altDim], mergeParent[altDim]), Math.min(topLeft[dim], mergeParent[dim]));
                changeCoords(currentSelectedRange.to, Math.max(bottomRight[altDim], mergeParent[altDim] + mergeParent[altDim + "span"] - 1), Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                updateCornerInfo();
              }
            }
            else {
              if (delta[dim] > 0) { //shrinking West wall towards East
                if (examinedCol > mergeParent[dim]) {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                else {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.max(topLeft[dim], mergeParent[dim]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.max(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"] - 1));
                }
                updateCornerInfo();
              }
              else { //shrinking East wall towards West
                if (examinedCol < mergeParent[dim] + mergeParent[dim + "span"] - 1) {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], mergeParent[dim] - 1));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], mergeParent[dim] - 1));
                }
                else {
                  changeCoords(currentSelectedRange.from, topLeft[altDim], Math.min(topLeft[dim], mergeParent[dim]));
                  changeCoords(currentSelectedRange.to, bottomRight[altDim], Math.min(bottomRight[dim], mergeParent[dim] + mergeParent[dim + "span"]));
                }
                updateCornerInfo();
              }
            }
          }
        }

        /*if (expanding) {
         //check if corners are not part of merged cells as well
         var oneLastCheck = function (row, col) {
         var mergeParent = this.mergedCellInfoCollection.getInfo(row, col);
         if (mergeParent) {
         currentSelectedRange.expand(new WalkontableCellCoords(mergeParent.row, mergeParent.col));
         currentSelectedRange.expand(new WalkontableCellCoords(mergeParent.row + mergeParent.rowspan - 1, mergeParent.col + mergeParent.colspan - 1));
         updateCornerInfo();
         }
         }
         oneLastCheck.call(this, topLeft.row, topLeft.col);
         oneLastCheck.call(this, topLeft.row, bottomRight.col);
         oneLastCheck.call(this, bottomRight.row, bottomRight.col);
         oneLastCheck.call(this, bottomRight.row, topLeft.col);
         }
         else {
         //TODO there is still a glitch if you go to merge_cells.html, go to D5 and press up, right, down
         }*/
      }
    };

    solveDimension.call(this, "col");
    solveDimension.call(this, "row");

    delta.row = 0;
    delta.col = 0;
  }
};

if (typeof Handsontable == 'undefined') {
  throw new Error('Handsontable is not defined');
}

var init = function () {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;

  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(mergeCellsSetting);
    }
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

  defaultOptions.items.mergeCellsSeparator = Handsontable.ContextMenu.SEPARATOR;

  defaultOptions.items.mergeCells = {
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
  };
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

    for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
      var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
      var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
      var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

      var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellTopLeft, mergedCellBottomRight);
      if (selRange.expandByRange(mergedCellRange)) {
        var selRangeBottomRight = selRange.getBottomRightCorner();
        coords.row = selRangeBottomRight.row;
        coords.col = selRangeBottomRight.col;
      }
    }
  }
};

/**
 * Returns correct coordinates for merged start / end cells in selection for area borders
 * @param corners
 * @param className
 */
var beforeDrawAreaBorders = function (corners, className) {
  if (className && className == 'area'){
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

  // Remove 'area' from the class cache if a single merged group is selected
  var currentCellCache = this.view.wt.wtTable.currentCellCache.cache
    , mergedGroup = this.mergeCells ? this.mergeCells.mergedCellInfoCollection : void 0
    , selRange = selRange || this.getSelectedRange();

  if (mergedGroup && currentCellCache.length > 0)
    for (var i = 0, ilen = mergedGroup.length; i < ilen; i++) {

      selRange = this.getSelectedRange();

      if (selRange.from.row == mergedGroup[i].row
        && selRange.to.row == mergedGroup[i].row + mergedGroup[i].rowspan - 1
        && selRange.from.col == mergedGroup[i].col
        && selRange.to.col == mergedGroup[i].col + mergedGroup[i].colspan - 1) {

          if (currentCellCache[mergedGroup[i].row]
            && currentCellCache[mergedGroup[i].row][mergedGroup[i].col]
            && currentCellCache[mergedGroup[i].row][mergedGroup[i].col].area) {
//            console.log(currentCellCache[mergedGroup[i].row][mergedGroup[i].col].area);
//              currentCellCache[mergedGroup[i].row][mergedGroup[i].col].area = void 0;
                this.view.wt.wtTable.currentCellCache.remove(mergedGroup[i].row,mergedGroup[i].col,'area');
            break;

          }
      }
    }
};

var afterGetCellMeta = function(row, col, cellProperties) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(row, col);
    if(mergeParent && (mergeParent.row != row || mergeParent.col != col)) {
      cellProperties.copyable = false;
    }
  }
};

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('beforeDrawBorders', beforeDrawAreaBorders);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);
Handsontable.hooks.add('afterGetCellMeta', afterGetCellMeta);

Handsontable.MergeCells = MergeCells;

