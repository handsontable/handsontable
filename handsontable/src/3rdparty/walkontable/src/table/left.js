import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to LeftOverlay, implemented through mixins.
 */
class LeftOverlayTable extends Table {

}

mixin(LeftOverlayTable, calculatedRows);
mixin(LeftOverlayTable, stickyColumnsLeft);

export default LeftOverlayTable;
