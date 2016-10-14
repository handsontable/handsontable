import Handsontable from './../browser';
import {isObject} from './../helpers/object';
import {toUpperCaseFirst} from './../helpers/string';

function toUpperCaseFirstIf(string) {
  return typeof string === 'string' ? toUpperCaseFirst(string) : void 0;
}

/**
 * @class RecordTranslator
 * @util
 */
class RecordTranslator {
  constructor(hot) {
    this.hot = hot;
  }

  /**
   * Translate physical row index into visual.
   *
   * @param {Number} row Physical row index.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from row translation.
   * @returns {Number} Returns visual row index.
   */
  toVisualRow(row, modifierToExclude) {
    return this.hot.runHooks('unmodifyRow', row, toUpperCaseFirstIf(modifierToExclude));
  }

  /**
   * Translate physical column index into visual.
   *
   * @param {Number} column Physical column index.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from column translation.
   * @returns {Number} Returns visual column index.
   */
  toVisualColumn(column, modifierToExclude) {
    return this.hot.runHooks('unmodifyCol', column, toUpperCaseFirstIf(modifierToExclude));
  }

  /**
   * Translate physical coordinates into visual. Can be passed as separate 2 arguments (row, column) or as an object in first
   * argument with `row` and `column` keys.
   *
   * @param {Number|Object} row Physical coordinates or row index.
   * @param {Number|String} [column] Physical column index or plugin name to exclude - if first argument was passed as an object.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from row translation.
   * @returns {Object|Array} Returns an object with visual records or an array if coordinates passed as separate arguments.
   */
  toVisual(row, column, modifierToExclude) {
    let result;

    if (isObject(row)) {
      result = {
        row: this.toVisualRow(row.row, column),
        column: this.toVisualColumn(row.column, column),
      };
    } else {
      result = [this.toVisualRow(row, modifierToExclude), this.toVisualColumn(column, modifierToExclude)];
    }

    return result;
  }

  /**
   * Translate visual row index into physical.
   *
   * @param {Number} row Visual row index.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from row translation.
   * @returns {Number} Returns physical row index.
   */
  toPhysicalRow(row, modifierToExclude) {
    return this.hot.runHooks('modifyRow', row, toUpperCaseFirstIf(modifierToExclude));
  }

  /**
   * Translate visual column index into physical.
   *
   * @param {Number} column Visual column index.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from column translation.
   * @returns {Number} Returns physical column index.
   */
  toPhysicalColumn(column, modifierToExclude) {
    return this.hot.runHooks('modifyCol', column, toUpperCaseFirstIf(modifierToExclude));
  }

  /**
   * Translate visual coordinates into physical. Can be passed as separate 2 arguments (row, column) or as an object in first
   * argument with `row` and `column` keys.
   *
   * @param {Number|Object} row Visual coordinates or row index.
   * @param {Number|String} [column] Visual column index or plugin name to exclude - if first argument was passed as an object.
   * @param {String} [modifierToExclude] Plugin name that will be excluded from column translation.
   * @returns {Object|Array} Returns an object with physical records or an array if coordinates passed as separate arguments.
   */
  toPhysical(row, column, modifierToExclude) {
    let result;

    if (isObject(row)) {
      result = {
        row: this.toPhysicalRow(row.row, column),
        column: this.toPhysicalColumn(row.column, column),
      };
    } else {
      result = [this.toPhysicalRow(row, modifierToExclude), this.toPhysicalColumn(column, modifierToExclude)];
    }

    return result;
  }
}

const identities = new WeakMap();
const translatorSingletons = new WeakMap();

export function registerIdentity(identity, hot) {
  identities.set(identity, hot);
}

export function getTranslator(identity) {
  let singleton;

  if (!(identity instanceof Handsontable.Core)) {
    if (!identities.has(identity)) {
      throw Error('Record translator was not registered for this object identity');
    }
    identity = identities.get(identity);
  }
  if (translatorSingletons.has(identity)) {
    singleton = translatorSingletons.get(identity);

  } else {
    singleton = new RecordTranslator(identity);
    translatorSingletons.set(identity, singleton);
  }

  return singleton;
}

// temp for tests only!
Handsontable.utils.RecordTranslator = RecordTranslator;
Handsontable.utils.RecordTranslatorUtils = {registerIdentity, getTranslator};
