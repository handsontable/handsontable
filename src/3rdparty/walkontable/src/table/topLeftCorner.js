import OverlayTable from './_base';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

class TopLeftCornerOverlayTable extends OverlayTable {

}

mixin(TopLeftCornerOverlayTable, stickyRowsTop);
mixin(TopLeftCornerOverlayTable, stickyColumnsLeft);

export default TopLeftCornerOverlayTable;
