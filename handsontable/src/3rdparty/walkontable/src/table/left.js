import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsLeft from './mixin/stickyColumnsLeft';
import { mixin } from '../../../../helpers/object';
import { CLONE_LEFT } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to LeftOverlay, implemented through mixins.
 */
class LeftOverlayTable extends Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @todo remove.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(wotInstance, facadeGetter, domBindings, wtSettings) {
    super(wotInstance, facadeGetter, domBindings, wtSettings, CLONE_LEFT);
  }
}

mixin(LeftOverlayTable, calculatedRows);
mixin(LeftOverlayTable, stickyColumnsLeft);

export default LeftOverlayTable;
