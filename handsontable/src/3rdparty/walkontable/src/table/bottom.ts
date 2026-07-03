import type { TableDeps } from '../table';
import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import { columnRangeQuery } from '../renderedRange';
import { mixin } from '../../../../helpers/object';
import { CLONE_BOTTOM } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomOverlay, implemented through mixins.
 *
 * @mixes stickyRowsBottom
 * @mixes calculatedColumns
 */
class BottomOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_BOTTOM);
  }
}

mixin(BottomOverlayTable, stickyRowsBottom);
mixin(BottomOverlayTable, columnRangeQuery);

export default BottomOverlayTable;
