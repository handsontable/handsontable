import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopLeftCornerOverlay, implemented through mixins.
 * 
 * @mixes stickyRowsTop
 * @mixes stickyColumnsStart
 */
class TopLeftCornerOverlayTable extends Table {

}

mixin(TopLeftCornerOverlayTable, stickyRowsTop);
mixin(TopLeftCornerOverlayTable, stickyColumnsStart);

export default TopLeftCornerOverlayTable;
