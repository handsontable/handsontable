import OverlayTable from './_base';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import { mixin } from './../../../../helpers/object';

class BottomOverlayTable extends OverlayTable {

}

mixin(BottomOverlayTable, stickyRowsBottom);

export default BottomOverlayTable;
