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
  var corners, r, c, source_r, source_c;

  var visibleRows = this.instance.wtTable.rowStrategy.countVisible()
    , visibleColumns = this.instance.wtTable.columnStrategy.countVisible();

  if (this.selected.length) {
    corners = this.getCorners();

    for (r = 0; r < visibleRows; r++) {
      for (c = 0; c < visibleColumns; c++) {
        source_r = this.instance.wtTable.rowFilter.visibleToSource(r);
        source_c = this.instance.wtTable.columnFilter.visibleToSource(c);

        if (source_r >= corners[0] && source_r <= corners[2] && source_c >= corners[1] && source_c <= corners[3]) {
          //selected cell
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.className);
        }
        else if (source_r >= corners[0] && source_r <= corners[2]) {
          //selection is in this row
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.highlightRowClassName);
        }
        else if (source_c >= corners[1] && source_c <= corners[3]) {
          //selection is in this column
          this.instance.wtTable.currentCellCache.add(r, c, this.settings.highlightColumnClassName);
        }
      }
    }

    this.border && this.border.appear(corners); //warning! border.appear modifies corners!
  }
  else {
    this.border && this.border.disappear();
  }
};
