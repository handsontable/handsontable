export const localesDefinitions = {};

/**
 * Get locale by specific language code.
 *
 * @param {String} languageCode Language code
 * @returns {Object}
 */
export function getDefinition(languageCode) {
  if (!localesDefinitions[languageCode]) {
    throw Error(`Locale with "${languageCode}" language code does not exist.`);
  }

  return localesDefinitions[languageCode];
}

/**
 * Locale definition registerer.
 *
 * @param {String} languageCode Language code.
 * @param {Object} definition Locale definition.
 */
export function registerDefinition(languageCode, definition) {
  localesDefinitions[languageCode] = definition;
}
