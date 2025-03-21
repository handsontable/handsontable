import Table from '../table';
import stickyRowsTop from './mixin/stickyRowsTop';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from '../../../../helpers/object';
import { CLONE_TOP } from '../overlay';
import { TableDao, FacadeGetter, DomBindings } from '../types';
import Settings from '../settings';

/**
 * Subclass of `Table` that provides the helper methods relevant to TopOverlay, implemented through mixins.
 *
 * @mixes stickyRowsTop
 * @mixes calculatedColumns
 */
class TopOverlayTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject: TableDao, facadeGetter: FacadeGetter, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, domBindings, wtSettings, CLONE_TOP, facadeGetter);
  }
}

// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(TopOverlayTable, stickyRowsTop);
// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(TopOverlayTable, calculatedColumns);

export default TopOverlayTable;
