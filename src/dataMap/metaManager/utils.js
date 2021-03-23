import { hasOwnProperty, isObject, objectEach, inherit } from '../../helpers/object';
import { getCellType } from '../../cellTypes/registry';

/**
 * Expands "type" property of the meta object to single values. For example `type: 'numeric'` sets
 * "renderer", "editor", "validator" properties to specific functions designed for numeric values.
 * If "type" is passed as an object that object will be returned, excluding properties that
 * already exist in the "metaObject" if passed.
 *
 * @param {object|string} type Type to expand;.
 * @param {object|undefined} [metaObject] Source meta object.
 * @returns {object|undefined}
 */
export function expandMetaType(type, metaObject) {
  const validType = typeof type === 'string' ? getCellType(type) : type;

  if (!isObject(validType)) {
    return;
  }

  const preventSourceOverwrite = isObject(metaObject);
  const expandedType = {};

  objectEach(validType, (value, property) => {
    if (property !== 'CELL_TYPE' && (!preventSourceOverwrite
        || preventSourceOverwrite && !hasOwnProperty(metaObject, property))) {
      expandedType[property] = value;
    }
  });

  return expandedType;
}

/**
 * Creates new class which extends properties from TableMeta layer class.
 *
 * @param {TableMeta} TableMeta The TableMeta which the new ColumnMeta is created from.
 * @param {string[]} [conflictList] List of the properties which are conflicted with the column meta layer.
 *                                  Conflicted properties are overwritten by `undefined` value, to separate them
 *                                  from the TableMeta layer.
 * @returns {ColumnMeta} Returns constructor ready to initialize with `new` operator.
 */
export function columnFactory(TableMeta, conflictList = []) {
  // Do not use ES6 "class extends" syntax here. It seems that the babel produces code
  // which drastically decreases the performance of the ColumnMeta class creation.

  /**
   * Base "class" for column meta.
   */
  function ColumnMeta() {}

  inherit(ColumnMeta, TableMeta);

  // Clear conflict settings
  for (let i = 0; i < conflictList.length; i++) {
    ColumnMeta.prototype[conflictList[i]] = void 0;
  }

  return ColumnMeta;
}

/**
 * Helper which checks if the provided argument is an unsigned number.
 *
 * @param {*} value Value to check.
 * @returns {boolean}
 */
export function isUnsignedNumber(value) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Function which makes assertion by custom condition. Function throws an error when assertion doesn't meet the spec.
 *
 * @param {Function} condition Function with custom logic. The condition has to return boolean values.
 * @param {string} errorMessage String which describes assertion error.
 */
export function assert(condition, errorMessage) {
  if (!condition()) {
    throw new Error(`Assertion failed: ${errorMessage}`);
  }
}

/**
 * Check if given variable is null or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isNullish(variable) {
  return variable === null || variable === void 0;
}
