import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomLeftCornerOverlay, implemented through mixins.
 */
class BottomLeftCornerOverlayTable extends Table {
  /**
   * Returns an instance of `Table` that renders the columns after the last column
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborEast() {
    return this.wot.cloneSource.wtOverlays.bottomOverlay.clone.wtTable;
  }

  /**
   * Returns an instance of `Table` that renders the rows before the first row
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborNorth() {
    return this.wot.cloneSource.wtOverlays.leftOverlay.clone.wtTable;
  }

  /**
   * Returns an instance of `Table` that renders the rows before the first rows, and the columns after the last column
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborDiagonal() {
    return this.wot.cloneSource.wtTable;
  }
}

mixin(BottomLeftCornerOverlayTable, stickyRowsBottom);
mixin(BottomLeftCornerOverlayTable, stickyColumnsLeft);

export default BottomLeftCornerOverlayTable;
