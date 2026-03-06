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
  const newSettings: Handsontable.GridSettings = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const key in hotSettingsInProps) {
    if (
      hasOwnProperty(hotSettingsInProps, key) &&
      hotSettingsInProps[key] !== void 0 &&
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
  const stringifyToJSON = (val) => {
    const circularReplacer = (function() {
      const seen = new WeakSet();

      return function(key, value) {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return;
          }

          seen.add(value);
        }

        return value;
      };
    }());

    return JSON.stringify(val, circularReplacer);
  };

  if (typeof objectA === 'function' && typeof objectB === 'function') {
    return objectA.toString() === objectB.toString();

  } else if (typeof objectA !== typeof objectB) {
    return false;

  } else {
    return stringifyToJSON(objectA) === stringifyToJSON(objectB);
  }
}
