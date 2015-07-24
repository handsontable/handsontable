
/**
 * @class WalkontableScroll
 */
class WalkontableScroll {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    this.wot = wotInstance;

    // legacy support
    this.instance = wotInstance;
  }

  /**
   * Scrolls viewport to a cell by minimum number of cells
   *
   * @param {WalkontableCellCoords} coords
   */
  scrollViewport(coords) {
    if (!this.wot.drawn) {
      return;
    }
    let totalRows = this.wot.getSetting('totalRows');
    let totalColumns = this.wot.getSetting('totalColumns');

    if (coords.row < 0 || coords.row > totalRows - 1) {
      throw new Error('row ' + coords.row + ' does not exist');
    }

    if (coords.col < 0 || coords.col > totalColumns - 1) {
      throw new Error('column ' + coords.col + ' does not exist');
    }

    if (coords.row > this.instance.wtTable.getLastVisibleRow()) {
      this.wot.wtOverlays.topOverlay.scrollTo(coords.row, true);

    } else if (coords.row >= this.instance.getSetting('fixedRowsTop') &&
               coords.row < this.instance.wtTable.getFirstVisibleRow()) {
      this.wot.wtOverlays.topOverlay.scrollTo(coords.row);
    }

    if (coords.col > this.instance.wtTable.getLastVisibleColumn()) {
      this.wot.wtOverlays.leftOverlay.scrollTo(coords.col, true);

    } else if (coords.col >= this.instance.getSetting('fixedColumnsLeft') &&
               coords.col < this.instance.wtTable.getFirstVisibleColumn()) {
      this.wot.wtOverlays.leftOverlay.scrollTo(coords.col);
    }
  }
}

export {WalkontableScroll};

window.WalkontableScroll = WalkontableScroll;
