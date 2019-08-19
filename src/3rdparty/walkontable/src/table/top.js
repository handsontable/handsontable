import OverlayTable from './_base';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

class TopOverlayTable extends OverlayTable {

}

mixin(TopOverlayTable, stickyRowsTop);
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
