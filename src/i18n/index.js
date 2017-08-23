import {arrayEach} from './../helpers/array';
import {get as getLangDefinition, DEFAULT_LANGUAGE_CODE} from './langDefinitionsController';
import {getGlobal as getGlobalFormatters, getSpecific as getSpecificFormatter} from './formattersController';
import './languages/en';
import './languages/pl';
import './formatters/substituteVariables';
import './formatters/pluralize';
import './formatters/default';

class LanguageController {
  static getSingleton() {
    return singleton;
  }

  constructor() {
    this.languageCode = null;

    this.setLocale(DEFAULT_LANGUAGE_CODE);
  }

  /**
   * Set actual locale.
   * @param {String} languageCode Language code.
   */
  setLocale(languageCode) {
    this.languageCode = languageCode;
    this.langDefinition = getLangDefinition(languageCode);
    this.specificFormatters = getSpecificFormatter(languageCode);
  }

  getPhrase(constant, settings) {
    let phrases = this.langDefinition[constant];

    arrayEach(this.specificFormatters.concat(getGlobalFormatters()), (formatter) => {
      phrases = formatter(phrases, settings, this.languageCode);
    });

    return phrases;
  }
}

const singleton = new LanguageController();

export default singleton;
