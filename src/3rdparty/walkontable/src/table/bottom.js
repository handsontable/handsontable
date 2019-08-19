import OverlayTable from './_base';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

class BottomOverlayTable extends OverlayTable {

}

mixin(BottomOverlayTable, stickyRowsBottom);
mixin(BottomOverlayTable, calculatedColumns);

export default BottomOverlayTable;
