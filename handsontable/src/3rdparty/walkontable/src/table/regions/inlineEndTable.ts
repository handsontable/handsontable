import type { TableDeps } from '../baseTable';
import Table from '../baseTable';
import { rowRangeQuery } from '../rangeQuery/virtualRange';
import stickyColumnsEnd from '../rangeQuery/stickyColumnsEnd';
import { mixin } from '../../../../../helpers/object';
import { CLONE_INLINE_END } from '../../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to InlineEndOverlayTable, implemented through mixins
 * (in RTL mode the overlay sits on the left of the screen).
 *
 * @mixes rowRangeQuery
 * @mixes stickyColumnsEnd
 */
class InlineEndOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_INLINE_END);
  }
}

mixin(InlineEndOverlayTable, rowRangeQuery);
mixin(InlineEndOverlayTable, stickyColumnsEnd);

export default InlineEndOverlayTable;
