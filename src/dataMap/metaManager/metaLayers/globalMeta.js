import { extend } from '../../../helpers/object';
import { expandMetaType } from '../utils';
import metaSchemaFactory from '../metaSchema';

function createTableMetaEmptyClass() {
  return function TableMeta() {};
}

export default class GlobalMeta {
  constructor() {
    this.metaCtor = createTableMetaEmptyClass();
    this.meta = this.metaCtor.prototype;

    extend(this.meta, metaSchemaFactory());
  }

  getMetaConstructor() {
    return this.metaCtor;
  }

  getMeta() {
    return this.meta;
  }

  updateMeta(settings) {
    extend(this.meta, settings);
    extend(this.meta, expandMetaType(settings));
  }

  clearCache() {

  }
}
