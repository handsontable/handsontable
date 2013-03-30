function WalkontableSelection(instance, settings) {
  this.instance = instance;
  this.settings = settings;
  this.selected = [];
  this.wtDom = new WalkontableDom(this.instance);
  if (settings.border) {
    this.border = new WalkontableBorder(instance, settings);
  }
}

WalkontableSelection.prototype.add = function (coords) {
  this.selected.push(coords);
};

WalkontableSelection.prototype.remove = function (coords) {
  var index = this.isSelected(coords);
  if (index > -1) {
    this.selected.splice(index, 1);
  }
};

WalkontableSelection.prototype.clear = function () {
  this.selected.length = 0; //http://jsperf.com/clear-arrayxxx
};

WalkontableSelection.prototype.isSelected = function (coords) {
  for (var i = 0, ilen = this.selected.length; i < ilen; i++) {
    if (this.selected[i][0] === coords[0] && this.selected[i][1] === coords[1]) {
      return i;
    }
  }
  return -1;
};

WalkontableSelection.prototype.getSelected = function () {
  return this.selected;
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

WalkontableSelection.prototype.draw = function (selectionsOnly) {
  var corners, r, c;

  var offsetRow = this.instance.getSetting('offsetRow')
    , lastVisibleRow = offsetRow + this.instance.getSetting('displayRows') - 1
    , offsetColumn = this.instance.getSetting('offsetColumn')
    , lastVisibleColumn = offsetColumn + this.instance.getSetting('displayColumns') - 1;

  if (this.selected.length) {
    corners = this.getCorners();

    for (r = offsetRow; r <= lastVisibleRow; r++) {
      for (c = offsetColumn; c <= lastVisibleColumn; c++) {
        if (r >= corners[0] && r <= corners[2] && c >= corners[1] && c <= corners[3]) {
          //selected cell
          this.settings.highlightRowClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightRowClassName);
          this.settings.highlightColumnClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightColumnClassName);
          this.settings.className && this.wtDom.tdAddClass(r - offsetRow, c - offsetColumn, this.settings.className);
        }
        else if (r >= corners[0] && r <= corners[2]) {
          //selection is in this row
          this.settings.highlightColumnClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightColumnClassName);
          this.settings.highlightRowClassName && this.wtDom.tdAddClass(r - offsetRow, c - offsetColumn, this.settings.highlightRowClassName);
          this.settings.className && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.className);
        }
        else if (c >= corners[1] && c <= corners[3]) {
          //selection is in this column
          this.settings.highlightRowClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightRowClassName);
          this.settings.highlightColumnClassName && this.wtDom.tdAddClass(r - offsetRow, c - offsetColumn, this.settings.highlightColumnClassName);
          this.settings.className && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.className);
        }
        else {
          //no selection
          this.settings.highlightRowClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightRowClassName);
          this.settings.highlightColumnClassName && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.highlightColumnClassName);
          this.settings.className && this.wtDom.tdRemoveClass(r - offsetRow, c - offsetColumn, this.settings.className);
        }
      }
    }

    this.border && this.border.appear(corners);
  }
  else {
    if (selectionsOnly) {
      for (r = 0; r <= lastVisibleRow - offsetRow; r++) {
        for (c = 0; c <= lastVisibleColumn - offsetColumn; c++) {
          this.settings.highlightRowClassName && this.wtDom.tdRemoveClass(r, c, this.settings.highlightRowClassName);
          this.settings.highlightColumnClassName && this.wtDom.tdRemoveClass(r, c, this.settings.highlightColumnClassName);
          this.settings.className && this.wtDom.tdRemoveClass(r, c, this.settings.className);
        }
      }
    }

    this.border && this.border.disappear();
  }
};
