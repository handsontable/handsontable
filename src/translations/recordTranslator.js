import Core from './../core';
import IndexMapper from './indexMapper';

/**
 * @class RecordTranslator
 * @util
 */
export class RecordTranslator {
  constructor(hot) {
    this.hot = hot;
    this.rowIndexMapper = new IndexMapper();
    this.columnIndexMapper = new IndexMapper();
  }

  /**
   * Translate physical row index into visual.
   *
   * @param {Number} row Physical row index.
   * @returns {Number} Returns visual row index.
   */
  toVisualRow(row) {
    return this.hot.runHooks('unmodifyRow', this.getRowIndexMapper().getVisualIndex(row));
  }

  /**
   * Translate physical column index into visual.
   *
   * @param {Number} column Physical column index.
   * @returns {Number} Returns visual column index.
   */
  toVisualColumn(column) {
    return this.hot.runHooks('unmodifyCol', this.getColumnIndexMapper().getVisualIndex(column));
  }

  /**
   * Translate visual row index into physical.
   *
   * @param {Number} row Visual row index.
   * @returns {Number} Returns physical row index.
   */
  toPhysicalRow(row) {
    return this.hot.runHooks('modifyRow', this.getRowIndexMapper().getPhysicalIndex(row));
  }

  /**
   * Translate visual column index into physical.
   *
   * @param {Number} column Visual column index.
   * @returns {Number} Returns physical column index.
   */
  toPhysicalColumn(column) {
    return this.hot.runHooks('modifyCol', this.getColumnIndexMapper().getPhysicalIndex(column));
  }

  /**
   * Get index mapper for rows.
   *
   * @returns {IndexMapper}
   */
  getRowIndexMapper() {
    return this.rowIndexMapper;
  }

  /**
   * Get index mapper for columns.
   *
   * @returns {IndexMapper}
   */
  getColumnIndexMapper() {
    return this.columnIndexMapper;
  }

  /**
   * Execute batch operations on column index mapper and row index mapper with updating cache.
   *
   * @param {Function} curriedBatchOperations Batched operations curried in a function.
   */
  executeBatchOperations(curriedBatchOperations) {
    this.getColumnIndexMapper().executeBatchOperations(() => {
      this.getRowIndexMapper().executeBatchOperations(() => {
        curriedBatchOperations();
      });
    });
  }
}

const identities = new WeakMap();
const translatorSingletons = new WeakMap();

/**
 * Allows to register custom identity manually.
 *
 * @param {*} identity
 * @param {*} hot
 */
export function registerIdentity(identity, hot) {
  identities.set(identity, hot);
}

/**
 * Returns a cached instance of RecordTranslator or create the new one for given identity.
 *
 * @param {*} identity
 * @returns {RecordTranslator}
 */
export function getTranslator(identity) {
  const instance = identity instanceof Core ? identity : getIdentity(identity);
  let singleton;

  if (translatorSingletons.has(instance)) {
    singleton = translatorSingletons.get(instance);

  } else {
    singleton = new RecordTranslator(instance);
    translatorSingletons.set(instance, singleton);
  }

  return singleton;
}

/**
 * Returns mapped identity.
 *
 * @param {*} identity
 * @returns {*}
 */
export function getIdentity(identity) {
  if (!identities.has(identity)) {
    throw Error('Record translator was not registered for this object identity');
  }

  return identities.get(identity);
}
