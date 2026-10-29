import { toRaw, PropType } from 'vue';
import Handsontable from 'handsontable/base';
import { HotTableProps, VueProps } from './types';

const unassignedPropSymbol = Symbol('unassigned');

/**
 * The shape `defineComponent()` reads the prop types from, with one entry per option of `Settings`. `type`
 * exists only for the type checker: the runtime schema built by `propFactory()` carries none, so Vue
 * neither validates nor casts a prop.
 *
 * The `as` clause drops the index signature of `Settings`. Left in, it becomes an index signature of the
 * props, and Vue types every prop as `any` again. It also drops `afterChangesObserved`: the settings types
 * list that hook, but core neither registers nor fires it, so a prop for it could never work.
 */
type PropSchema<Settings> = {
  [P in keyof Settings as string extends P ? never : P extends 'afterChangesObserved' ? never : P]-?: {
    type: PropType<Settings[P]>,
    default: unknown,
  };
} & {
  settings: {
    type: PropType<Settings>,
    default: unknown,
  },
};

/**
 * `HotColumn` takes column settings, not grid settings: its `data` is a property name or a getter, where the
 * grid's `data` is an array of rows.
 */
type HotColumnPropSchema = PropSchema<Handsontable.ColumnSettings>;

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
  propSchema.getValue = {
    default: unassignedPropSymbol
  };

  propSchema.settings = {
    default: unassignedPropSymbol
  };

  if (source === 'HotTable') {
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
 * Prepare the settings object to be used as the settings for Handsontable, based on the props provided to the component.
 *
 * @param {HotTableProps} props The props passed to the component.
 * @param {Handsontable.GridSettings} currentSettings The current Handsontable settings.
 * @returns {Handsontable.GridSettings} An object containing the properties, ready to be used within Handsontable.
 */
export function prepareSettings(props: HotTableProps, currentSettings?: Handsontable.GridSettings): HotTableProps {
  const assignedProps: VueProps<HotTableProps> = filterPassedProps(props);
  const hotSettingsInProps: Handsontable.GridSettings = props.settings ? props.settings : assignedProps;
  const additionalHotSettingsInProps: Handsontable.GridSettings | null = props.settings ? assignedProps : null;
  const initOnlySettingKeys: string[] =
    (currentSettings as any)?._initOnlySettings || [];
  const newSettings: Handsontable.GridSettings = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const key in hotSettingsInProps) {
    if (
      hasOwnProperty(hotSettingsInProps, key) &&
      hotSettingsInProps[key] !== undefined &&
      !initOnlySettingKeys.includes(key) &&
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
      ((currentSettings && key !== 'data')
        ? !isEqualSetting(key, currentSettings[key], additionalHotSettingsInProps[key], currentSettings) : true)
    ) {
      newSettings[key] = additionalHotSettingsInProps[key];
    }
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
