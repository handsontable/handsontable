import OverlayTable from './_base';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

class LeftOverlayTable extends OverlayTable {

}

mixin(LeftOverlayTable, calculatedRows);
mixin(LeftOverlayTable, stickyColumnsLeft);

export default LeftOverlayTable;
