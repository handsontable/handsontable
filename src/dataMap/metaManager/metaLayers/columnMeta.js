import { extend } from '../../../helpers/object';
import { columnFactory, expandMetaType } from '../utils';

/**
 * List of props which have to be cleared in the column meta-layer. That props have a
 * different meaning when using in column meta.
 *
 * @type {String[]}
 */
const COLUMNS_PROPS_CONFLICTS = ['data', 'width'];

export default class ColumnMeta {
  constructor(globalMeta) {
    this.metas = new Map();
    this.globalMeta = globalMeta;
  }

  updateMeta(physicalColumn, settings) {
    const meta = this.getMeta(physicalColumn);

    extend(meta.prototype, settings);
    extend(meta.prototype, expandMetaType(settings));
  }

  getMeta(physicalColumn) {
    if (this.metas.has(physicalColumn)) {
      return this.metas.get(physicalColumn);
    }

    const ColumnMetaCtor = columnFactory(this.globalMeta.getMetaConstructor(), COLUMNS_PROPS_CONFLICTS);

    this.metas.set(physicalColumn, ColumnMetaCtor);

    return ColumnMetaCtor;
  }

  clearCache() {
    this.metas.clear();
  }
}
