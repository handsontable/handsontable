import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP_INLINE_START_CORNER } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopLeftCornerOverlay
 * (in RTL mode the overlay sits on the right of the screen), implemented through mixins.
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
  constructor(dataAccessObject, facadeGetter, domBindings, wtSettings) {
    super(dataAccessObject, facadeGetter, domBindings, wtSettings, CLONE_TOP_INLINE_START_CORNER);
  }
}

mixin(TopInlineStartCornerOverlayTable, stickyRowsTop);
mixin(TopInlineStartCornerOverlayTable, stickyColumnsStart);

export default TopInlineStartCornerOverlayTable;
