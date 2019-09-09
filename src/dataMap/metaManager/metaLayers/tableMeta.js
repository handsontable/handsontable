import { extend } from '../../../helpers/object';
import { expandMetaType } from '../utils';

export default class TableMeta {
  constructor(globalMeta) {
    const MetaCtor = globalMeta.getMetaConstructor();

    this.meta = new MetaCtor();
  }

  updateMeta(settings) {
    extend(this.meta, settings);
    extend(this.meta, expandMetaType(settings));
  }

  getMeta() {
    return this.meta;
  }

  clearCache() {

  }
}
