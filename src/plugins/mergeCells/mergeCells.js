function CellInfoCollection() {
  this.data = {};
}

CellInfoCollection.prototype.getInfo = function (row, col) {
  var rowData = this.data[row];
  if (!rowData) {
    this.data[row] = {};
    rowData = this.data[row];
  }
  var cellData = rowData[col];
  if (!cellData) {
    rowData[col] = {};
    cellData = rowData[col];
  }
  return cellData;
};

function MergedCellInfo(cellCoords, cellRange, mergedCellCoords, isMergedStart) {
  this.cellCoords = cellCoords;
  this.cellRange = cellRange;
  this.mergedCellCoords = mergedCellCoords;
  this.isMergedStart = isMergedStart;
}

/**
 * Plugin used to merge cells in Handsontable
 * @constructor
 */
function MergeCells(instance) {
  this.instance = instance;
  this.mergedCellInfo = new CellInfoCollection();
}

/**
 * @param cellRange (WalkontableCellRange)
 */
MergeCells.prototype.canMergeRange = function (cellRange) {
  //is more than one cell selected
  if (cellRange.isSingle()) {
    return false;
  }

  //is it a valid cell range
  if (!cellRange.isValid(this.instance.view.wt)) {
    return false;
  }

  return true;
};

MergeCells.prototype.mergeRange = function (cellRange) {
  if (!this.canMergeRange(cellRange)) {
    return;
  }

  //normalize top left corner
  var topLeft = cellRange.getTopLeftCorner();
  var bottomRight = cellRange.getBottomRightCorner();

  var info = this.mergedCellInfo.getInfo(topLeft._row, topLeft._col);
  info.rowspan = bottomRight._row - topLeft._row + 1; //TD has rowspan == 1 by default. rowspan == 2 means spread over 2 cells
  info.colspan = bottomRight._col - topLeft._col + 1;
  info.mergedCellInfo = new MergedCellInfo(topLeft, cellRange, topLeft, true);

  var that = this;
  var all = cellRange.getInner();
  all.push(bottomRight);
  all.map(function (cellCoords) {
    var mergedCellInfo = new MergedCellInfo(cellCoords, cellRange, topLeft, false);
    var info = that.mergedCellInfo.getInfo(cellCoords._row, cellCoords._col);
    info.mergedCellInfo = mergedCellInfo;
  });
};

MergeCells.prototype.unmergeRange = function (cellRange) {
  //normalize top left corner
  var topLeft = cellRange.getTopLeftCorner();
  var bottomRight = cellRange.getBottomRightCorner();

  var that = this;
  var all = cellRange.getInner();
  all.push(topLeft);
  all.push(bottomRight);
  all.map(function (cellCoords) {
    var info = that.mergedCellInfo.getInfo(cellCoords._row, cellCoords._col);
    info.rowspan = null;
    info.colspan = null;
    info.mergedCellInfo = null;
  });
};

MergeCells.prototype.mergeSelection = function () {
  var sel = this.instance.getSelected();
  var cellRange = new WalkontableCellRange(new WalkontableCellCoords(sel[0], sel[1]), new WalkontableCellCoords(sel[2], sel[3]));
  this.mergeRange(cellRange);
  this.instance.render();
};

MergeCells.prototype.unmergeSelection = function () {
  var sel = this.instance.getSelected();
  var mergedCellInfo = this.mergedCellInfo.getInfo(sel[0], sel[1]);
  this.unmergeRange(mergedCellInfo.mergedCellInfo.cellRange);
  this.instance.render();
};

MergeCells.prototype.applySpanProperties = function (TD, row, col) {
  var info = this.mergedCellInfo.getInfo(row, col);
  if (info.mergedCellInfo) {
    if (info.mergedCellInfo.isMergedStart) {
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

if (typeof Handsontable !== 'undefined') {
  var init = function () {
    var instance = this;
    var mergeCellsSetting = instance.getSettings().mergeCells;

    //mergeCellsSetting = true;

    if (mergeCellsSetting) {
      if (!instance.mergeCells) {
        instance.mergeCells = new MergeCells(instance);
      }
    }
    else if (instance.mergeCells) {
      instance.mergeCells.destroy();
      delete instance.mergeCells;
    }
  };

  Handsontable.PluginHooks.add('afterInit', init);

  var onBeforeKeyDown = function (event) {
    if (!this.mergeCells) {
      return;
    }

    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (ctrlDown) {
      if (event.keyCode === 77) { //CTRL + M
        this.mergeCells.mergeSelection();
        event.stopImmediatePropagation();
      }
    }
  };

  Handsontable.PluginHooks.add('beforeKeyDown', onBeforeKeyDown);


  Handsontable.PluginHooks.add('afterContextMenuDefaultOptions', function (defaultOptions) {
    if (!this.getSettings().mergeCells) {
      return;
    }

    defaultOptions.items.mergeCellsSeparator = Handsontable.ContextMenu.SEPARATOR;

    defaultOptions.items.mergeCells = {
      name: function () {
        var sel = this.getSelected();
        var mergedCellInfo = this.mergeCells.mergedCellInfo.getInfo(sel[0], sel[1]);
        if (mergedCellInfo.mergedCellInfo) {
          return 'Unmerge cells';
        }
        else {
          return 'Merge cells';
        }
      },
      callback: function () {
        var sel = this.getSelected();
        var mergedCellInfo = this.mergeCells.mergedCellInfo.getInfo(sel[0], sel[1]);
        if (mergedCellInfo.mergedCellInfo) {
          //unmerge
          this.mergeCells.unmergeSelection();
        }
        else {
          //merge
          this.mergeCells.mergeSelection();
        }
      },
      disabled: function () {
        return false;
      }
    };
  });

  Handsontable.PluginHooks.add('afterRenderer', function (TD, row, col, prop, value, cellProperties) {
    if (this.mergeCells) {
      this.mergeCells.applySpanProperties(TD, row, col);
    }
  });

  Handsontable.MergeCells = MergeCells;
}
