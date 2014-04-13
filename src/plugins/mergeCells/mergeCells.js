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
  var info = this.mergedCellInfoCollection.getInfo(cellRange.row, cellRange.col);
  if (info) {
    //unmerge
    this.unmergeSelection(cellRange);
  }
  else {
    //merge
    this.mergeSelection(cellRange);
  }
};

MergeCells.prototype.mergeSelection = function (cellRange) {
  this.mergeRange(cellRange);
  this.instance.render();
};

MergeCells.prototype.unmergeSelection = function (cellRange) {
  var info = this.mergedCellInfoCollection.getInfo(cellRange.row, cellRange.col);
  this.mergedCellInfoCollection.removeInfo(info.row, info.col);
  this.instance.render();
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
  console.log("modify transform");

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

    if (delta.col != 0) {
      var hightlightMergeParent = this.mergedCellInfoCollection.getInfo(currentSelectedRange.highlight.row, currentSelectedRange.highlight.col);
      if (hightlightMergeParent) {

        if (currentSelectedRange.isSingle()) {
          currentSelectedRange.from = new WalkontableCellCoords(hightlightMergeParent.row, hightlightMergeParent.col);
          currentSelectedRange.to = new WalkontableCellCoords(hightlightMergeParent.row + hightlightMergeParent.rowspan - 1, hightlightMergeParent.col + hightlightMergeParent.colspan - 1);
        }

      }

      var topLeft = currentSelectedRange.getTopLeftCorner();
      var bottomRight = currentSelectedRange.getBottomRightCorner();


      var expanding = false; //expanding false means shrinking
      var examinedCol;
      /*if(delta.col < 0 && bottomRight.col <= currentSelectedRange.highlight.col) {
       expanding = true;
       }
       else if(delta.col > 0 && topLeft.col >= currentSelectedRange.highlight.col) {
       expanding = true;
       }*/

      var colMergedSpan = 0;
      if (hightlightMergeParent) {
        colMergedSpan = hightlightMergeParent.colspan - 1;

      }
      if (bottomRight.col > currentSelectedRange.highlight.col + colMergedSpan) {
        examinedCol = bottomRight.col + delta.col;
        console.log("examinedCol1", examinedCol, colMergedSpan);
      }
      else {
        examinedCol = topLeft.col + delta.col;
        console.log("examinedCol2", examinedCol);

      }
//      if(topLeft.col < currentSelectedRange.highlight.col) {
//        examinedCol = topLeft.col + delta.col;
//      }
//      else {
//        examinedCol = bottomRight.col + delta.col;
//      }

      //if(examinedCol >= 0) {

      console.log("current col", currentSelectedRange.highlight.col, "eximaned", examinedCol);

      if (delta.col < 0 && examinedCol < currentSelectedRange.highlight.col) {
        expanding = true;
      }
      else if (delta.col > 0 && examinedCol > currentSelectedRange.highlight.col) {
        expanding = true;
      }


      console.log(".expanding", expanding, examinedCol, "DELTA", delta, topLeft, currentSelectedRange.highlight);
      console.log(".loop", topLeft.row, bottomRight.row);


      if (expanding) {
        if (delta.col > 0) { //moving East wall further East
          currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, topLeft.col);
          currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.max(bottomRight.col, examinedCol));
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
          console.log("yyyyyyyy1", JSON.stringify(currentSelectedRange));
          //delta.row = 0;
          //delta.col = 0;
        }
        else { //moving West wall further West
          currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.min(topLeft.col, examinedCol));
          currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, bottomRight.col);
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
          console.log("yyyyyyyy2", JSON.stringify(currentSelectedRange));
          //delta.row = 0;
          //delta.col = 0;
        }

      }
      else {
        if (delta.col > 0) { //shrinking West wall towards East
          currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.max(topLeft.col, examinedCol));
          currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, bottomRight.col);
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
          console.log("yyyyyyyy3", JSON.stringify(currentSelectedRange));
          //delta.row = 0;
          //delta.col = 0;
        }
        else { //shrinking East wall towards West
          currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, topLeft.col);
          currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.min(bottomRight.col, examinedCol));
          topLeft = currentSelectedRange.getTopLeftCorner();
          bottomRight = currentSelectedRange.getBottomRightCorner();
          console.log("yyyyyyyy4", JSON.stringify(currentSelectedRange));
          //delta.row = 0;
          //delta.col = 0;
        }
      }


      for (var i = topLeft.row; i <= bottomRight.row; i++) {
        var mergeParent = this.mergedCellInfoCollection.getInfo(i, examinedCol);
        console.log("checking", i, examinedCol, mergeParent);
        if (mergeParent) {
          if (expanding) {
            if (delta.col > 0) { //moving East wall further East
              currentSelectedRange.from = new WalkontableCellCoords(Math.min(topLeft.row, mergeParent.row), Math.min(topLeft.col, mergeParent.col));
              if (examinedCol > mergeParent.col) {
                currentSelectedRange.to = new WalkontableCellCoords(Math.max(bottomRight.row, mergeParent.row + mergeParent.rowspan - 1), Math.max(bottomRight.col, mergeParent.col + mergeParent.colspan));
                console.log("XXX1a", JSON.stringify(currentSelectedRange));

              }
              else {
                currentSelectedRange.to = new WalkontableCellCoords(Math.max(bottomRight.row, mergeParent.row + mergeParent.rowspan - 1), Math.max(bottomRight.col, mergeParent.col + mergeParent.colspan - 1));
                console.log("XXX1b", JSON.stringify(currentSelectedRange));

              }
              topLeft = currentSelectedRange.getTopLeftCorner();
              bottomRight = currentSelectedRange.getBottomRightCorner();
              //delta.row = 0;
              //delta.col = 0;
            }
            else { //moving West wall further West
              currentSelectedRange.from = new WalkontableCellCoords(Math.min(topLeft.row, mergeParent.row), Math.min(topLeft.col, mergeParent.col));
              currentSelectedRange.to = new WalkontableCellCoords(Math.max(bottomRight.row, mergeParent.row + mergeParent.rowspan - 1), Math.max(bottomRight.col, mergeParent.col + mergeParent.colspan - 1));
              topLeft = currentSelectedRange.getTopLeftCorner();
              bottomRight = currentSelectedRange.getBottomRightCorner();
              console.log("XXX2", JSON.stringify(currentSelectedRange));
              //delta.row = 0;
              //delta.col = 0;
            }

          }
          else {
            if (delta.col > 0) { //shrinking West wall towards East
              if (examinedCol > mergeParent.col) {
                currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.max(topLeft.col, mergeParent.col + mergeParent.colspan));
                currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.max(bottomRight.col, mergeParent.col + mergeParent.colspan));

              }
              else {
                currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.max(topLeft.col, mergeParent.col));
                currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.max(bottomRight.col, mergeParent.col + mergeParent.colspan - 1));

              }



              console.log("XXX3", JSON.stringify(currentSelectedRange), bottomRight.col, mergeParent.col + mergeParent.colspan);
              topLeft = currentSelectedRange.getTopLeftCorner();
              bottomRight = currentSelectedRange.getBottomRightCorner();
              //delta.row = 0;
              //delta.col = 0;
            }
            else { //shrinking East wall towards West
              if (examinedCol < mergeParent.col + mergeParent.colspan - 1) {

                currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.min(topLeft.col, mergeParent.col - 1));
                currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.min(bottomRight.col, mergeParent.col - 1));
                console.log("XXX4a", JSON.stringify(currentSelectedRange));

              }
              else {

                currentSelectedRange.from = new WalkontableCellCoords(topLeft.row, Math.min(topLeft.col, mergeParent.col));
                currentSelectedRange.to = new WalkontableCellCoords(bottomRight.row, Math.min(bottomRight.col, mergeParent.col));
                console.log("XXX4b", JSON.stringify(currentSelectedRange));

              }

              topLeft = currentSelectedRange.getTopLeftCorner();
              bottomRight = currentSelectedRange.getBottomRightCorner();
              //delta.row = 0;
              //delta.col = 0;
            }
          }
        }
      }
    }

    // }
    this.lastCell = new WalkontableCellCoords(current.row + delta.row, current.col + delta.col);
    console.log("last cell", this.lastCell);
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
      this.mergeCells.modifyTransform(hook, this.getSelectedRange(), delta)
    }
  }
};

/**
 * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
 * @param coords
 */
var beforeSetRangeStart = function (coords) {
  console.log("selection new");
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    this.mergeCells.lastCell = null;
  }
};
/**
 * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
 * @param coords
 */
var beforeSetRangeEnd = function (coords) {
  this.lastDesiredCoords = null; //unset lastDesiredCoords when selection is changed with mouse
  console.log("selection new finished");

};

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStart', modifyTransformFactory('modifyTransformStart'));
Handsontable.hooks.add('modifyTransformEnd', modifyTransformFactory('modifyTransformEnd'));
Handsontable.hooks.add('beforeSetRangeStart', beforeSetRangeStart);
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);

Handsontable.MergeCells = MergeCells;

