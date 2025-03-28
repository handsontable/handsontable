import Handsontable from './base';
import { registerAllModules } from './registry';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations';
import jQueryWrapper from './helpers/wrappers/jquery';
import GhostTable from './utils/ghostTable';
import * as parseTableHelpers from './utils/parseTable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateHelpers from './helpers/date';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';
import { CellCoords } from './3rdparty/walkontable/src/cell/coords';
import { CellRange } from './3rdparty/walkontable/src/cell/range';
import {
  getRegisteredEditorNames,
  getEditor,
  registerEditor,
} from './editors/registry';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from './renderers/registry';
import {
  getRegisteredValidatorNames,
  getValidator,
  registerValidator,
} from './validators/registry';
import {
  getRegisteredCellTypeNames,
  getCellType,
  registerCellType,
} from './cellTypes/registry';
import {
  getPluginsNames,
  getPlugin,
  registerPlugin,
} from './plugins/registry';
import { BasePlugin } from './plugins/base';

// Define interfaces for static properties
interface HandsontableStatic {
  __GhostTable: typeof GhostTable;
  _getListenersCounter: typeof getListenersCounter;
  _getRegisteredMapsCounter: typeof getRegisteredMapsCounter;
  EventManager: typeof EventManager;
  helper: Record<string, any>;
  dom: Record<string, any>;
  cellTypes: Record<string, any> & {
    registerCellType: typeof registerCellType;
    getCellType: typeof getCellType;
  };
  editors: Record<string, any> & {
    registerEditor: typeof registerEditor;
    getEditor: typeof getEditor;
  };
  renderers: Record<string, any> & {
    registerRenderer: typeof registerRenderer;
    getRenderer: typeof getRenderer;
    cellDecorator: any;
  };
  validators: Record<string, any> & {
    registerValidator: typeof registerValidator;
    getValidator: typeof getValidator;
  };
  plugins: Record<string, any> & {
    registerPlugin: typeof registerPlugin;
    getPlugin: typeof getPlugin;
  };
}

// Extend Handsontable with static properties
declare module './base' {
  interface Handsontable extends HandsontableStatic {}
}

registerAllModules();
jQueryWrapper(Handsontable);

// TODO: Remove this exports after rewrite tests about this module
Handsontable.__GhostTable = GhostTable;

Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests
Handsontable._getRegisteredMapsCounter = getRegisteredMapsCounter; // For MemoryLeak tests
Handsontable.EventManager = EventManager;

// Export all helpers to the Handsontable object
const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  dateHelpers,
  featureHelpers,
  functionHelpers,
  mixedHelpers,
  numberHelpers,
  objectHelpers,
  stringHelpers,
  unicodeHelpers,
  parseTableHelpers,
];
const DOM = [
  domHelpers,
  domEventHelpers,
];

Handsontable.helper = {};
Handsontable.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.helper[key] = helper[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      Handsontable.dom[key] = helper[key];
    }
  });
});

// Export cell types.
Handsontable.cellTypes = Handsontable.cellTypes ?? {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), (cellTypeName) => {
  Handsontable.cellTypes[cellTypeName] = getCellType(cellTypeName);
});

Handsontable.cellTypes.registerCellType = registerCellType;
Handsontable.cellTypes.getCellType = getCellType;

// Export all registered editors from the Handsontable.
Handsontable.editors = Handsontable.editors ?? {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), (editorName) => {
  Handsontable.editors[`${stringHelpers.toUpperCaseFirst(editorName)}Editor`] = getEditor(editorName);
});

Handsontable.editors.registerEditor = registerEditor;
Handsontable.editors.getEditor = getEditor;

// Export all registered renderers from the Handsontable.
Handsontable.renderers = Handsontable.renderers ?? {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), (rendererName) => {
  const renderer = getRenderer(rendererName);

  if (rendererName === 'base') {
    Handsontable.renderers.cellDecorator = renderer;
  }
  Handsontable.renderers[`${stringHelpers.toUpperCaseFirst(rendererName)}Renderer`] = renderer;
});

Handsontable.renderers.registerRenderer = registerRenderer;
Handsontable.renderers.getRenderer = getRenderer;

// Export all registered validators from the Handsontable.
Handsontable.validators = Handsontable.validators ?? {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), (validatorName) => {
  Handsontable.validators[`${stringHelpers.toUpperCaseFirst(validatorName)}Validator`] = getValidator(validatorName);
});

Handsontable.validators.registerValidator = registerValidator;
Handsontable.validators.getValidator = getValidator;

// Export all registered plugins from the Handsontable.
// Make sure to initialize the plugin dictionary as an empty object. Otherwise, while
// transpiling the files into ES and CommonJS format, the injected CoreJS helper
// `import "core-js/modules/es.object.get-own-property-names";` won't be processed
// by the `./config/plugin/babel/add-import-extension` babel plugin. Thus, the distribution
// files will be broken. The reason is not known right now (probably it's caused by bug in
// the Babel or missing something in the plugin).
Handsontable.plugins = Handsontable.plugins ?? {};

arrayHelpers.arrayEach(getPluginsNames(), (pluginName) => {
  Handsontable.plugins[pluginName] = getPlugin(pluginName);
});

Handsontable.plugins[`${stringHelpers.toUpperCaseFirst(BasePlugin.PLUGIN_KEY)}Plugin`] = BasePlugin;

Handsontable.plugins.registerPlugin = registerPlugin;
Handsontable.plugins.getPlugin = getPlugin;

export {
  CellCoords,
  CellRange,
};
export default Handsontable;
