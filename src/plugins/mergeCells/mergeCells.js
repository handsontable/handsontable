function CellInfoCollection(initialCollection) {

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

  if (Handsontable.helper.isArray(initialCollection)){
    initialCollection.forEach(function (mergeCellInfo){
      collection.setInfo(mergeCellInfo);
    });
  }

  return collection;

}



/**
 * Plugin used to merge cells in Handsontable
 * @constructor
 */
function MergeCells(instance) {
  this.instance = instance;
  this.mergedCellInfoCollection = new CellInfoCollection(instance.getSettings().mergeCells);
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

  var mergeParent = {};
  mergeParent.row = topLeft.row;
  mergeParent.col = topLeft.col;
  mergeParent.rowspan = bottomRight.row - topLeft.row + 1; //TD has rowspan == 1 by default. rowspan == 2 means spread over 2 cells
  mergeParent.colspan = bottomRight.col - topLeft.col + 1;
  this.mergedCellInfoCollection.setInfo(mergeParent);
};

MergeCells.prototype.mergeOrUnmergeSelection = function () {
  var sel = this.instance.getSelected();
  var info = this.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
  if (info) {
    //unmerge
    this.unmergeSelection();
  }
  else {
    //merge
    this.mergeSelection();
  }
};

MergeCells.prototype.mergeSelection = function () {
  var sel = this.instance.getSelected();
  var cellRange = new WalkontableCellRange(new WalkontableCellCoords(sel[0], sel[1]), new WalkontableCellCoords(sel[2], sel[3]));
  this.mergeRange(cellRange);
  this.instance.render();
};

MergeCells.prototype.unmergeSelection = function () {
  var sel = this.instance.getSelected();
  var info = this.mergedCellInfoCollection.getInfo(sel[0], sel[1]);
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

if (typeof Handsontable == 'undefined') {
  throw new Error('Handsontable is not defined');
}

var init = function () {
  var instance = this;
  var mergeCellsSetting = instance.getSettings().mergeCells;

  if (mergeCellsSetting) {
    if (!instance.mergeCells) {
      instance.mergeCells = new MergeCells(instance);
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
      this.mergeCells.mergeOrUnmergeSelection();
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
      var info = this.mergeCells.mergedCellInfoCollection.getInfo(this.getSettings().mergeCells, sel[0], sel[1]);
      if (info) {
        return 'Unmerge cells';
      }
      else {
        return 'Merge cells';
      }
    },
    callback: function () {
      this.mergeCells.mergeOrUnmergeSelection();
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
      var selRange = this.getSelectedRange();
      var current;
      switch (hook) {
        case 'modifyTransformStartRow':
        case 'modifyTransformStartCol':
          current = selRange.from;
          break;

        case 'modifyTransformEndRow':
        case 'modifyTransformEndCol':
          current = selRange.to;
          break;
      }
      var mergeParent = this.mergeCells.mergedCellInfoCollection.getInfo(mergeCellsSetting, current.row, current.col);
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
    }
    return delta;
  }
};

var afterSelection = function (fromRow, fromCol, toRow, toCol) {
  var mergeCellsSetting = this.getSettings().mergeCells;
  if (mergeCellsSetting) {
    var selRange = this.getSelectedRange();
    var selRangeChanged = false;

    this.mergeCells.mergedCellInfoCollection.forEach(function (cellInfo) {
      var mergedCellTopLeft = new WalkontableCellCoords(cellInfo.row, cellInfo.col);
      var mergedCellBottomRight = new WalkontableCellCoords(cellInfo.row + cellInfo.rowspan - 1, cellInfo.col + cellInfo.colspan - 1);

      var mergedCellRange = new WalkontableCellRange(mergedCellTopLeft, mergedCellBottomRight);

      if(selRange.expandByRange(mergedCellRange)){
        selRangeChanged = true;
      }
    });

    if (selRangeChanged){
      var selRangeTopLeft = selRange.getTopLeftCorner();
      var selRangeBottomRight = selRange.getBottomRightCorner();

      this.selectCell(selRangeTopLeft.row, selRangeTopLeft.col, selRangeBottomRight.row, selRangeBottomRight.col);
      return;
    }

    var fromInfo = this.mergeCells.mergedCellInfoCollection.getInfo(selRange.from.row, selRange.from.col);
    if (fromInfo) {
      var newFromCellCoords = new WalkontableCellCoords(fromInfo.row, fromInfo.col);
      this.view.wt.selections.current.replace(selRange.from, newFromCellCoords);
      this.view.wt.selections.area.replace(selRange.from, newFromCellCoords);
      this.view.wt.selections.highlight.replace(selRange.from, newFromCellCoords);
    }
    var toInfo = this.mergeCells.mergedCellInfoCollection.getInfo(mergeCellsSetting, selRange.to.row, selRange.to.col);
    if (toInfo) {
      var newToCellCoords = new WalkontableCellCoords(toInfo.row, toInfo.col);
      this.view.wt.selections.current.replace(selRange.to, newToCellCoords);
      this.view.wt.selections.area.replace(selRange.to, newToCellCoords);
      this.view.wt.selections.highlight.replace(selRange.to, newToCellCoords);
    }
  }
};

Handsontable.PluginHooks.add('beforeInit', init);
Handsontable.PluginHooks.add('beforeKeyDown', onBeforeKeyDown);
Handsontable.PluginHooks.add('modifyTransformStartRow', modifyTransformFactory('modifyTransformStartRow'));
Handsontable.PluginHooks.add('modifyTransformStartCol', modifyTransformFactory('modifyTransformStartCol'));
Handsontable.PluginHooks.add('modifyTransformEndRow', modifyTransformFactory('modifyTransformEndRow'));
Handsontable.PluginHooks.add('modifyTransformEndCol', modifyTransformFactory('modifyTransformEndCol'));
Handsontable.PluginHooks.add('afterSelection', afterSelection);
Handsontable.PluginHooks.add('afterRenderer', afterRenderer);
Handsontable.PluginHooks.add('afterContextMenuDefaultOptions', addMergeActionsToContextMenu);

Handsontable.MergeCells = MergeCells;

