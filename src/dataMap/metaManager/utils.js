import { hasOwnProperty } from '../../helpers/object';
import { getCellType } from '../../cellTypes';

/**
 * Expands "type" property of the meta object to single values. For example `type: 'numeric'` sets
 * "renderer", "editor", "validator" properties to specyfic logic designed for numeric values.
 *
 * @param {Object} metaObject An object which potentially defined "type" property.
 * @returns {Object} Returns an object with all properties connected to this "type".
 */
export function expandMetaType(metaObject) {
  if (!hasOwnProperty(metaObject, 'type')) {
    return;
  }

  const expandedType = {};
  let type;

  if (typeof metaObject.type === 'object') {
    type = metaObject.type;
  } else if (typeof metaObject.type === 'string') {
    type = getCellType(metaObject.type);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const i in type) {
    if (hasOwnProperty(type, i) && !hasOwnProperty(metaObject, i)) {
      expandedType[i] = type[i];
    }
  }

  return expandedType;
}

/**
 * Creates new class which extends properties from TableMeta layer class.
 *
 * @param {TableMeta} TableMeta The TableMeta which the new ColumnMeta is created from.
 * @param {String[]} [conflictList] List of the properties which are conflicted with the column meta layer.
 *                                  Conflicted properties are overwritten by `undefined` value, to separate them
 *                                  from the TableMeta layer.
 * @returns {ColumnMeta} Returns constructor ready to initialize with `new` operator.
 */
export function columnFactory(TableMeta, conflictList = []) {
  class ColumnMeta extends TableMeta {}

  // Clear conflict settings
  for (let i = 0; i < conflictList.length; i++) {
    ColumnMeta.prototype[conflictList[i]] = void 0;
  }

  return ColumnMeta;
}

/**
 * Helper which checks if the provided argument is a signed finite number.
 *
 * @param {*} value Value to check.
 * @return {Boolean}
 */
export function isFiniteSignedNumber(value) {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Function which makes assertion by custom condition. Function throws an error when assertion doesn't meet the spec.
 *
 * @param {Function} condition Function with custom logic. The condition has to return boolean values.
 * @param {String} errorMessage String which describes assertion error.
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
 * @returns {Boolean}
 */
export function isNullish(variable) {
  return variable === null || variable === void 0;
}
