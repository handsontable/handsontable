import { toRaw, PropType } from 'vue';
import Handsontable, { OmitHooks, RemoveIndexSignature } from 'handsontable/base';
import { HotTableProps, VueProps } from './types';

const unassignedPropSymbol = Symbol('unassigned');

/**
 * The shape `defineComponent()` reads the prop types from, with one entry per option of `Settings`. `type`
 * exists only for the type checker: the runtime schema built by `propFactory()` carries none, so Vue
 * neither validates nor casts a prop.
 *
 * `RemoveIndexSignature` drops the index signature of `Settings`. Left in, it becomes an index signature of
 * the props, and Vue types every prop as `any` again. The mapping also drops `afterChangesObserved`: the
 * settings types list that hook, but core neither registers nor fires it, so a prop for it could never work.
 * `SettingsProp` is what the `settings` prop takes.
 */
type PropSchema<Settings, SettingsProp = Settings> = {
  [P in keyof RemoveIndexSignature<Settings> as P extends 'afterChangesObserved' ? never : P]-?: {
    type: PropType<RemoveIndexSignature<Settings>[P]>,
    default: unknown,
  };
} & {
  settings: {
    type: PropType<SettingsProp>,
    default: unknown,
  },
};

/**
 * `HotColumn` takes column settings, not grid settings: its `data` is a property name or a getter, where the
 * grid's `data` is an array of rows. Hooks run from the grid-level settings only, and core reads `getValue`
 * from the table meta only, so neither is a prop of a column. The `settings` prop also takes a grid settings
 * object, as it did when every prop was `any`: such an object has no `data` that would clash.
 */
type HotColumnPropSchema = PropSchema<
  Omit<OmitHooks<RemoveIndexSignature<Handsontable.ColumnSettings>>, 'getValue'>,
  Handsontable.ColumnSettings | Handsontable.GridSettings
>;

/**
 * `HotTable` takes the settings `updateSettings()` takes: a hook prop may be `null`, which removes the
 * callback the earlier props passed for it.
 */
type HotTablePropSchema = PropSchema<Handsontable.SettingsUpdate> & {
  id: {
    type: PropType<string>,
  },
};

/**
 * Message for the warning thrown if the Handsontable instance has been destroyed.
 */
export const HOT_DESTROYED_WARNING = 'The Handsontable instance bound to this component was destroyed and cannot be' +
  ' used properly.';

/**
 * Check if at specified `key` there is any value for `object`.
 *
 * @param {object} object Object to search value at specyfic key.
 * @param {string} key String key to check.
 * @returns {boolean}
 */
export function hasOwnProperty(object: unknown, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Generate an object containing all the available Handsontable properties and plugin hooks.
 *
 * @param {string} source Source for the factory (either 'HotTable' or 'HotColumn').
 * @returns {object}
 */
export function propFactory(source: 'HotTable'): HotTablePropSchema;
export function propFactory(source: 'HotColumn'): HotColumnPropSchema;
/**
 * Implementation of the overloads above.
 *
 * @param {string} source Source for the factory (either 'HotTable' or 'HotColumn').
 * @returns {object}
 */
export function propFactory(source: 'HotTable' | 'HotColumn'): HotTablePropSchema | HotColumnPropSchema {
  const registeredHooks = Handsontable.hooks.getRegistered();
  const propSchema: VueProps<HotTableProps> = {};

  Object.assign(propSchema, Handsontable.DefaultSettings);

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const prop in propSchema) {
    propSchema[prop] = {
      default: unassignedPropSymbol
    };
  }

  for (let i = 0; i < registeredHooks.length; i++) {
    propSchema[registeredHooks[i]] = {
      default: unassignedPropSymbol
    };
  }

  // Documented options that have no entry in `DefaultSettings`, so the loops above never reach them.
  propSchema.handsontable = {
    default: unassignedPropSymbol
  };

  propSchema.settings = {
    default: unassignedPropSymbol
  };

  if (source === 'HotTable') {
    // Core reads `getValue` from the table meta only, so a column has no use for it.
    propSchema.getValue = {
      default: unassignedPropSymbol
    };

    propSchema.id = {
      type: String,
    };
  }

  // The schema is filled at runtime from `DefaultSettings`, the registered hooks, and the options named
  // above, which is why it is built loosely and typed here, from `SettingsUpdate` and `ColumnSettings`, for the template type checker.
  return propSchema as unknown as HotTablePropSchema | HotColumnPropSchema;
}

/**
 * Generate a random id for the `HotTable` container. It has to be created on the client only: an id
 * generated on the server never matches the one the browser generates while hydrating.
 *
 * @returns {string} The container id.
 */
export function generateContainerId(): string {
  const buffer = new Uint16Array(3);

  globalThis.crypto.getRandomValues(buffer);

  return `hot-${Array.from(buffer, value => value.toString(16).padStart(4, '0')).join('')}`;
}

/**
 * Filter out all of the unassigned props, and return only the one passed to the component.
 *
 * @param {object} props Object containing all the possible props.
 * @returns {object} Object containing only used props.
 */
export function filterPassedProps(props) {
  const filteredProps: VueProps<HotTableProps> = {};
  const columnSettingsProp = props.settings;

  if (columnSettingsProp !== unassignedPropSymbol) {
    // eslint-disable-next-line no-restricted-syntax
    for (const propName in columnSettingsProp) {
      if (hasOwnProperty(columnSettingsProp, propName) && columnSettingsProp[propName] !== unassignedPropSymbol) {
        filteredProps[propName] = columnSettingsProp[propName];
      }
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const propName in props) {
    if (hasOwnProperty(props, propName) && propName !== 'settings' && props[propName] !== unassignedPropSymbol) {
      filteredProps[propName] = props[propName];
    }
  }

  return filteredProps;
}

/**
 * List the hooks the props pass a callback for, directly or through the `settings` prop. A key counts as
 * a hook by the rule core's `updateSettings()` uses in `core.ts`: a registered or a deprecated hook name.
 * Only a function or an array of them counts as a callback: core ignores any other value, so a hook prop
 * that holds `false` (`:afterChange="on && logChange"`) is treated as removed.
 *
 * @param {HotTableProps} props The props passed to the component.
 * @returns {string[]} The hook names.
 */
export function getPassedHookKeys(props: HotTableProps): string[] {
  const passedProps: VueProps<HotTableProps> = filterPassedProps(props);

  return Object.keys(passedProps).filter(key => (
    (typeof passedProps[key] === 'function' || Array.isArray(passedProps[key])) &&
    (Handsontable.hooks.isRegistered(key) || Handsontable.hooks.isDeprecated(key))
  ));
}

/**
 * What the wrapper last knew about a setting: the prop value it synced, a copy of its content, and the value the
 * grid held right after. The copy is needed because core edits an array it was given in place (`alter()` splices
 * `colHeaders`), so the prop itself no longer shows what was synced.
 */
export type SettingBaseline = { prop: unknown, copy: unknown, live: unknown };

/**
 * Check if a value is a plain object, one made by an object literal or with no prototype. A class instance is not.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
function isLiteralObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Copy the plain objects and arrays of a settings value, and keep every other value (functions, class instances)
 * by reference. The copy is what the next change is compared with, so a value the app edits in place reads as
 * changed. Reactive proxies are unwrapped, and a value with a cycle is copied with the same cycle.
 *
 * @param {unknown} value The value to copy.
 * @param {WeakMap<object, unknown>} [copies] The copies made so far, by original.
 * @returns {unknown} The copy.
 */
function copySettingsValue(value: unknown, copies: WeakMap<object, unknown> = new WeakMap()): unknown {
  const raw = toRaw(value);

  if (!Array.isArray(raw) && !isLiteralObject(raw)) {
    return raw;
  }

  if (copies.has(raw)) {
    return copies.get(raw);
  }

  if (Array.isArray(raw)) {
    const arrayCopy: unknown[] = [];

    copies.set(raw, arrayCopy);
    raw.forEach((item) => {
      arrayCopy.push(copySettingsValue(item, copies));
    });

    return arrayCopy;
  }

  const objectCopy: Record<string, unknown> = {};

  copies.set(raw, objectCopy);
  Object.keys(raw).forEach((key) => {
    objectCopy[key] = copySettingsValue(raw[key], copies);
  });

  return objectCopy;
}

/**
 * Compare a copy made by `copySettingsValue()` with a value: plain objects and arrays by content, a `RegExp` by
 * its source and flags, anything else by reference. A pair already being compared higher up reads as equal,
 * so a value with a cycle ends.
 *
 * @param {unknown} copied The copy.
 * @param {unknown} value The value to compare it with.
 * @param {WeakMap<object, WeakSet<object>>} [visited] The object pairs on the current comparison path.
 * @returns {boolean} `true` if they hold the same content.
 */
function isSameAsCopy(
  copied: unknown,
  value: unknown,
  visited: WeakMap<object, WeakSet<object>> = new WeakMap()
): boolean {
  const raw = toRaw(value);

  if (copied === raw) {
    return true;
  }

  if (copied instanceof RegExp || raw instanceof RegExp) {
    return copied instanceof RegExp && raw instanceof RegExp &&
      copied.source === raw.source && copied.flags === raw.flags;
  }

  const bothArrays = Array.isArray(copied) && Array.isArray(raw);

  if (!bothArrays && !(isLiteralObject(copied) && isLiteralObject(raw))) {
    return false;
  }

  const copiedObject = copied as Record<string, unknown>;
  const rawObject = raw as Record<string, unknown>;
  const comparedWith = visited.get(copiedObject);

  if (comparedWith?.has(rawObject)) {
    return true;
  }

  if (comparedWith) {
    comparedWith.add(rawObject);
  } else {
    visited.set(copiedObject, new WeakSet([rawObject]));
  }

  const keys = Object.keys(copiedObject);

  return keys.length === Object.keys(rawObject).length &&
    keys.every(key => hasOwnProperty(rawObject, key) && isSameAsCopy(copiedObject[key], rawObject[key], visited));
}

/**
 * The settings by name, as `SettingBaseline`s. `HotTable` keeps one per instance.
 */
export type SettingBaselines = Record<string, SettingBaseline>;

/**
 * Settings the baseline rule leaves alone. The sizes are re-sent whenever they differ from the grid's value,
 * because the user can change them by dragging and the prop re-declares them (the React wrapper does the
 * same). `data` has its own path in `HotTable`, and a baseline would keep the previous array alive.
 */
const BASELINE_EXEMPT_KEYS = ['data', 'colWidths', 'rowHeights', 'minRowHeights', 'themeName'];

/**
 * Settings whose baseline holds the reference only, with no copy of the content. `sheetsBar` carries every sheet's
 * `data`, which a copy on each reactive change would walk again (`isEqualSetting()` avoids the same walk).
 */
const REFERENCE_ONLY_KEYS = ['sheetsBar'];

/**
 * Check if the app replaced the value of a setting through the instance (`hot.updateSettings()`) since the
 * wrapper last synced the prop, while the prop itself stayed the same. Such a prop is not sent again: it did
 * not change, and sending it would take back what the app set.
 *
 * @param {string} key The setting name.
 * @param {unknown} propValue The value passed through the props.
 * @param {Handsontable.GridSettings} currentSettings The grid's current settings.
 * @param {SettingBaselines} [baselines] What the wrapper last synced.
 * @returns {boolean} `true` if the app overrode the setting.
 */
function isOverriddenByApp(
  key: string,
  propValue: unknown,
  currentSettings?: Handsontable.GridSettings,
  baselines?: SettingBaselines
): boolean {
  const baseline = baselines?.[key];

  // The cheap check goes first: the content compare runs only for a setting the app replaced.
  return !!currentSettings && !!baseline && !BASELINE_EXEMPT_KEYS.includes(key) &&
    !Object.is(currentSettings[key], baseline.live) &&
    (isSameReference(baseline.prop, propValue) ||
      (!REFERENCE_ONLY_KEYS.includes(key) && isSameAsCopy(baseline.copy, propValue)));
}

/**
 * Record the props the wrapper has just synced with the grid, for the next change to compare with. A setting the
 * app overrode (`overriddenKeys`) keeps its previous baseline, so the override outlives the next changes and
 * is given up only when the prop itself changes.
 *
 * @param {SettingBaselines} baselines What the wrapper last synced. It is updated in place.
 * @param {HotTableProps} props The props passed to the component.
 * @param {Handsontable.GridSettings} currentSettings The grid's current settings.
 * @param {string[]} [overriddenKeys] The settings `prepareSettings()` left out because the app overrode them.
 */
export function recordSettingBaselines(
  baselines: SettingBaselines,
  props: HotTableProps,
  currentSettings: Handsontable.GridSettings,
  overriddenKeys: string[] = []
): void {
  const passedProps: VueProps<HotTableProps> = filterPassedProps(props);

  Object.keys(baselines).forEach((key) => {
    if (!hasOwnProperty(passedProps, key)) {
      delete baselines[key];
    }
  });

  Object.keys(passedProps).forEach((key) => {
    if (!overriddenKeys.includes(key) && !BASELINE_EXEMPT_KEYS.includes(key)) {
      baselines[key] = {
        prop: toRaw(passedProps[key]),
        copy: REFERENCE_ONLY_KEYS.includes(key) ? undefined : copySettingsValue(passedProps[key]),
        live: currentSettings[key],
      };
    }
  });
}

/**
 * Prepare the settings object to be used as the settings for Handsontable, based on the props provided to the component.
 *
 * A hook listed in `previousHookKeys` that the props no longer pass a callback for (the prop is removed or
 * `undefined`) is sent as `null`, which removes the callback the props registered.
 *
 * A prop that is the same value the wrapper last synced (`baselines`) is left out when the grid's value for it
 * was replaced since, through `hot.updateSettings()`: the app's value stays until the prop changes.
 *
 * @param {HotTableProps} props The props passed to the component.
 * @param {Handsontable.GridSettings} currentSettings The current Handsontable settings.
 * @param {string[]} previousHookKeys The hooks the previous props passed a callback for.
 * @param {SettingBaselines} [baselines] What the wrapper last synced.
 * @param {string[]} [overriddenKeys] Receives the names of the props left out because the app overrode them.
 * @returns {Handsontable.GridSettings} An object containing the properties, ready to be used within Handsontable.
 */
export function prepareSettings(
  props: HotTableProps,
  currentSettings?: Handsontable.GridSettings,
  previousHookKeys: string[] = [],
  baselines?: SettingBaselines,
  overriddenKeys: string[] = []
): HotTableProps {
  const assignedProps: VueProps<HotTableProps> = filterPassedProps(props);
  const hotSettingsInProps: Handsontable.GridSettings = props.settings ? props.settings : assignedProps;
  const additionalHotSettingsInProps: Handsontable.GridSettings | null = props.settings ? assignedProps : null;
  const initOnlySettingKeys: string[] =
    (currentSettings as any)?._initOnlySettings || [];
  const newSettings: Handsontable.GridSettings = {};
  const isOverridden = (key: string, value: unknown): boolean => {
    // A direct prop wins over the same key in the `settings` prop, and the baseline holds the winner.
    const effectiveValue = hasOwnProperty(assignedProps, key) ? assignedProps[key] : value;
    const overridden = isOverriddenByApp(key, effectiveValue, currentSettings, baselines);

    if (overridden && !overriddenKeys.includes(key)) {
      overriddenKeys.push(key);
    }

    return overridden;
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const key in hotSettingsInProps) {
    if (
      hasOwnProperty(hotSettingsInProps, key) &&
      hotSettingsInProps[key] !== undefined &&
      !initOnlySettingKeys.includes(key) &&
      !isOverridden(key, hotSettingsInProps[key]) &&
      ((currentSettings && key !== 'data')
        ? !isEqualSetting(key, currentSettings[key], hotSettingsInProps[key], currentSettings) : true)
    ) {
      newSettings[key] = hotSettingsInProps[key];
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in additionalHotSettingsInProps) {
    if (
      hasOwnProperty(additionalHotSettingsInProps, key) &&
      key !== 'id' &&
      key !== 'settings' &&
      additionalHotSettingsInProps[key] !== undefined &&
      !initOnlySettingKeys.includes(key) &&
      !isOverridden(key, additionalHotSettingsInProps[key]) &&
      ((currentSettings && key !== 'data')
        ? !isEqualSetting(key, currentSettings[key], additionalHotSettingsInProps[key], currentSettings) : true)
    ) {
      newSettings[key] = additionalHotSettingsInProps[key];
    }
  }

  if (previousHookKeys.length > 0) {
    const passedHookKeys = getPassedHookKeys(props);

    previousHookKeys.forEach((key) => {
      if (!passedHookKeys.includes(key)) {
        newSettings[key] = null;
      }
    });
  }

  return newSettings;
}

/**
 * Compare the grid's current value of a setting with the value passed through the props.
 *
 * `sheetsBar` is compared key by key: a template writes it as an object literal
 * (`:sheetsBar="{ sheets }"`), which is a new object on every render, while the sheets it holds keep
 * every sheet's data, which must not be serialized on each change. The `sheets` array is compared by
 * reference, and an option given as an object literal (`animation: { switch: false }`) by the
 * references of its own keys. A new `sheets` array or a changed option in a new `sheetsBar` object is
 * therefore sent, even when it differs only by a function. A change made inside the same `sheetsBar`
 * object or the same `sheets` array is not sent, and neither are the plugin's own writes into that
 * array. `themeName` is compared with the grid's `theme`, because core moves the name there and
 * `getSettings().themeName` stays `undefined`. Every other setting is compared with `simpleEqual()`.
 *
 * @param {string} key The setting name.
 * @param {unknown} currentValue The grid's current value.
 * @param {unknown} newValue The value passed through the props.
 * @param {Handsontable.GridSettings} currentSettings The grid's current settings.
 * @returns {boolean} `true` if the value does not need to be sent.
 */
function isEqualSetting(
  key: string,
  currentValue: unknown,
  newValue: unknown,
  currentSettings: Handsontable.GridSettings
): boolean {
  if (key === 'sheetsBar') {
    return haveEqualOwnKeys(currentValue, newValue, (propName, valueA, valueB) => (
      propName === 'sheets' ? isSameReference(valueA, valueB) : isShallowEqualByReference(valueA, valueB)
    ));
  }

  if (key === 'themeName' && currentValue === undefined) {
    return typeof newValue === 'string' && currentSettings.theme === newValue;
  }

  return simpleEqual(currentValue, newValue);
}

/**
 * Compare two values by reference, and two plain objects by the references of their own keys.
 *
 * @param {unknown} valueA First value to compare.
 * @param {unknown} valueB Second value to compare.
 * @returns {boolean} `true` if they're the same, `false` otherwise.
 */
function isShallowEqualByReference(valueA: unknown, valueB: unknown): boolean {
  return haveEqualOwnKeys(valueA, valueB, (propName, keyValueA, keyValueB) => isSameReference(keyValueA, keyValueB));
}

/**
 * Compare two values by reference, or, when both are plain objects, compare their own keys with the
 * given function. Reactive proxies are compared by their raw objects.
 *
 * @param {unknown} valueA First value to compare.
 * @param {unknown} valueB Second value to compare.
 * @param {Function} isEqualValue Compares the values both objects hold under one key.
 * @returns {boolean} `true` if they're the same, `false` otherwise.
 */
function haveEqualOwnKeys(
  valueA: unknown,
  valueB: unknown,
  isEqualValue: (propName: string, keyValueA: unknown, keyValueB: unknown) => boolean,
): boolean {
  const rawA = toRaw(valueA);
  const rawB = toRaw(valueB);

  if (rawA === rawB) {
    return true;
  }

  if (!isPlainObject(rawA) || !isPlainObject(rawB)) {
    return false;
  }

  const keysA = Object.keys(rawA);
  const keysB = Object.keys(rawB);

  return keysA.length === keysB.length &&
    keysA.every(propName => hasOwnProperty(rawB, propName) && isEqualValue(propName, rawA[propName], rawB[propName]));
}

/**
 * Compare two values by reference, with reactive proxies compared by their raw objects.
 *
 * @param {unknown} valueA First value to compare.
 * @param {unknown} valueB Second value to compare.
 * @returns {boolean} `true` if they're the same, `false` otherwise.
 */
function isSameReference(valueA: unknown, valueB: unknown): boolean {
  return toRaw(valueA) === toRaw(valueB);
}

/**
 * Check if a value is a plain object.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Compare two objects using `JSON.stringify`.
 * *Note: * As it's using the stringify function to compare objects, the property order in both objects is
 * important. It will return `false` for the same objects, if they're defined in a different order.
 *
 * @param {object} objectA First object to compare.
 * @param {object} objectB Second object to compare.
 * @returns {boolean} `true` if they're the same, `false` otherwise.
 */
function simpleEqual(objectA, objectB) {
  // Shared across both stringify calls so the same Node/function instance maps
  // to the same identity token in objectA's string and objectB's string.
  const identityMap = new WeakMap<object, string>();
  let nextIdentityId = 0;

  const stringifyToJSON = (val) => {
    const seen = new WeakSet();

    return JSON.stringify(val, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return undefined;
        }

        seen.add(value);

        // DOM nodes carry framework metadata as enumerable own properties
        // (e.g., Vue 3 attaches `_vnode` to the mount root). Recursing into them
        // can reach getters that throw - see GH #11220 - and produces noise that
        // is irrelevant to settings equality. Replace each Node with an identity
        // token so reference equality is still detected.
        if (typeof Node !== 'undefined' && value instanceof Node) {
          let id = identityMap.get(value);

          if (id === undefined) {
            nextIdentityId += 1;
            id = `__hot_node_${nextIdentityId}__`;
            identityMap.set(value, id);
          }

          return id;
        }
      }

      return value;
    });
  };

  if (typeof objectA === 'function' && typeof objectB === 'function') {
    return objectA.toString() === objectB.toString();

  } else if (typeof objectA !== typeof objectB) {
    return false;

  } else {
    try {
      return stringifyToJSON(objectA) === stringifyToJSON(objectB);
    } catch (e) {
      // If either side cannot be serialized (e.g., contains a throwing getter),
      // assume the values are not equal so the wrapper still updates settings.
      return false;
    }
  }
}
