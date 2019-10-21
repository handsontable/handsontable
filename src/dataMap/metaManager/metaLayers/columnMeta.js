import { extend } from '../../../helpers/object';
import { columnFactory, expandMetaType } from '../utils';
import LazyGridMap from '../lazyGridMap';

/**
 * List of props which have to be cleared in the column meta-layer. That props have a
 * different meaning when using in column meta.
 *
 * @type {String[]}
 */
const COLUMNS_PROPS_CONFLICTS = ['data', 'width'];

export default class ColumnMeta {
  constructor(globalMeta) {
    this.metas = new LazyGridMap(() => this._createMeta());
    this.globalMeta = globalMeta;
  }

  updateMeta(physicalColumn, settings) {
    const meta = this.getMeta(physicalColumn);

    extend(meta, settings);
    extend(meta, expandMetaType(settings));
  }

  createColumn(physicalColumn, amount) {
    this.metas.insert(physicalColumn, amount);
  }

  removeColumn(physicalColumn, amount) {
    this.metas.remove(physicalColumn, amount);
  }

  getMeta(physicalColumn) {
    return this.metas.obtain(physicalColumn);
  }

  getMetaConstructor(physicalColumn) {
    return this.metas.obtain(physicalColumn).constructor;
  }

  clearCache() {
    this.metas.clear();
  }

  _createMeta() {
    return columnFactory(this.globalMeta.getMetaConstructor(), COLUMNS_PROPS_CONFLICTS).prototype;
  }
}
