import type { TableDeps } from '../table';
import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_BOTTOM_INLINE_START_CORNER } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to bottomInlineStartCornerOverlay
 * (in RTL mode the overlay sits on the right of the screen), implemented through mixins.
 *
 * @mixes stickyRowsBottom
 * @mixes stickyColumnsStart
 */
class BottomInlineStartCornerOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_BOTTOM_INLINE_START_CORNER);
  }
}

mixin(BottomInlineStartCornerOverlayTable, stickyRowsBottom);
mixin(BottomInlineStartCornerOverlayTable, stickyColumnsStart);

export default BottomInlineStartCornerOverlayTable;
