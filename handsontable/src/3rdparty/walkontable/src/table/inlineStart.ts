import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import stickyColumnsStart from './mixin/stickyColumnsStart';
import { mixin } from '../../../../helpers/object';
import { CLONE_INLINE_START } from '../overlay';
import { TableDao, FacadeGetter, DomBindings } from '../types';
import Settings from '../settings';

/**
 * Subclass of `Table` that provides the helper methods relevant to InlineStartOverlayTable, implemented through mixins.
 */
class InlineStartOverlayTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject: TableDao, facadeGetter: FacadeGetter, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, domBindings, wtSettings, CLONE_INLINE_START, facadeGetter);
  }
}

// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(InlineStartOverlayTable, calculatedRows);
// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(InlineStartOverlayTable, stickyColumnsStart);

export default InlineStartOverlayTable;
