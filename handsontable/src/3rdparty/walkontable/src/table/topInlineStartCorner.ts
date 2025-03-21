import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP_INLINE_START_CORNER } from '../overlay';
import { TableDao, FacadeGetter, DomBindings } from '../types';
import Settings from '../settings';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopInlineStartCornerOverlay, implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes stickyColumnsStart
 */
class TopInlineStartCornerOverlayTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject: TableDao, facadeGetter: FacadeGetter, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, domBindings, wtSettings, CLONE_TOP_INLINE_START_CORNER, facadeGetter);
  }
}

// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(TopInlineStartCornerOverlayTable, stickyRowsTop);
// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(TopInlineStartCornerOverlayTable, stickyColumnsStart);

export default TopInlineStartCornerOverlayTable;
