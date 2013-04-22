function WalkontableSelection(instance, settings) {
  this.instance = instance;
  this.settings = settings;
  this.selected = [];
  if (settings.border) {
    this.border = new WalkontableBorder(instance, settings);
  }
}

WalkontableSelection.prototype.add = function (coords) {
  this.selected.push(coords);
};

WalkontableSelection.prototype.clear = function () {
  this.selected.length = 0; //http://jsperf.com/clear-arrayxxx
};

/**
 * Returns the top left (TL) and bottom right (BR) selection coordinates
 * @returns {Object}
 */
WalkontableSelection.prototype.getCorners = function () {
  var minRow
    , minColumn
    , maxRow
    , maxColumn
    , i
    , ilen = this.selected.length;

  if (ilen > 0) {
    minRow = maxRow = this.selected[0][0];
    minColumn = maxColumn = this.selected[0][1];

    if (ilen > 1) {
      for (i = 1; i < ilen; i++) {
        if (this.selected[i][0] < minRow) {
          minRow = this.selected[i][0];
        }
        else if (this.selected[i][0] > maxRow) {
          maxRow = this.selected[i][0];
        }

        if (this.selected[i][1] < minColumn) {
          minColumn = this.selected[i][1];
        }
        else if (this.selected[i][1] > maxColumn) {
          maxColumn = this.selected[i][1];
        }
      }
    }
  }

  return [minRow, minColumn, maxRow, maxColumn];
};

WalkontableSelection.prototype.draw = function () {
  var corners, r, c;

  var offsetRow = this.instance.getSetting('offsetRow')
    , lastVisibleRow = this.instance.wtTable.getLastVisibleRow()
    , visibleColumns = this.instance.wtTable.countVisibleColumns();

  if (this.selected.length) {
    corners = this.getCorners();
    this.border && this.border.appear(corners);

    corners[1] = this.instance.wtTable.columnFilter.sourceColumnToVisibleColumn(corners[1]);
    corners[3] = this.instance.wtTable.columnFilter.sourceColumnToVisibleColumn(corners[3]);

    for (r = offsetRow; r <= lastVisibleRow; r++) {
      for (c = 0; c < visibleColumns; c++) {
        if (r >= corners[0] && r <= corners[2] && c >= corners[1] && c <= corners[3]) {
          //selected cell
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.className);
        }
        else if (r >= corners[0] && r <= corners[2]) {
          //selection is in this row
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.highlightRowClassName);
        }
        else if (c >= corners[1] && c <= corners[3]) {
          //selection is in this column
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.highlightColumnClassName);
        }
      }
    }
  }
  else {
    this.border && this.border.disappear();
  }
};
