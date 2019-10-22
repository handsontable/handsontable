import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to LeftOverlay, implemented through mixins.
 */
class LeftOverlayTable extends Table {
  /**
   * Returns an instance of `Table` that renders the columns after the last column
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborEast() {
    return this.wot.cloneSource.wtTable;
  }
}

mixin(LeftOverlayTable, calculatedRows);
mixin(LeftOverlayTable, stickyColumnsLeft);

export default LeftOverlayTable;
