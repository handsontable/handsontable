import type { TableDeps } from '../baseTable';
import Table from '../baseTable';
import stickyRowsBottom from '../rangeQuery/stickyRowsBottom';
import stickyColumnsEnd from '../rangeQuery/stickyColumnsEnd';
import { mixin } from '../../../../../helpers/object';
import { CLONE_BOTTOM_INLINE_END_CORNER } from '../../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to bottomInlineEndCornerOverlay
 * (in RTL mode the overlay sits on the left of the screen), implemented through mixins.
 *
 * @mixes stickyRowsBottom
 * @mixes stickyColumnsEnd
 */
class BottomInlineEndCornerOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_BOTTOM_INLINE_END_CORNER);
  }
}

mixin(BottomInlineEndCornerOverlayTable, stickyRowsBottom);
mixin(BottomInlineEndCornerOverlayTable, stickyColumnsEnd);

export default BottomInlineEndCornerOverlayTable;
