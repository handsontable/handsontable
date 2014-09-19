function WalkontableSelection(settings, cellRange) {
  this.settings = settings;
  this.cellRange = cellRange || null;
  this.instanceBorders = {};
}

/**
 * Each Walkontable clone requires it's own border for every selection. This method creates and returns selection borders per instance
 * @param {Walkontable} instance
 * @returns {WalkontableBorder}
 */
WalkontableSelection.prototype.getBorder = function (instance) {
  if (this.instanceBorders[instance.guid]) {
    return this.instanceBorders[instance.guid];
  }
  this.instanceBorders[instance.guid] = new WalkontableBorder(instance, this.settings); //where is this returned?
};

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

WalkontableSelection.prototype.addClassAtCoords = function (instance, source_r, source_c, cls) {
  var TD = instance.wtTable.getCell(new WalkontableCellCoords(source_r, source_c));
  if(typeof TD === 'object') {
    Handsontable.Dom.addClass(TD, cls);
  }
};

WalkontableSelection.prototype.draw = function (instance) {
  var corners, r, c, source_r, source_c,
    visibleRows = instance.wtTable.getRowStrategy().countVisible(),
    renderedColumns = instance.wtTable.getColumnStrategy().cellCount;

  if (!this.isEmpty()) {
    corners = this.getCorners();

    for (r = 0; r < visibleRows; r++) {
      source_r = instance.wtTable.rowFilter.visibleToSource(r);

      for (c = 0; c < renderedColumns; c++) {
        source_c = instance.wtTable.columnFilter.visibleToSource(c);

        if (source_r >= corners[0] && source_r <= corners[2] && source_c >= corners[1] && source_c <= corners[3]) {
          //selected cell
          if (this.settings.className) {
            this.addClassAtCoords(instance, source_r, source_c, this.settings.className);
          }

          // selected row headers
          if(source_c === corners[1]) {
            var TH = instance.wtTable.getRowHeader(source_r);
            if (TH) {
              Handsontable.Dom.addClass(TH, this.settings.highlightRowClassName);
            }
          }

          // selected column headers
          if(source_r === corners[0] || (source_r > corners[0] && r == 0)) {
            var TH = instance.wtTable.getColumnHeader(source_c);
            if (TH) {
              Handsontable.Dom.addClass(TH, this.settings.highlightColumnClassName);
            }
          }
        }
        else if (source_r >= corners[0] && source_r <= corners[2]) {
          //selection is in this row
          this.addClassAtCoords(instance, source_r, source_c, this.settings.highlightRowClassName);
        }
        else if (source_c >= corners[1] && source_c <= corners[3]) {
          //selection is in this column
          this.addClassAtCoords(instance, source_r, source_c, this.settings.highlightColumnClassName);
        }
      }
    }

    instance.getSetting('onBeforeDrawBorders', corners, this.settings.className);
    if (this.settings.border) {
      var border = this.getBorder(instance);
      if (border) {
        border.appear(corners); //warning! border.appear modifies corners!
      }
    }
  }
  else {
    if (this.settings.border) {
      var border = this.getBorder(instance);
      if (border) {
        border.disappear();
      }
    }
  }
};
