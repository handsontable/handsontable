import { createApp } from 'vue';
import Handsontable from 'handsontable/base';
import { HotTableProps, VueProps, VNode } from './types';

const unassignedPropSymbol = Symbol('unassigned');
let bulkComponentContainer = null;

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
 * Private method to ensure the table is not calling `updateSettings` after editing cells.
 *
 * @private
 * @param {VNode} component VNode component.
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
 * @param {string} source Source for the factory (either 'HotTable' or 'HotColumn').
 * @returns {object}
 */
export function propFactory(source): VueProps<HotTableProps> {
  const registeredHooks = Handsontable.hooks.getRegistered();
  const propSchema: VueProps<HotTableProps> = {} as any;

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

    propSchema.wrapperRendererCacheSize = {
      type: Number,
      default: 3000
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
      key !== 'wrapperRendererCacheSize' &&
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
 * Get the VNode element with the provided type attribute from the component slots.
 *
 * @param {Array} componentSlots Array of slots from a component.
 * @param {string} type Type of the child component. Either `hot-renderer` or `hot-editor`.
 * @returns {Object|null} The VNode of the child component (or `null` when nothing's found).
 */
export function findVNodeByType(componentSlots: VNode[], type: string): VNode {
  let componentVNode: VNode = null;

  componentSlots.every((slot) => {
    if (slot.props && slot.props[type] !== void 0) {
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
 * @param {VNode[]} children Array of children from a component.
 * @returns {VNode[]} Array of `hot-column` instances.
 */
export function getHotColumnComponents(children) {
  return children.filter(child => getVNodeName(child) === 'HotColumn');
}

/**
 * Returns the Vue Component name.
 *
 * @param {VNode} node VNode element to be checked.
 * @returns {string}
 */
export function getVNodeName(node: VNode) {
  if (typeof node.type === 'string') {
    return node.type;
  }

  return node.type?.name;
}

/**
 * Create an instance of the Vue Component based on the provided VNode.
 *
 * @param {VNode} vNode VNode element to be turned into a component instance.
 * @param {VNode} parent Instance of the component to be marked as a parent of the newly created instance.
 * @param {object} data Data to be passed to the new instance.
 * @returns {VNode}
 */
export function createVueComponent(vNode: VNode, parent: VNode, data: Record<string, unknown>) {
  const ownerDocument = parent.$el ? parent.$el.ownerDocument : document;

  if (!bulkComponentContainer) {
    bulkComponentContainer = ownerDocument.createElement('DIV');
    bulkComponentContainer.id = 'vueHotComponents';

    ownerDocument.body.appendChild(bulkComponentContainer);
  }

  const componentContainer = ownerDocument.createElement('DIV');

  bulkComponentContainer.appendChild(componentContainer);

  // Clone component props without `hot-editor` and `hot-renderer` props
  const {
    'hot-editor': _hotEditor,
    'hot-renderer': _hotRenderer,
    ...newProps
  } = vNode.props;
  const app = createApp({
    ...vNode.type,
    data() {
      return Object.assign(typeof vNode.type.data === 'function' ? vNode.type.data() : {}, data);
    }
  }, newProps);

  return app.mount(componentContainer);
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
