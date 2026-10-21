import type { TableDeps } from '../baseTable';
import Table from '../baseTable';
import stickyRowsTop from '../rangeQuery/stickyRowsTop';
import stickyColumnsEnd from '../rangeQuery/stickyColumnsEnd';
import { mixin } from '../../../../../helpers/object';
import { CLONE_TOP_INLINE_END_CORNER } from '../../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to topInlineEndCornerOverlay
 * (in RTL mode the overlay sits on the left of the screen), implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes stickyColumnsEnd
 */
class TopInlineEndCornerOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_TOP_INLINE_END_CORNER);
  }
}

mixin(TopInlineEndCornerOverlayTable, stickyRowsTop);
mixin(TopInlineEndCornerOverlayTable, stickyColumnsEnd);

export default TopInlineEndCornerOverlayTable;
