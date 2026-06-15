import Handsontable from 'handsontable/base';
import { HotTableProps, VueProps } from './types';

const unassignedPropSymbol = Symbol('unassigned');

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
export function propFactory(source: 'HotTable' | 'HotColumn'): VueProps<HotTableProps> {
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

  propSchema.settings = {
    default: unassignedPropSymbol
  };

  if (source === 'HotTable') {
    propSchema.id = {
      type: String,
      default: `hot-${Math.random().toString(36).substring(5)}`
    };
  }

  return propSchema;
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
  const additionalHotSettingsInProps: Handsontable.GridSettings = props.settings ? assignedProps : null;
  const initOnlySettingKeys: string[] =
    (currentSettings as any)?._initOnlySettings || [];
  const newSettings: Handsontable.GridSettings = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const key in hotSettingsInProps) {
    if (
      hasOwnProperty(hotSettingsInProps, key) &&
      hotSettingsInProps[key] !== void 0 &&
      !initOnlySettingKeys.includes(key) &&
      ((currentSettings && key !== 'data') ? !simpleEqual(currentSettings[key], hotSettingsInProps[key]) : true)
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
      additionalHotSettingsInProps[key] !== void 0 &&
      !initOnlySettingKeys.includes(key) &&
      ((currentSettings && key !== 'data')
        ? !simpleEqual(currentSettings[key], additionalHotSettingsInProps[key]) : true)
    ) {
      newSettings[key] = additionalHotSettingsInProps[key];
    }
  }

  return newSettings;
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
