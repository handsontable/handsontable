import OverlayTable from './_base';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

class BottomLeftCornerOverlayTable extends OverlayTable {

}

mixin(BottomLeftCornerOverlayTable, stickyRowsBottom);
mixin(BottomLeftCornerOverlayTable, stickyColumnsLeft);

export default BottomLeftCornerOverlayTable;
