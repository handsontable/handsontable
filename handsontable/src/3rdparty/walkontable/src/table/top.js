import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopOverlay, implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes calculatedColumns
 */
class TopOverlayTable extends Table {

}

mixin(TopOverlayTable, stickyRowsTop);
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
