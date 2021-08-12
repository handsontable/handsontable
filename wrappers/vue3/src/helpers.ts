import Handsontable from 'handsontable';
import {HotTableProps, VueProps, EditorComponent, HotColumnProps} from './types';

const SYMBOL_UNSIGNED = Symbol('unassigned');
let bulkComponentContainer = null;

/**
 * Message for the warning thrown if the Handsontable instance has been destroyed.
 */
export const WARNING_HOT_DESTROYED = 'The Handsontable instance bound to this component was destroyed and cannot be' +
  ' used properly.';

/**
 * Rewrite the settings object passed to the watchers to be a clean array/object prepared to use within Handsontable config.
 *
 * @param {*} observerSettings Watcher object containing the changed data.
 * @returns {Object|Array}
 */
export function rewriteSettings(observerSettings): any[] | object {
  const settingsType = Object.prototype.toString.call(observerSettings);
  let settings: any[] | object | null = null;
  let type: { array?: boolean, object?: boolean } = {};

  if (settingsType === '[object Array]') {
    settings = [];
    type.array = true;

  } else if (settingsType === '[object Object]') {
    settings = {};
    type.object = true;
  }

  if (type.array || type.object) {
    for (const p in observerSettings) {
      if (observerSettings.hasOwnProperty(p)) {
        settings[p] = observerSettings[p];
      }
    }

  } else {
    settings = observerSettings;
  }

  return settings;
}

/**
 * Private method to ensure the table is not calling `updateSettings` after editing cells.
 * @private
 */
export function preventInternalEditWatch(component) {
  if (component.hotInstance) {
    component.hotInstance.addHook('beforeChange', () => {
      component.__internalEdit = true;
    });

    component.hotInstance.addHook('beforeCreateRow', () => {
      component.__internalEdit = true;
    });

    component.hotInstance.addHook('beforeCreateCol', () => {
      component.__internalEdit = true;
    });

    component.hotInstance.addHook('beforeRemoveRow', () => {
      component.__internalEdit = true;
    });

    component.hotInstance.addHook('beforeRemoveCol', () => {
      component.__internalEdit = true;
    });
  }
}

/**
 * Generate an object containing all the available Handsontable properties and plugin hooks.
 *
 * @returns {Object}
 */
export function propFactory(): VueProps<HotColumnProps> {
  const registeredHooks: string[] = Handsontable.hooks.getRegistered();

  let propSchema: VueProps<HotColumnProps> = {
    ...Handsontable.DefaultSettings, 
    settings: {
      default: SYMBOL_UNSIGNED
    }
  };

  for (let prop in propSchema) {
    propSchema[prop] = {
      default: SYMBOL_UNSIGNED
    };
  }

  for (let i = 0; i < registeredHooks.length; i++) {
    propSchema[registeredHooks[i]] = {
      default: SYMBOL_UNSIGNED
    };
  }


  return propSchema;
}

/**
 * Generate an object containing all the available Handsontable properties and plugin hooks.
 *
 * @returns {Object}
 */
export function tablePropFactory(): VueProps<HotTableProps> {
  return Object.assign(propFactory(), {
    id: {
      type: String,
      default: 'hot-' + Math.random().toString(36).substring(5)
    },
    wrapperRendererCacheSize: {
      type: Number,
      default: 3000
    },
  });
}

/**
 * Filter out all of the unassigned props, and return only the one passed to the component.
 *
 * @param {Object} props Object containing all the possible props.
 * @returns {Object} Object containing only used props.
 */
export function filterPassedProps(props) {
  const filteredProps: VueProps<HotTableProps> = {};
  const columnSettingsProp = props['settings'];

  if (columnSettingsProp !== SYMBOL_UNSIGNED) {
    for (let propName in columnSettingsProp) {
      if (columnSettingsProp.hasOwnProperty(propName) && columnSettingsProp[propName] !== SYMBOL_UNSIGNED) {
        filteredProps[propName] = columnSettingsProp[propName];
      }
    }
  }

  for (let propName in props) {
    if (props.hasOwnProperty(propName) && propName !== 'settings' && props[propName] !== SYMBOL_UNSIGNED) {
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
export function prepareSettings(props: HotTableProps, currentSettings?: Handsontable.GridSettings): Handsontable.GridSettings {
  const assignedProps: VueProps<HotTableProps> = filterPassedProps(props);
  const hotSettingsInProps: {} = props.settings ? props.settings : assignedProps;
  const additionalHotSettingsInProps: Handsontable.GridSettings = props.settings ? assignedProps : null;
  const newSettings = {};

  for (const key in hotSettingsInProps) {
    if (
      hotSettingsInProps.hasOwnProperty(key) &&
      hotSettingsInProps[key] !== void 0 &&
      ((currentSettings && key !== 'data') ? !simpleEqual(currentSettings[key], hotSettingsInProps[key]) : true)
    ) {
      newSettings[key] = hotSettingsInProps[key];
    }
  }

  for (const key in additionalHotSettingsInProps) {
    if (
      additionalHotSettingsInProps.hasOwnProperty(key) &&
      key !== 'id' &&
      key !== 'settings' &&
      key !== 'wrapperRendererCacheSize' &&
      additionalHotSettingsInProps[key] !== void 0 &&
      ((currentSettings && key !== 'data') ? !simpleEqual(currentSettings[key], additionalHotSettingsInProps[key]) : true)
    ) {
      newSettings[key] = additionalHotSettingsInProps[key];
    }
  }

  return newSettings;
}

/**
 * Get the VNode element with the provided type attribute from the component slots.
 *
 * @param {Array} componentSlots Array of slots from a component.
 * @param {String} type Type of the child component. Either `hot-renderer` or `hot-editor`.
 * @returns {Object|null} The VNode of the child component (or `null` when nothing's found).
 */
export function findVNodeByType(componentSlots, type: string) {
  let componentVNode = null;

  componentSlots.every((slot, index) => {
    if (slot.data && slot.data.attrs && slot.data.attrs[type] !== void 0) {
      componentVNode = slot;
      return false;
    }

    return true;
  });

  return componentVNode;
}

/**
 * Get all `hot-column` component instances from the provided children array.
 *
 * @param {Array} children Array of children from a component.
 * @returns {Array} Array of `hot-column` instances.
 */
export function getHotColumnComponents(children) {
  return children.filter((child) => child.type.name === 'HotColumn');
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
  return JSON.stringify(objectA) === JSON.stringify(objectB);
}
