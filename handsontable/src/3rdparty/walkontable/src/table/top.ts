import type { TableDeps } from '../table';
import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopOverlay, implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes calculatedColumns
 */
class TopOverlayTable extends Table {
  /**
   * @param {TableDeps} deps The table module dependencies.
   */
  constructor(deps: TableDeps) {
    super(deps, CLONE_TOP);
  }
}

mixin(TopOverlayTable, stickyRowsTop);
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
