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
 * The `editor` value a `type` expansion wrote onto a meta object. It complements
 * `_automaticallyAssignedMetaProps`, which the global layer does not keep: the global meta is compared
 * against the incoming settings rather than against itself, so it never gets that set, yet a grid-level
 * `type` still writes its `editor` onto it. The VALUE is kept, not just the fact: `updateSettings()`
 * writes options onto the global meta directly, without passing through `extendByMetaType()`, so a later
 * user value is recognized by no longer matching what the type wrote.
 */
const TYPE_ASSIGNED_EDITOR = new WeakMap<object, unknown>();

/**
 * The cell meta key that records an `editor: true` written through `setCellMeta()` or the `cell` option.
 * Those paths store keys one at a time and drop the `true` itself (it names no editor), while the cell's
 * `type` is expanded later, from `{ type }` alone. The marker is an ordinary recorded key, so it survives
 * the cache resets that replay user-defined and `cell`-option writes.
 */
export const TYPE_EDITOR_REQUESTED_KEY = '_typeEditorRequested';

/**
 * Finds the object in the prototype chain of the meta object that owns the given property.
 *
 * @param {object} metaObject The meta object to start from.
 * @param {string} propertyName The property name.
 * @returns {object|null}
 */
function findPropertyOwner(metaObject: Record<string, unknown>, propertyName: string) {
  let owner: Record<string, unknown> | null = metaObject;

  while (owner && !hasOwnProperty(owner, propertyName)) {
    owner = Object.getPrototypeOf(owner) as Record<string, unknown> | null;
  }

  return owner;
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
 * A custom cell type MAY declare `editor: false`. Such a value is the type's default rather than the
 * user's policy, so it stays overwritable by the next type. That is judged on the layer that OWNS the
 * value, not on the meta object being expanded: a grid-level custom type writes its `editor: false`
 * onto the global meta, and a typed column below it must still receive its own type's editor.
 *
 * Only `TYPE_ASSIGNED_EDITOR` answers whether a type wrote the value, never
 * `_automaticallyAssignedMetaProps`. A cell meta keeps no set of its own and reaches its column's set
 * through the prototype, so a cell whose type supplied its editor adds `'editor'` to the COLUMN's set,
 * and the column's own `editor: false` would then read as a type default for every other cell of it.
 *
 * @param {object} metaObject The meta object the type is being expanded into.
 * @returns {boolean}
 */
function isEditingDisabled(metaObject: Record<string, unknown>) {
  if (metaObject.editor !== false) {
    return false;
  }

  const owner = findPropertyOwner(metaObject, 'editor');

  if (owner === null) {
    return false;
  }

  return !(TYPE_ASSIGNED_EDITOR.has(owner) && TYPE_ASSIGNED_EDITOR.get(owner) === owner.editor);
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
 * @param {boolean} [typeEditorRequested=false] Whether the settings carried `editor: true`, which
 * `normalizeEditorSetting()` removes. It asks for the type's editor even when editing is disabled.
 */
export function extendByMetaType(
  metaObject: Record<string, unknown>,
  settings: Record<string, unknown>,
  settingsToCompareWith: Record<string, unknown> = metaObject,
  typeEditorRequested = false,
) {
  const validType = typeof settings.type === 'string' ? getCellType(settings.type) : settings.type;

  if (metaObject._automaticallyAssignedMetaProps) {
    objectEach(settings, (_value: unknown, key: string) => {
      (metaObject._automaticallyAssignedMetaProps as Set<string>).delete(key);
    });
  }

  if (hasOwnProperty(settings, 'editor')) {
    TYPE_ASSIGNED_EDITOR.delete(metaObject);
  }

  if (!isObject(validType)) {
    return;
  }

  if (settingsToCompareWith === metaObject && !metaObject._automaticallyAssignedMetaProps) {
    metaObject._automaticallyAssignedMetaProps = new Set();
  }

  const expandedType: Record<string, unknown> = {};
  // An `editor: true` in the same payload asks for the type's editor explicitly, so it opts the meta
  // object back in. `normalizeEditorSetting()` has already dropped that `true` from `settings`, which
  // is why the caller passes it on separately.
  const isTypeEditorRequested = typeEditorRequested ||
    (hasOwnProperty(metaObject, TYPE_EDITOR_REQUESTED_KEY) && metaObject[TYPE_EDITOR_REQUESTED_KEY] === true);
  const keepEditingDisabled = !isTypeEditorRequested && isEditingDisabled(metaObject);

  objectEach(validType as Record<string, unknown>, (value: unknown, property: string) => {
    if (property === 'editor' && keepEditingDisabled) {
      return;
    }

    if (canBeOverwritten(property, settingsToCompareWith)) {
      expandedType[property] = value;
      (metaObject._automaticallyAssignedMetaProps as Set<string> | undefined)?.add(property);

      if (property === 'editor') {
        TYPE_ASSIGNED_EDITOR.set(metaObject, value);
      }
    }
  });

  extend(metaObject, expandedType);
}

/**
 * Narrows a resolved `type` value to a cell type definition object.
 *
 * @param {*} value The resolved `type` value.
 * @returns {boolean}
 */
function isTypeDefinition(value: unknown): value is Record<string, unknown> {
  return isObject(value);
}

/**
 * Supplies the editor of an INHERITED `type` to a cell meta object that asked for it with
 * `editor: true` (the `TYPE_EDITOR_REQUESTED_KEY` marker). The dynamic extension expands only a `type`
 * the cell owns, so a cell whose `type` comes from its column would otherwise keep the column's
 * `editor: false` despite the request. It acts only while the cell resolves `editor` to `false`: an
 * inherited named editor is already the editor the request asks to keep. Only the editor is applied:
 * expanding the whole inherited type onto the cell would shadow the options the column sets next to
 * its `type` (a custom `renderer`, for example). The value is recorded in `TYPE_ASSIGNED_EDITOR` and is not a stored key, so removing the
 * marker removes it too (see `CellMeta#removeMeta`).
 *
 * @param {object} metaObject The cell meta object.
 * @returns {boolean} `true` when the editor was applied.
 */
export function applyRequestedTypeEditor(metaObject: Record<string, unknown>): boolean {
  if (
    metaObject[TYPE_EDITOR_REQUESTED_KEY] !== true ||
    !hasOwnProperty(metaObject, TYPE_EDITOR_REQUESTED_KEY) ||
    hasOwnProperty(metaObject, 'type') ||
    hasOwnProperty(metaObject, 'editor') ||
    // Only an inherited `false` stands between the cell and its type's editor. A named editor (a column's
    // `editor: 'password'`, or the `'autocomplete'` a column sets next to `type: 'dropdown'`) is kept.
    metaObject.editor !== false
  ) {
    return false;
  }

  const validType = typeof metaObject.type === 'string' ? getCellType(metaObject.type) : metaObject.type;

  if (!isTypeDefinition(validType) || !hasOwnProperty(validType, 'editor')) {
    return false;
  }

  const editor = validType.editor;

  metaObject.editor = editor;
  TYPE_ASSIGNED_EDITOR.set(metaObject, editor);

  return true;
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
