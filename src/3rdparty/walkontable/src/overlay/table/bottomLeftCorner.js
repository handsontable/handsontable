import OverlayTable from './_base';

class BottomLeftCornerOverlayTable extends OverlayTable {
  getFirstRenderedRow() {
    const index = this.wot.getSetting('totalRows') - this.wot.getSetting('fixedRowsBottom') - 1;
    if (index < 0) {
      return -1;
    }
    return index;
  }

  /**
   * @returns {Number} Returns -1 if no row is visible, otherwise source index of the last rendered row
   */
  getLastRenderedRow() {
    return this.wot.getSetting('totalRows') - 1;
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
    return Math.min(this.wot.getSetting('fixedRowsBottom'), totalRows);
  }

  getVisibleRowsCount() {
    return this.getRenderedRowsCount();
  }

  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  }
}

export default BottomLeftCornerOverlayTable;
