import OverlayTable from './_base';
import stickyRowsTop from './mixin/stickyRowsTop';
import { mixin } from './../../../../helpers/object';

class TopOverlayTable extends OverlayTable {

}

mixin(TopOverlayTable, stickyRowsTop);

export default TopOverlayTable;
