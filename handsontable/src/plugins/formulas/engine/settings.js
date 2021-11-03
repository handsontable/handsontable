import { PLUGIN_KEY } from '../formulas';

export const DEFAULT_LICENSE_KEY = 'internal-use-in-handsontable';

const DEFAULT_SETTINGS = {
  licenseKey: DEFAULT_LICENSE_KEY,

  useArrayArithmetic: true,
  useColumnIndex: false,
  useStats: false,
  evaluateNullToZero: true,
  precisionEpsilon: 1e-13,
  precisionRounding: 14,
  smartRounding: true,
  leapYear1900: true,
  nullDate: {
    year: 1899,
    month: 12,
    day: 31
  },
  nullYear: 30,
  dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
  matchWholeCell: true,
  useRegularExpressions: false,
  useWildcards: true,
  functionArgSeparator: ',',
  thousandSeparator: '',
  decimalSeparator: '.',
  language: 'enGB',
};

/**
 * Gets a set of engine settings to be applied on top of the provided settings, based on user's Handsontable settings.
 *
 * @param {object} hotSettings Handsontable settings object.
 * @returns {object} Object containing the overriding options.
 */
export function getEngineSettingsOverrides(hotSettings) {
  return {
    maxColumns: hotSettings.maxColumns,
    maxRows: hotSettings.maxRows,
    language: hotSettings[PLUGIN_KEY]?.language?.langCode
  };
}

/**
 * Drop `hyperformula` key from object if it exists.
 *
 * @param {object} pluginSettings Formulas plugin settings.
 * @returns {object}
 */
function cleanEngineSettings(pluginSettings) {
  return Object.keys(pluginSettings)
    .reduce((obj, key) => {
      if (key !== 'hyperformula') {
        obj[key] = pluginSettings[key];
      }

      return obj;
    }, {});
}

/**
 * Takes the default, user and overriding settings and merges them into a single object to be passed to the engine.
 *
 * The final object gets its parameters in the following order,
 * with properties attached to objects listed in the lower levels of the list overriding the
 * ones above them:
 *
 * 1. Default settings
 * 2. User settings
 * 3. Overrides.
 *
 * Meant to be used during *initialization* of the engine.
 *
 * @param {object} hotSettings The Handsontable settings.
 * @returns {object} The final engine settings.
 */
export function getEngineSettingsWithDefaultsAndOverrides(hotSettings) {
  const pluginSettings = hotSettings[PLUGIN_KEY];

  const userSettings = cleanEngineSettings(
    pluginSettings?.engine?.hyperformula ? pluginSettings.engine : {}
  );

  const overrides = getEngineSettingsOverrides(hotSettings);

  return {
    ...DEFAULT_SETTINGS,
    ...userSettings,
    ...overrides
  };
}

/**
 * Get engine settings from a Handsontable settings object with overrides.
 *
 * @param {object} hotSettings Handsontable settings object.
 * @returns {object}
 */
export function getEngineSettingsWithOverrides(hotSettings) {
  const pluginSettings = hotSettings[PLUGIN_KEY];

  const userSettings = cleanEngineSettings(pluginSettings?.engine?.hyperformula ? pluginSettings.engine : {});
  const overrides = getEngineSettingsOverrides(hotSettings);

  return {
    ...userSettings,
    ...overrides
  };
}
