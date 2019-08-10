import OverlayTable from './_base';

class TopLeftCornerOverlayTable extends OverlayTable {
  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.getRenderedRowsCount() - 1;
  }

  /**
   * @returns {Number} Returns source index of last visible row
   */
  getLastVisibleRow() {
    return this.getLastRenderedRow();
  }

  getLastRenderedColumn() {
    return this.getRenderedColumnsCount() - 1;
  }

  getRenderedColumnsCount() {
    const totalColumns = this.wot.getSetting('totalColumns');
    return Math.min(this.wot.getSetting('fixedColumnsLeft'), totalColumns);
  }

  getRenderedRowsCount() {
    const totalRows = this.wot.getSetting('totalRows');
    return Math.min(this.wot.getSetting('fixedRowsTop'), totalRows);
  }

  getVisibleRowsCount() {
    return this.getRenderedRowsCount();
  }

  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  }
}

export default TopLeftCornerOverlayTable;
