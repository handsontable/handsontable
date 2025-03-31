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
import { GridSettings, HotInstance } from './core.types';

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
function Handsontable(rootElement: HTMLElement, userSettings?: GridSettings): HotInstance {
  const instance = new Core(rootElement, userSettings || {} as GridSettings, rootInstanceSymbol as unknown as boolean) as unknown as HotInstance;

  instance.init();

  return instance;
}

Handsontable.Core = function(rootElement: HTMLElement, userSettings: GridSettings = {} as GridSettings) {
  return new Core(rootElement, userSettings, rootInstanceSymbol as unknown as boolean);
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
export default (Handsontable as any);
