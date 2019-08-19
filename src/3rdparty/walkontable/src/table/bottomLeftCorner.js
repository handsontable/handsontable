import OverlayTable from './_base';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import { mixin } from './../../../../helpers/object';

class BottomLeftCornerOverlayTable extends OverlayTable {
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

mixin(BottomLeftCornerOverlayTable, stickyRowsBottom);

export default BottomLeftCornerOverlayTable;
