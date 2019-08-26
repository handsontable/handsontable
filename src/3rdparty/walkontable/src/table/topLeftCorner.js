import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopLeftCornerOverlay, implemented through mixins.
 */
class TopLeftCornerOverlayTable extends Table {

}

mixin(TopLeftCornerOverlayTable, stickyRowsTop);
mixin(TopLeftCornerOverlayTable, stickyColumnsLeft);

export default TopLeftCornerOverlayTable;
