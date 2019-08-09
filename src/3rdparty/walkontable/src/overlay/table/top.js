import OverlayTable from './_base';

class TopOverlayTable extends OverlayTable {
  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.wot.getSetting('fixedRowsTop') - 1;
  }

  /**
   * @returns {Number} Returns source index of last visible row
   */
  getLastVisibleRow() {
    return this.wot.getSetting('fixedRowsTop') - 1;
  }
}

export default TopOverlayTable;
