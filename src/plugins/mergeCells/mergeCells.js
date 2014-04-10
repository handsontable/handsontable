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
  var current;
  switch (hook) {
    case 'modifyTransformStartRow':
    case 'modifyTransformStartCol':
      current = currentSelectedRange.from;
      break;

    case 'modifyTransformEndRow':
    case 'modifyTransformEndCol':
      current = currentSelectedRange.to;
      break;
  }
  //debugger;
  var mergeParent = this.mergedCellInfoCollection.getInfo(current.row, current.col);
  if (mergeParent) {
    switch (hook) {
      case 'modifyTransformStartRow':
      case 'modifyTransformEndRow':
        if (delta > 0) {
          return mergeParent.row - current.row + mergeParent.rowspan - 1 + delta;
        }
        else if (delta < 0) {
          return mergeParent.row - current.row + delta;
        }
        break;

      case 'modifyTransformStartCol':
      case 'modifyTransformEndCol':
        if (delta > 0) {
          return mergeParent.col - current.col + mergeParent.colspan - 1 + delta;
        }
        else if (delta < 0) {
          return mergeParent.col - current.col + delta;
        }
        break;
    }
  }
  return delta;
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
      return this.mergeCells.modifyTransform(hook, this.getSelectedRange(), delta)
    }
    else {
      return delta;
    }
  }
};

/**
 * While selecting cells with keyboard or mouse, make sure that rectangular area is expanded to the extent of the merged cell
 * @param coords
 */
var beforeSetRangeEnd = function (coords) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var selRange = this.getSelectedRange();
    selRange.to = coords;

    for (var i = 0, ilen = this.mergeCells.mergedCellInfoCollection.length; i < ilen; i++) {
      var cellInfo = this.mergeCells.mergedCellInfoCollection[i];
      var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
      var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

      var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellBottomRight);

      if (selRange.expandByRange(mergedCellRange)) {
        var selRangeBottomRight = selRange.getBottomRightCorner();
        coords.row = selRangeBottomRight.row;
        coords.col = selRangeBottomRight.col;
      }
    }
  }
};

Handsontable.hooks.add('beforeInit', init);
Handsontable.hooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.hooks.add('modifyTransformStartRow', modifyTransformFactory('modifyTransformStartRow'));
Handsontable.hooks.add('modifyTransformStartCol', modifyTransformFactory('modifyTransformStartCol'));
Handsontable.hooks.add('modifyTransformEndRow', modifyTransformFactory('modifyTransformEndRow'));
Handsontable.hooks.add('modifyTransformEndCol', modifyTransformFactory('modifyTransformEndCol'));
Handsontable.hooks.add('beforeSetRangeEnd', beforeSetRangeEnd);
Handsontable.hooks.add('afterRenderer', afterRenderer);
Handsontable.hooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);

Handsontable.MergeCells = MergeCells;

