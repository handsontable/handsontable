import OverlayTable from './_base';

class LeftOverlayTable extends OverlayTable {
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
