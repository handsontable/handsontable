import { hasOwnProperty, isObject, objectEach, inherit, extend } from '../../helpers/object';
import { getCellType } from '../../cellTypes/registry';

/**
 * Checks if the given property can be overwritten.
 *
 * @param {string} propertyName The property name to check.
 * @param {object} metaObject The current object meta settings.
 * @returns {boolean}
 */
function canBeOverwritten(propertyName, metaObject) {
  if (propertyName === 'CELL_TYPE') {
    return false;
  }

  return metaObject._automaticallyAssignedMetaProps?.has(propertyName) ||
    !hasOwnProperty(metaObject, propertyName);
}

/**
 * Expands "type" property of the meta object to single values. For example `type: 'numeric'` sets
 * "renderer", "editor", "validator" properties to specific functions designed for numeric values.
 * If "type" is passed as an object that object will be returned, excluding properties that
 * already exist in the "metaObject".
 *
 * The function utilizes `_automaticallyAssignedMetaProps` meta property that allows tracking what
 * properties are changed by the "type" expanding feature. That properties can be always overwritten by
 * the user.
 *
 * @param {object} metaObject The meta object.
 * @param {object} settings The settings object with the "type" setting.
 * @param {object} settingsToCompareWith The object to compare which properties need to be updated.
 */
export function extendByMetaType(metaObject, settings, settingsToCompareWith = metaObject) {
  const validType = typeof settings.type === 'string' ? getCellType(settings.type) : settings.type;

  if (metaObject._automaticallyAssignedMetaProps) {
    objectEach(settings, (value, key) => void metaObject._automaticallyAssignedMetaProps.delete(key));
  }

  if (!isObject(validType)) {
    return;
  }

  if (settingsToCompareWith === metaObject && !metaObject._automaticallyAssignedMetaProps) {
    metaObject._automaticallyAssignedMetaProps = new Set();
  }

  const expandedType = {};

  objectEach(validType, (value, property) => {
    if (canBeOverwritten(property, settingsToCompareWith)) {
      expandedType[property] = value;
      metaObject._automaticallyAssignedMetaProps?.add(property);
    }
  });

  extend(metaObject, expandedType);
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
    ColumnMeta.prototype[conflictList[i]] = undefined;
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
  return variable === null || variable === undefined;
}
