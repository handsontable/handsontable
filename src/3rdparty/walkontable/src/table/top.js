import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopOverlay, implemented through mixins.
 */
class TopOverlayTable extends Table {
  /**
   * Returns an instance of `Table` that renders the rows after the last row
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborSouth() {
    return this.wot.cloneSource.wtTable;
  }
}

mixin(TopOverlayTable, stickyRowsTop);
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
