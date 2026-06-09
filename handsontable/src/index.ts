import Handsontable from './base';
export { CellCoords, CellRange } from './base';
export type { HooksRegistry } from './base';
import { registerAllModules } from './registry';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations';

import jQueryWrapper from './helpers/wrappers/jquery';

import GhostTable from './utils/ghostTable';
import * as parseTableHelpers from './utils/parseTable';
import * as arrayHelpers from './helpers/array';
import * as browserHelpers from './helpers/browser';
import * as dataHelpers from './helpers/data';
import * as dateTimeHelpers from './helpers/dateTime';
import * as errorsHelpers from './helpers/errors';
import * as featureHelpers from './helpers/feature';
import * as functionHelpers from './helpers/function';
import * as mixedHelpers from './helpers/mixed';
import * as numberHelpers from './helpers/number';
import * as objectHelpers from './helpers/object';
import * as stringHelpers from './helpers/string';
import * as unicodeHelpers from './helpers/unicode';
import * as domHelpers from './helpers/dom/element';
import * as domEventHelpers from './helpers/dom/event';

import {
  getRegisteredEditorNames,
  getEditor,
  registerEditor,
} from './editors/registry';
import { editorFactory } from './editors/factory';
import {
  getRegisteredRendererNames,
  getRenderer,
  registerRenderer,
} from './renderers/registry';
import { rendererFactory } from './renderers/factory';
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
import {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
  reinitTheme,
} from './themes/registry';

registerAllModules();
jQueryWrapper(Handsontable as unknown as Record<string, unknown>);

/**
 * Typed alias that describes the dynamic properties attached to the Handsontable namespace object.
 * Using a concrete interface avoids `as unknown as X` casts on every assignment.
 */
interface HandsontableNamespace {
  __GhostTable: typeof GhostTable;
  _getListenersCounter: typeof getListenersCounter;
  _getRegisteredMapsCounter: typeof getRegisteredMapsCounter;
  EventManager: typeof EventManager;
  helper: Record<string, unknown>;
  dom: Record<string, unknown>;
  cellTypes: Record<string, unknown>;
  editors: Record<string, unknown>;
  renderers: Record<string, unknown>;
  validators: Record<string, unknown>;
  plugins: Record<string, unknown>;
  themes: Record<string, unknown>;
}

const HOT = Handsontable as unknown as HandsontableNamespace;

// TODO: Remove this exports after rewrite tests about this module
HOT.__GhostTable = GhostTable;

HOT._getListenersCounter = getListenersCounter; // For MemoryLeak tests
HOT._getRegisteredMapsCounter = getRegisteredMapsCounter; // For MemoryLeak tests
HOT.EventManager = EventManager;

// Export all helpers to the Handsontable object
const HELPERS = [
  arrayHelpers,
  browserHelpers,
  dataHelpers,
  dateTimeHelpers,
  errorsHelpers,
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

HOT.helper = {};
HOT.dom = {};

// Fill general helpers.
arrayHelpers.arrayEach(HELPERS, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      HOT.helper[key] = (helper as Record<string, unknown>)[key];
    }
  });
});

// Fill DOM helpers.
arrayHelpers.arrayEach(DOM, (helper) => {
  arrayHelpers.arrayEach(Object.getOwnPropertyNames(helper), (key) => {
    if (key.charAt(0) !== '_') {
      HOT.dom[key] = (helper as Record<string, unknown>)[key];
    }
  });
});

// Export cell types.
HOT.cellTypes = HOT.cellTypes ?? {};

arrayHelpers.arrayEach(getRegisteredCellTypeNames(), (cellTypeName) => {
  HOT.cellTypes[cellTypeName] = getCellType(cellTypeName) as unknown;
});

HOT.cellTypes.registerCellType = registerCellType as unknown;
HOT.cellTypes.getCellType = getCellType as unknown;

// Export all registered editors from the Handsontable.
HOT.editors = HOT.editors ?? {};

arrayHelpers.arrayEach(getRegisteredEditorNames(), (editorName) => {
  HOT.editors[`${stringHelpers.toUpperCaseFirst(editorName)}Editor`] = getEditor(editorName) as unknown;
});

HOT.editors.registerEditor = registerEditor as unknown;
HOT.editors.getEditor = getEditor as unknown;
HOT.editors.editorFactory = editorFactory as unknown;

// Export all registered renderers from the Handsontable.
HOT.renderers = HOT.renderers ?? {};

arrayHelpers.arrayEach(getRegisteredRendererNames(), (rendererName) => {
  const renderer = getRenderer(rendererName);

  if (rendererName === 'base') {
    HOT.renderers.cellDecorator = renderer as unknown;
  }
  HOT.renderers[`${stringHelpers.toUpperCaseFirst(rendererName)}Renderer`] = renderer as unknown;
});

HOT.renderers.registerRenderer = registerRenderer as unknown;
HOT.renderers.getRenderer = getRenderer as unknown;
HOT.renderers.rendererFactory = rendererFactory as unknown;

// Export all registered validators from the Handsontable.
HOT.validators = HOT.validators ?? {};

arrayHelpers.arrayEach(getRegisteredValidatorNames(), (validatorName) => {
  HOT.validators[`${stringHelpers.toUpperCaseFirst(validatorName)}Validator`] = getValidator(validatorName) as unknown;
});

HOT.validators.registerValidator = registerValidator as unknown;
HOT.validators.getValidator = getValidator as unknown;

// Export all registered plugins from the Handsontable.
// Make sure to initialize the plugin dictionary as an empty object. Otherwise, while
// transpiling the files into ES and CommonJS format, the injected CoreJS helper
// `import "core-js/modules/es.object.get-own-property-names";` won't be processed
// by the `./config/plugin/babel/add-import-extension` babel plugin. Thus, the distribution
// files will be broken. The reason is not known right now (probably it's caused by bug in
// the Babel or missing something in the plugin).
HOT.plugins = HOT.plugins ?? {};

arrayHelpers.arrayEach(getPluginsNames(), (pluginName) => {
  HOT.plugins[pluginName] = getPlugin(pluginName) as unknown;
});

HOT.plugins[`${stringHelpers.toUpperCaseFirst(BasePlugin.PLUGIN_KEY)}Plugin`] = BasePlugin as unknown;

HOT.plugins.registerPlugin = registerPlugin as unknown;
HOT.plugins.getPlugin = getPlugin as unknown;

// Export themes namespace.
HOT.themes = HOT.themes ?? {};

Handsontable.themes.hasTheme = hasTheme;
Handsontable.themes.getTheme = getTheme;
Handsontable.themes.getThemeNames = getThemeNames;
Handsontable.themes.getThemes = getThemes;
Handsontable.themes.registerTheme = registerTheme;
Handsontable.themes.reinitTheme = reinitTheme;

export { IndexMapper } from './translations';

// Named type exports for user-facing API — direct from canonical sources
export type { GridSettings, Events } from './core/settings';
export type {
  CellValue, CellChange, RowObject, ChangeSource, NumericFormatOptions,
  CellMeta, CellProperties, ColumnSettings, SourceRowData
} from './settings';
export type { RangeType, HotInstance } from './core/types';
export type { OverlayType } from './3rdparty/walkontable/src/types';
export type { BaseEditor as BaseEditorInstance } from './editors/baseEditor/baseEditor';
export type { SelectOptionsObject } from './settings';
export type { CellType } from './cellTypes/registry';
export type { EditorType } from './editors/registry';
export type { RendererType } from './renderers/registry';
export type { ValidatorType } from './validators/registry';
export type {
  BaseTheme,
  ThemeBuilder,
  ThemeColorScheme,
  ThemeColorsConfig,
  ThemeConfig,
  ThemeDensityConfig,
  ThemeDensitySizes,
  ThemeIconsConfig,
  ThemeLightDarkValue,
  ThemeParams,
  ThemeSizingConfig,
  ThemeTokenValue,
  ThemeTokensConfig,
} from './themes';

export default Handsontable;
