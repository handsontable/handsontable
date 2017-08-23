import {arrayEach} from './../helpers/array';
import {get as getLangDefinition, DEFAULT_LANGUAGE_CODE} from './langDefinitionsController';
import {get as getFormatters} from './formattersController';
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
  }

  getPhrase(constant, zippedVariableAndValue) {
    let phrases = this.langDefinition[constant];

    arrayEach(getFormatters(), (formatter) => {
      phrases = formatter(phrases, zippedVariableAndValue, this.languageCode);
    });

    return phrases;
  }
}

const singleton = new LanguageController();

export default singleton;
