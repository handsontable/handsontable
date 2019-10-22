import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopLeftCornerOverlay, implemented through mixins.
 */
class TopLeftCornerOverlayTable extends Table {
  /**
   * Returns an instance of `Table` that renders the columns after the last column
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborEast() {
    return this.wot.cloneSource.wtOverlays.topOverlay.clone.wtTable;
  }

  /**
   * Returns an instance of `Table` that renders the rows after the last row
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborSouth() {
    return this.wot.cloneSource.wtOverlays.leftOverlay.clone.wtTable;
  }

  /**
   * Returns an instance of `Table` that renders the rows after the last rows, and the columns after the last column
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborDiagonal() {
    return this.wot.cloneSource.wtTable;
  }
}

mixin(TopLeftCornerOverlayTable, stickyRowsTop);
mixin(TopLeftCornerOverlayTable, stickyColumnsLeft);

export default TopLeftCornerOverlayTable;
