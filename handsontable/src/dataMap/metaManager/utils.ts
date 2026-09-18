import { hasOwnProperty, isObject, objectEach, inherit, extend } from '../../helpers/object';
import { throwWithCause } from '../../helpers/errors';
import { getCellType } from '../../cellTypes/registry';

/**
 * Checks if the given property can be overwritten.
 *
 * @param {string} propertyName The property name to check.
 * @param {object} metaObject The current object meta settings.
 * @returns {boolean}
 */
function canBeOverwritten(propertyName: string, metaObject: Record<string, unknown>) {
  if (propertyName === 'CELL_TYPE') {
    return false;
  }

  return (metaObject._automaticallyAssignedMetaProps as Set<string> | undefined)?.has(propertyName) ||
    !hasOwnProperty(metaObject, propertyName);
}

/**
 * Checks whether editing was switched off for the meta object, at its own level or at any level it
 * inherits from.
 *
 * An `editor` of `false` names no editor - it disables editing - so it is a policy the user set,
 * never a default a cell type supplied: no built-in type declares one. A `type` expansion therefore
 * has no competing default to apply here, and supplying the type's editor would silently re-enable
 * editing that was turned off one level up. `canBeOverwritten()` alone cannot see that, because a
 * grid-level setting reaches a column through the PROTOTYPE CHAIN rather than as an own property,
 * and `hasOwnProperty()` reports it as absent.
 *
 * A custom cell type MAY declare `editor: false`. One that did is recorded as automatically
 * assigned, and such a value is the type's default rather than the user's policy, so it stays
 * overwritable by the next type.
 *
 * @param {object} metaObject The meta object the type is being expanded into.
 * @returns {boolean}
 */
function isEditingDisabled(metaObject: Record<string, unknown>) {
  return metaObject.editor === false &&
    !(metaObject._automaticallyAssignedMetaProps as Set<string> | undefined)?.has('editor');
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
 * The one key a type never supplies is "editor" when editing is already disabled - see
 * {@link isEditingDisabled}. Every other key of the type, "renderer" and "validator" included, is
 * applied as usual, so a column keeps its type's formatting while staying non-editable.
 *
 * @param {object} metaObject The meta object.
 * @param {object} settings The settings object with the "type" setting.
 * @param {object} settingsToCompareWith The object to compare which properties need to be updated.
 */
export function extendByMetaType(
  metaObject: Record<string, unknown>,
  settings: Record<string, unknown>,
  settingsToCompareWith: Record<string, unknown> = metaObject
) {
  const validType = typeof settings.type === 'string' ? getCellType(settings.type) : settings.type;

  if (metaObject._automaticallyAssignedMetaProps) {
    objectEach(settings, (_value: unknown, key: string) => {
      (metaObject._automaticallyAssignedMetaProps as Set<string>).delete(key);
    });
  }

  if (!isObject(validType)) {
    return;
  }

  if (settingsToCompareWith === metaObject && !metaObject._automaticallyAssignedMetaProps) {
    metaObject._automaticallyAssignedMetaProps = new Set();
  }

  const expandedType: Record<string, unknown> = {};
  // Resolved after the bookkeeping above, so a payload that sets "editor" itself has already
  // cleared the automatically-assigned flag and is judged on the value it just wrote.
  const keepEditingDisabled = isEditingDisabled(metaObject);

  objectEach(validType as Record<string, unknown>, (value: unknown, property: string) => {
    if (property === 'editor' && keepEditingDisabled) {
      return;
    }

    if (canBeOverwritten(property, settingsToCompareWith)) {
      expandedType[property] = value;
      (metaObject._automaticallyAssignedMetaProps as Set<string> | undefined)?.add(property);
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
export function columnFactory(TableMeta: Function, conflictList: string[] = []) {
  // Do not use ES6 "class extends" syntax here. It seems that the babel produces code
  // which drastically decreases the performance of the ColumnMeta class creation.

  /**
   * Base "class" for column meta.
   */
  function ColumnMeta() { // intentionally empty
  }

  inherit(ColumnMeta, TableMeta);

  // Clear conflict settings
  for (let i = 0; i < conflictList.length; i++) {
    (ColumnMeta as { prototype: Record<string, unknown> }).prototype[conflictList[i]] = undefined;
  }

  return ColumnMeta;
}

/**
 * Function which makes assertion by custom condition. Function throws an error when assertion doesn't meet the spec.
 *
 * @param {Function} condition Function with custom logic. The condition has to return boolean values.
 * @param {string} errorMessage String which describes assertion error.
 */
export function assert(condition: () => boolean, errorMessage: string) {
  if (!condition()) {
    throwWithCause(`Assertion failed: ${errorMessage}`);
  }
}

/**
 * Check if given variable is null or undefined.
 *
 * @param {*} variable Variable to check.
 * @returns {boolean}
 */
export function isNullish(variable: unknown): variable is null | undefined {
  return variable === null || variable === undefined;
}

/**
 * Normalizes the "editor" property of the passed settings object.
 *
 * An `editor` of `true` names no editor, so it is treated as if the setting was not passed at all.
 * The property is dropped rather than resolved to the text editor here, so the cell still receives
 * the editor that its "type" (or a higher meta layer) provides - for example, a `type: 'numeric'`
 * column keeps the numeric editor.
 *
 * @param {object} settings The settings object to normalize.
 * @returns {object} The passed object, or a copy of it with the "editor" property removed.
 */
export function normalizeEditorSetting<T extends Record<string, unknown>>(settings: T): T {
  if (settings.editor !== true) {
    return settings;
  }

  const normalizedSettings = { ...settings };

  delete normalizedSettings.editor;

  return normalizedSettings;
}
