import OverlayTable from './_base';

class TopLeftCornerOverlayTable extends OverlayTable {
  getFirstRenderedRow() {
    const totalRows = this.wot.getSetting('totalRows');
    if (totalRows === 0) {
      return -1;
    }
    return 0;
  }

  getFirstVisibleRow() {
    return this.getFirstRenderedRow();
  }

  getFirstRenderedColumn() {
    const totalColumns = this.wot.getSetting('totalColumns');
    if (totalColumns === 0) {
      return -1;
    }
    return 0;
  }

  getFirstVisibleColumn() {
    return this.getFirstRenderedColumn();
  }

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

  getLastVisibleColumn() {
    return this.getLastRenderedColumn();
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
