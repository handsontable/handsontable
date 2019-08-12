import OverlayTable from './_base';

class LeftOverlayTable extends OverlayTable {
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

  getVisibleColumnsCount() {
    return this.getRenderedColumnsCount();
  }
}

export default LeftOverlayTable;
