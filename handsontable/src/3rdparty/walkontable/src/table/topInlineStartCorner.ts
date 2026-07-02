import type { TableDeps } from '../table';
import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP_INLINE_START_CORNER } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to topInlineStartCornerOverlay
 * (in RTL mode the overlay sits on the right of the screen), implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes stickyColumnsStart
 */
class TopInlineStartCornerOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_TOP_INLINE_START_CORNER);
  }
}

mixin(TopInlineStartCornerOverlayTable, stickyRowsTop);
mixin(TopInlineStartCornerOverlayTable, stickyColumnsStart);

export default TopInlineStartCornerOverlayTable;
