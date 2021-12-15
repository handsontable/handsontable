import Table from '../table';
import stickyRowsBottom from './mixin/stickyRowsBottom';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from '../../../../helpers/object';
import { CLONE_BOTTOM } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to BottomOverlay, implemented through mixins.
 */
class BottomOverlayTable extends Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @todo remove.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wotInstance, facadeGetter, domBindings, wtSettings) {
    super(wotInstance, facadeGetter, domBindings, wtSettings, CLONE_BOTTOM);
  }
}

mixin(BottomOverlayTable, stickyRowsBottom);
mixin(BottomOverlayTable, calculatedColumns);

export default BottomOverlayTable;
