import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP_LEFT_CORNER } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopLeftCornerOverlay, implemented through mixins.
 */
class TopLeftCornerOverlayTable extends Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @todo remove.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wotInstance, facadeGetter, domBindings, wtSettings) {
    super(wotInstance, facadeGetter, domBindings, wtSettings, CLONE_TOP_LEFT_CORNER);
  }
}

mixin(TopLeftCornerOverlayTable, stickyRowsTop);
mixin(TopLeftCornerOverlayTable, stickyColumnsLeft);

export default TopLeftCornerOverlayTable;
