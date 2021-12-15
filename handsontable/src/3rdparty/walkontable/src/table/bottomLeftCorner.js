import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from '../../../../helpers/object';
import { CLONE_BOTTOM_LEFT_CORNER } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomLeftCornerOverlay, implemented through mixins.
 */
class BottomLeftCornerOverlayTable extends Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @todo remove.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wotInstance, facadeGetter, domBindings, wtSettings) {
    super(wotInstance, facadeGetter, domBindings, wtSettings, CLONE_BOTTOM_LEFT_CORNER);
  }
}

mixin(BottomLeftCornerOverlayTable, stickyRowsBottom);
mixin(BottomLeftCornerOverlayTable, stickyColumnsLeft);

export default BottomLeftCornerOverlayTable;
