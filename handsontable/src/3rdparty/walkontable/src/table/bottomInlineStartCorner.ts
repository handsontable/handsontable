import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_BOTTOM_INLINE_START_CORNER } from '../overlay';
import { TableDao, FacadeGetter, DomBindings } from '../types';
import Settings from '../settings';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomInlineStartCornerOverlay, implemented through mixins.
 *
 * @mixes stickyRowsBottom
 * @mixes stickyColumnsStart
 */
class BottomInlineStartCornerOverlayTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject: TableDao, facadeGetter: FacadeGetter, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, domBindings, wtSettings, CLONE_BOTTOM_INLINE_START_CORNER, facadeGetter);
  }
}

// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(BottomInlineStartCornerOverlayTable, stickyRowsBottom);
// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(BottomInlineStartCornerOverlayTable, stickyColumnsStart);

export default BottomInlineStartCornerOverlayTable;
