import type { TableDeps } from '../table';
import Table from '../table';
import { rowRangeQuery } from '../rangeQuery/renderedRange';
import stickyColumnsStart from '../rangeQuery/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_INLINE_START } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to InlineStartOverlayTable, implemented through mixins.
 */
class InlineStartOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_INLINE_START);
  }
}

mixin(InlineStartOverlayTable, rowRangeQuery);
mixin(InlineStartOverlayTable, stickyColumnsStart);

export default InlineStartOverlayTable;
