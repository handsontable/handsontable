import './styles/handsontable.scss';

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
import { TextCellType } from './cellTypes/textType';
import { BaseEditor } from './editors/baseEditor';
import CellRange from './3rdparty/walkontable/src/cell/range';
import { CellCoords } from './3rdparty/walkontable/src/cell/coords';

type HandsontableInstance = {
  editors: {
    BaseEditor: typeof BaseEditor;
  };
  DefaultSettings: ReturnType<typeof metaSchemaFactory>;
  hooks: ReturnType<typeof Hooks.getSingleton>;
  CellCoords: typeof CellCoords;
  CellRange: typeof CellRange;
  packageName: string;
  buildDate: string | undefined;
  version: string | undefined;
  languages: {
    dictionaryKeys: typeof dictionaryKeys;
    getLanguageDictionary: typeof getLanguageDictionary;
    getLanguagesDictionaries: typeof getLanguagesDictionaries;
    registerLanguageDictionary: typeof registerLanguageDictionary;
    getTranslatedPhrase: typeof getTranslatedPhrase;
  };
  Core: (rootElement: HTMLElement, userSettings?: Record<string, any>, rootInstanceSymbol?: boolean) => ReturnType<typeof Core>;
};

// register default mandatory cell type for the Base package
registerCellType(TextCellType);

// export the `BaseEditor` class to the Handsontable global namespace
Handsontable.editors = {
  BaseEditor
};

/**
 * @param {HTMLElement} rootElement The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @returns {Core}
 */
function Handsontable(rootElement: HTMLElement, userSettings?: Record<string, any>): ReturnType<typeof Core> {
  const instance = new Core(rootElement, userSettings || {}, rootInstanceSymbol);

  instance.init();

  return instance;
}

Handsontable.Core = function(rootElement: HTMLElement, userSettings: Record<string, any> = {}) {
  return new Core(rootElement, userSettings, rootInstanceSymbol);
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

export {
  CellCoords,
  CellRange,
};
export default Handsontable;
