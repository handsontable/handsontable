import OverlayTable from './_base';
import stickyRowsTop from './mixin/stickyRowsTop';
import { mixin } from './../../../../helpers/object';

class TopLeftCornerOverlayTable extends OverlayTable {
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

mixin(TopLeftCornerOverlayTable, stickyRowsTop);

export default TopLeftCornerOverlayTable;
