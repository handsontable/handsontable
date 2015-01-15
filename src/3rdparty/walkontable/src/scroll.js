function WalkontableScroll(instance) {
  this.instance = instance;
}

/**
 * Scrolls viewport to a cell by minimum number of cells
 * @param {WalkontableCellCoords} coords
 */
WalkontableScroll.prototype.scrollViewport = function (coords) {
  if (!this.instance.drawn) {
    return;
  }

  var totalRows = this.instance.getSetting('totalRows')
    , totalColumns = this.instance.getSetting('totalColumns');

  if (coords.row < 0 || coords.row > totalRows - 1) {
    throw new Error('row ' + coords.row + ' does not exist');
  }

  if (coords.col < 0 || coords.col > totalColumns - 1) {
    throw new Error('column ' + coords.col + ' does not exist');
  }

    if (coords.row > this.instance.wtTable.getLastVisibleRow()) {
      this.instance.wtScrollbars.vertical.scrollTo(coords.row, true);
    } else if (coords.row >= this.instance.getSetting('fixedRowsTop') && coords.row < this.instance.wtTable.getFirstVisibleRow()){
      this.instance.wtScrollbars.vertical.scrollTo(coords.row);
    }

    if (coords.col > this.instance.wtTable.getLastVisibleColumn()) {
      this.instance.wtScrollbars.horizontal.scrollTo(coords.col, true);
    } else if (coords.col > this.instance.getSetting('fixedColumnsLeft') && coords.col < this.instance.wtTable.getFirstVisibleColumn()){
      this.instance.wtScrollbars.horizontal.scrollTo(coords.col);
    }

  //}
};
