import { PLUGIN_KEY } from '../formulas';

export const DEFAULT_SETTINGS = {
  licenseKey: 'internal-use-in-handsontable',

  binarySearchThreshold: 20,
  matrixDetection: false,
  matrixDetectionThreshold: 100,
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
 * Gets a set of engine settings to be applied on top of the provided settings.
 *
 * @param {object} hotSettings Handsontable settings object.
 * @returns {object} Object containing the overriding options.
 */
export function getEngineSettingsOverrides(hotSettings) {
  return {
    maxColumns: hotSettings.maxColumns,
    maxRows: hotSettings.maxRows,
    language: hotSettings[PLUGIN_KEY].language?.langCode
  };
}

/**
 * Takes the default, user and overriding settings and merges them into a single object to be passed to the engine.
 *
 * @param {object} hotSettings The Handsontable settings.
 * @returns {object} The final engine settings.
 */
export function mergeEngineSettings(hotSettings) {
  const pluginSettings = hotSettings[PLUGIN_KEY];
  const configSettings = pluginSettings.engine.hyperformula ? pluginSettings.engine : {};
  const overrides = getEngineSettingsOverrides(hotSettings);

  const cleanConfigSettings = Object.keys(configSettings)
    .reduce((obj, key) => {
      if (key !== 'hyperformula') {
        obj[key] = configSettings[key];
      }

      return obj;
    }, {});

  return {
    ...DEFAULT_SETTINGS,
    ...(cleanConfigSettings || {}),
    ...(overrides || {})
  };
}
