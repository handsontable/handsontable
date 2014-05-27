function WalkontableSelection(instance, settings) {
  this.instance = instance;
  this.settings = settings;
  this.cellRange = null;
  if (settings.border) {
    this.border = new WalkontableBorder(instance, settings);
  }
}

/**
 * Returns boolean information if selection is empty
 * @returns {boolean}
 */
WalkontableSelection.prototype.isEmpty = function () {
  return (this.cellRange === null);
};

/**
 * Adds a cell coords to the selection
 * @param {WalkontableCellCoords} coords
 */
WalkontableSelection.prototype.add = function (coords) {
  if (this.isEmpty()) {
    this.cellRange = new WalkontableCellRange(coords, coords, coords);
  }
  else {
    this.cellRange.expand(coords);
  }
};

/**
 * If selection range from or to property equals oldCoords, replace it with newCoords. Return boolean information about success
 * @param {WalkontableCellCoords} oldCoords
 * @param {WalkontableCellCoords} newCoords
 * @return {boolean}
 */
WalkontableSelection.prototype.replace = function (oldCoords, newCoords) {
  if (!this.isEmpty()) {
    if(this.cellRange.from.isEqual(oldCoords)) {
      this.cellRange.from = newCoords;
      return true;
    }
    if(this.cellRange.to.isEqual(oldCoords)) {
      this.cellRange.to = newCoords;
      return true;
    }
  }
  return false;
};

WalkontableSelection.prototype.clear = function () {
  this.cellRange = null;
};

/**
 * Returns the top left (TL) and bottom right (BR) selection coordinates
 * @returns {Object}
 */
WalkontableSelection.prototype.getCorners = function () {
  var topLeft = this.cellRange.getTopLeftCorner();
  var bottomRight = this.cellRange.getBottomRightCorner();
  return [topLeft.row, topLeft.col, bottomRight.row, bottomRight.col];
};

WalkontableSelection.prototype.draw = function () {
  var corners, r, c, source_r, source_c,
    instance = this.instance,
    visibleRows = instance.wtTable.getRowStrategy().countVisible(),
    renderedColumns = instance.wtTable.getColumnStrategy().cellCount;

  if (!this.isEmpty()) {
    corners = this.getCorners();

    for (r = 0; r < visibleRows; r++) {
      for (c = 0; c < renderedColumns; c++) {
        source_r = instance.wtTable.rowFilter.visibleToSource(r);
        source_c = instance.wtTable.columnFilter.visibleToSource(c);

        if (this.settings.className && source_r >= corners[0] && source_r <= corners[2] && source_c >= corners[1] && source_c <= corners[3]) {
          //selected cell
          instance.wtTable.currentCellCache.add(r, c, this.settings.className);
        }
        else if (this.settings.highlightRowClassName && source_r >= corners[0] && source_r <= corners[2]) {
          //selection is in this row
          instance.wtTable.currentCellCache.add(r, c, this.settings.highlightRowClassName);
        }
        else if (this.settings.highlightRowClassName && source_c >= corners[1] && source_c <= corners[3]) {
          //selection is in this column
          instance.wtTable.currentCellCache.add(r, c, this.settings.highlightColumnClassName);
        }
      }
    }

    this.border && this.border.appear(corners); //warning! border.appear modifies corners!
  }
  else {
    this.border && this.border.disappear();
  }
};

/*
  Make a clone of a selection by overriding the WOT instance and creating new WalkontableBorder for the new instance
  Method is used for creating selections in overlays
 */
WalkontableSelection.prototype.makeClone = function (instance) {
  function WalkontableSelectionClone(){}
  WalkontableSelectionClone.prototype = this;

  var clone = new WalkontableSelectionClone();

  clone.instance = instance;

  if (clone.border){
    clone.border = new WalkontableBorder(instance, clone.settings);
  }

  return clone;

};
