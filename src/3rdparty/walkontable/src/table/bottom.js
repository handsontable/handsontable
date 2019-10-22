import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomOverlay, implemented through mixins.
 */
class BottomOverlayTable extends Table {
  /**
   * Returns an instance of `Table` that renders the rows before the first row
   * in the current instance of `Table`.
   *
   * @returns {Table}
   */
  getTableNeighborNorth() {
    return this.wot.cloneSource.wtTable;
  }
}

mixin(BottomOverlayTable, stickyRowsBottom);
mixin(BottomOverlayTable, calculatedColumns);

export default BottomOverlayTable;
