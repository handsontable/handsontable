import {arrayEach} from './../helpers/array';
import {get as getLangDefinition} from './langDefinitionsController';

const globalFormatters = [];
const formatters = new Map();

export function registerGlobal(formatter) {
  globalFormatters.push(formatter);
}

export function registerSpecific(languageCodes, formatter) {
  arrayEach(languageCodes, (languageCode) => {
    try {
      getLangDefinition(languageCode);

      if (!formatters.has(languageCode)) {
        formatters.set(languageCode, []);
      }

      formatters.get(languageCode).push(formatter);

    } catch (error) {
      throw Error(`Can't register formatter for "${languageCode}" language code, because there wasn't registered language with such code.`);
    }
  });
}

export function getGlobal() {
  return globalFormatters;
}

export function getSpecific(languageCode) {
  if (!formatters.has(languageCode)) {
    return [];
  }

  return formatters.get(languageCode);
}
