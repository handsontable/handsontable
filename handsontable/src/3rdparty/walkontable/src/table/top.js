import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP } from '../overlay';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopOverlay, implemented through mixins.
 */
class TopOverlayTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject, facadeGetter, domBindings, wtSettings) {
    super(dataAccessObject, facadeGetter, domBindings, wtSettings, CLONE_TOP);
  }
}

mixin(TopOverlayTable, stickyRowsTop);
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
