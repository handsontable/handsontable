import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to LeftOverlay, implemented through mixins.
 *
 * @mixes calculatedRows
 * @mixes stickyColumnsStart
 */
class InlineStartOverlayTable extends Table {

}

mixin(InlineStartOverlayTable, calculatedRows);
mixin(InlineStartOverlayTable, stickyColumnsStart);

export default InlineStartOverlayTable;
