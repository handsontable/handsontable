import { extend, hasOwnProperty, isObject } from '../../../helpers/object';
import { getCellType, hasCellType } from '../../../cellTypes/registry';
import { extendByMetaType, normalizeEditorSetting } from '../utils';
import metaSchemaFactory from '../metaSchema';

/**
 * @typedef {Options} TableMeta
 */
/**
 * @returns {TableMeta} Returns an empty object. The holder for global meta object.
 */
function createTableMetaEmptyClass() {
  return class TableMeta {};
}

/**
 * Tells whether two cell type objects carry the same members. A framework wrapper that writes a `type` object
 * inline sends a new object with the same members on every commit, which is not a change of the type.
 *
 * @param {object} first The first cell type object.
 * @param {object} second The second cell type object.
 * @returns {boolean}
 */
function hasSameTypeMembers(first: object, second: object): boolean {
  const firstKeys = Object.keys(first);

  return firstKeys.length === Object.keys(second).length &&
    firstKeys.every(key => hasOwnProperty(second, key) &&
      (first as Record<string, unknown>)[key] === (second as Record<string, unknown>)[key]);
}

/**
 * The global meta object is a root of all default settings, which are recognizable by Handsontable.
 * Other layers are inherited from this object. Adding, removing, or changing property in that
 * object has a direct reflection to all layers such as: TableMeta, ColumnMeta, or CellMeta layers.
 *
 * +-------------+.
 * │ GlobalMeta  │
 * │ (prototype) │
 * +-------------+\
 *       │         \
 *       │          \
 *      \│/         _\|
 * +-------------+    +-------------+.
 * │ TableMeta   │    │ ColumnMeta  │
 * │ (instance)  │    │ (prototype) │
 * +-------------+    +-------------+.
 *                         │
 *                         │
 *                        \│/
 *                    +-------------+.
 *                    │  CellMeta   │
 *                    │ (instance)  │
 *                    +-------------+.
 */
export default class GlobalMeta {
  /**
   * An alias for the constructor. Necessary for inheritance for creating new layers.
   *
   * @type {TableMeta}
   */
  metaCtor = createTableMetaEmptyClass();
  /**
   * Main object (prototype of the internal TableMeta class), holder for all default settings.
   *
   * @type {object}
   */
  declare meta: Record<string, unknown>;
  /**
   * The options the user wrote at grid level (the creation settings and every `updateSettings()` payload).
   * A type never overwrites one of them.
   */
  readonly #userSetKeys = new Set<string>();
  /**
   * The options the last grid-level `type` expansion wrote, with the value it wrote.
   */
  readonly #typeAssigned = new Map<string, unknown>();
  /**
   * The cell type object the global meta was last expanded with.
   */
  #expandedType: Record<string, unknown> | null = null;
  /**
   * The last `type` setting that named a registered cell type. `updateSettings()` writes a type name onto the
   * meta before it is checked, so a name no cell type is registered under is replaced with this one.
   */
  #typeSetting: unknown;
  /**
   * The keys the grid was created with an explicit `undefined` for. Creation reads that as "set", so no type
   * value reaches the key, and an update that restates `undefined` keeps it that way instead of unsetting it.
   */
  readonly #undefinedAtCreation = new Set<string>();

  /**
   * Initializes the global meta layer, populates the meta prototype with schema defaults, and attaches the Handsontable instance reference.
   */
  constructor(hot: unknown) {
    this.meta = this.metaCtor.prototype as Record<string, unknown>;

    extend(this.meta, metaSchemaFactory());

    this.meta.instance = hot;
  }

  /**
   * Gets constructor of the global meta object. Necessary for inheritance for creating the next meta layers.
   *
   * @returns {Function}
   */
  getMetaConstructor() {
    return this.metaCtor;
  }

  /**
   * Gets settings object for this layer.
   *
   * @returns {object}
   */
  getMeta() {
    return this.meta;
  }

  /**
   * Updates global settings object by merging settings with the current state.
   *
   * @param {object} settings An object to merge with.
   */
  updateMeta(settings: Record<string, unknown>) {
    const normalizedSettings = normalizeEditorSetting(settings);

    extend(this.meta, normalizedSettings);
    Object.keys(normalizedSettings).forEach((key) => {
      this.#userSetKeys.add(key);

      if (normalizedSettings[key] === undefined) {
        this.#undefinedAtCreation.add(key);
      }
    });

    const type = normalizedSettings.type ?? this.meta.type;

    this.#expandedType = this.#resolveType(type) ?? this.#expandedType;
    this.#typeSetting = this.#expandedType === null ? this.#typeSetting : type;
    extendByMetaType(this.meta, {
      ...normalizedSettings,
      type,
    }, normalizedSettings, settings.editor === true, this.#typeAssigned);
  }

  /**
   * Keeps the grid-level `type` in step with an `updateSettings()` payload whose options are already written
   * onto the meta. The payload's keys are recorded as set by the user, and the `type` is expanded again when the
   * payload names one, or when it unsets an option the current type supplies (`undefined`, unless the grid was created with an explicit `undefined` for that key).
   *
   * A key the user set, in this payload or an earlier one, keeps its value. The keys of the previous type are
   * restored to their defaults first, so the grid ends up as one created with the new type. A type name that
   * no cell type is registered under is ignored, as it was before the type was expanded on update.
   *
   * @param {object} settings The `updateSettings()` payload.
   * @returns {boolean} `true` when the expanded type is a different one than before. A type object with the same
   * members as the one in force is not a different one. The cell meta objects already stored keep what the
   * previous type's renderer wrote onto them, so the caller resets them.
   */
  updateTypeFromSettings(settings: Record<string, unknown>): boolean {
    const expandedBefore = this.#expandedType;
    const clearsTypeOption = expandedBefore !== null && Object.keys(settings).some(
      key => this.#unsets(key, settings[key]) && hasOwnProperty(expandedBefore, key)
    );
    const namesType = (typeof settings.type === 'string' || isObject(settings.type)) &&
      this.#resolveType(settings.type) !== null;

    // A name no cell type is registered under is ignored: the meta gets the type already in force back, and the
    // unset options fall back to it too.
    if (hasOwnProperty(settings, 'type') && !namesType && typeof settings.type === 'string') {
      this.meta.type = this.#typeSetting;
    }

    let resolvedType: Record<string, unknown> | null = null;

    if (namesType) {
      resolvedType = this.#resolveType(settings.type);

    } else if (clearsTypeOption) {
      resolvedType = this.#resolveType(this.meta.type) ?? expandedBefore;
    }

    this.#recordUserSetKeys(settings, namesType);

    if (resolvedType === null) {
      return false;
    }

    const typeChanged = resolvedType !== expandedBefore;

    if (typeChanged) {
      this.#restoreTypeValues();
    }

    const userSet: Record<string, unknown> = {};

    this.#userSetKeys.forEach((key) => {
      userSet[key] = true;
    });

    this.#expandedType = resolvedType;
    this.#typeSetting = namesType ? settings.type : this.#typeSetting;
    extendByMetaType(this.meta, { type: resolvedType }, userSet, settings.editor === true, this.#typeAssigned);

    return typeChanged && !(expandedBefore !== null && hasSameTypeMembers(resolvedType, expandedBefore));
  }

  /**
   * Records which keys of an `updateSettings()` payload the user set, and which it unset.
   *
   * @param {object} settings The `updateSettings()` payload.
   * @param {boolean} namesType Whether the payload names a `type`.
   */
  #recordUserSetKeys(settings: Record<string, unknown>, namesType: boolean) {
    Object.keys(settings).forEach((key) => {
      if (key === 'editor' && settings[key] === true) {
        // An `editor` of `true` names no editor, so it reads as "not passed" and records nothing. Next to a
        // `type` it is an explicit request for the type's editor, which replaces an editor set earlier.
        if (namesType) {
          this.#userSetKeys.delete(key);
        }

      } else if (this.#unsets(key, settings[key])) {
        this.#userSetKeys.delete(key);

      } else {
        this.#userSetKeys.add(key);
      }
    });
  }

  /**
   * Tells whether a value in an `updateSettings()` payload unsets the option. `undefined` does, except for a key
   * the grid was created with an explicit `undefined` for: that stays set, as at creation.
   *
   * @param {string} key The option name.
   * @param {*} value The value in the payload.
   * @returns {boolean}
   */
  #unsets(key: string, value: unknown): boolean {
    return value === undefined && !this.#undefinedAtCreation.has(key);
  }

  /**
   * Resolves a `type` value to its cell type object.
   *
   * @param {*} type The `type` setting: a registered name or a cell type object.
   * @returns {object|null} The cell type object, or `null` when the value names none.
   */
  #resolveType(type: unknown): Record<string, unknown> | null {
    if (typeof type === 'string' && !hasCellType(type)) {
      return null;
    }

    const resolved = typeof type === 'string' ? getCellType(type) : type;

    return isObject(resolved) ? resolved as Record<string, unknown> : null;
  }

  /**
   * Puts back the default of every option the previous type wrote, unless the user has replaced it since.
   */
  #restoreTypeValues() {
    const defaults = metaSchemaFactory() as Record<string, unknown>;

    this.#typeAssigned.forEach((value, key) => {
      // A key the payload just unset holds `undefined` now, and goes back to its default as well.
      if (this.#userSetKeys.has(key) || (this.meta[key] !== value && this.meta[key] !== undefined)) {
        return;
      }

      if (hasOwnProperty(defaults, key)) {
        this.meta[key] = defaults[key];
      } else {
        Reflect.deleteProperty(this.meta, key);
      }
    });

    this.#typeAssigned.clear();
  }
}
