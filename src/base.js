import './css/bootstrap.css';
import './3rdparty/walkontable/css/walkontable.css';
import './css/handsontable.css';
import './css/mobile.handsontable.css';

import Core from './core';
import jQueryWrapper from './helpers/wrappers/jquery';
import EventManager, { getListenersCounter } from './eventManager';
import { getRegisteredMapsCounter } from './translations/mapCollection';
import Hooks from './pluginHooks';
import { metaSchemaFactory } from './dataMap/index';
import { rootInstanceSymbol } from './utils/rootInstance';
import { getTranslatedPhrase } from './i18n';
import * as constants from './i18n/constants';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
  getLanguageDictionary
} from './i18n/dictionariesManager';

/**
 * @param {HTMLElement} rootElement The element to which the Handsontable instance is injected.
 * @param {object} userSettings The user defined options.
 * @returns {Core}
 */
function Handsontable(rootElement, userSettings) {
  const instance = new Core(rootElement, userSettings || {}, rootInstanceSymbol);

  instance.init();

  return instance;
}

jQueryWrapper(Handsontable);

Handsontable.Core = function(rootElement, userSettings = {}) {
  return new Core(rootElement, userSettings, rootInstanceSymbol);
};
Handsontable.DefaultSettings = metaSchemaFactory();
Handsontable.EventManager = EventManager;
Handsontable._getListenersCounter = getListenersCounter; // For MemoryLeak tests
Handsontable._getRegisteredMapsCounter = getRegisteredMapsCounter; // For MemoryLeak tests

Handsontable.packageName = 'handsontable';
Handsontable.buildDate = process.env.HOT_BUILD_DATE;
Handsontable.version = process.env.HOT_VERSION;

// Export Hooks singleton
Handsontable.hooks = Hooks.getSingleton();

Handsontable.languages = {};
Handsontable.languages.dictionaryKeys = constants;
Handsontable.languages.getLanguageDictionary = getLanguageDictionary;
Handsontable.languages.getLanguagesDictionaries = getLanguagesDictionaries;
Handsontable.languages.registerLanguageDictionary = registerLanguageDictionary;

// Alias to `getTranslatedPhrase` function, for more information check it API.
Handsontable.languages.getTranslatedPhrase = (...args) => getTranslatedPhrase(...args);

export default Handsontable;
