import Core from './core';
import { rootInstanceSymbol } from './utils/rootInstance';
import { metaSchemaFactory } from './dataMap';
import { Hooks } from './core/hooks';

// FIXME: Bug in eslint-plugin-import: https://github.com/benmosher/eslint-plugin-import/issues/1883
/* eslint-disable import/named */
import {
  dictionaryKeys,
  getTranslatedPhrase,
  registerLanguageDictionary,
  getLanguagesDictionaries,
  getLanguageDictionary
} from './i18n/registry';
/* eslint-enable import/named */
import { registerCellType } from './cellTypes/registry';
import { registerRenderer } from './renderers/registry';
import { baseRenderer } from './renderers/baseRenderer';
import { TextCellType } from './cellTypes/textType';
import { BaseEditor } from './editors/baseEditor';
import { CellCoords, CellRange } from './3rdparty/walkontable/src';
import {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
} from './themes/registry';
import type { HotInstance } from './common';

/**
 * Core is a constructor function (not a class). This interface provides a
 * proper `new` signature so TypeScript allows `new Core(...)`.
 */
interface CoreConstructor {
  new(rootElement: HTMLElement, userSettings: Record<string, unknown>, rootInstanceSymbol?: symbol | boolean): HotInstance;
}

const CoreClass = Core as unknown as CoreConstructor;

// register default mandatory cell type for the Base package
registerCellType(TextCellType);
registerRenderer(baseRenderer);

// export the `BaseEditor` class to the Handsontable global namespace
Handsontable.editors = {
  BaseEditor
};

/**
 * @param {HTMLElement} rootElement The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @returns {Core}
 */
function Handsontable(rootElement: HTMLElement, userSettings: Record<string, unknown>) {
  const instance = new CoreClass(rootElement, userSettings || {}, rootInstanceSymbol);

  instance.init();

  return instance;
}

Handsontable.Core = function(rootElement: HTMLElement, userSettings: Record<string, unknown> = {}) {
  return new CoreClass(rootElement, userSettings, rootInstanceSymbol);
};

Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.hooks = Hooks.getSingleton();
Handsontable.CellCoords = CellCoords;
Handsontable.CellRange = CellRange;
Handsontable.packageName = 'handsontable';
Handsontable.buildDate = process.env.HOT_BUILD_DATE;
Handsontable.version = process.env.HOT_VERSION;

Handsontable.languages = {
  dictionaryKeys,
  getLanguageDictionary,
  getLanguagesDictionaries,
  registerLanguageDictionary,
  getTranslatedPhrase,
};

Handsontable.themes = {
  hasTheme,
  getTheme,
  getThemeNames,
  getThemes,
  registerTheme,
};

/**
 * Interface describing the Handsontable factory function.
 * Allows both `Handsontable(elem, opts)` and `new Handsontable(elem, opts)`.
 */
interface HandsontableFactory {
  (rootElement: HTMLElement, userSettings?: Record<string, unknown>): HotInstance;
  new(rootElement: HTMLElement, userSettings?: Record<string, unknown>): HotInstance;
  Core: (rootElement: HTMLElement, userSettings?: Record<string, unknown>) => HotInstance;
  DefaultSettings: Record<string, unknown>;
  hooks: unknown;
  CellCoords: typeof CellCoords;
  CellRange: typeof CellRange;
  packageName: string;
  buildDate: string | undefined;
  version: string | undefined;
  languages: Record<string, unknown>;
  editors: {
    BaseEditor: typeof BaseEditor;
    [key: string]: unknown;
  };
  themes: Record<string, unknown>;
  [key: string]: unknown;
}

export {
  CellCoords,
  CellRange,
};
export default Handsontable as unknown as HandsontableFactory;
