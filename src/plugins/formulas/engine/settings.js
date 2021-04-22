import { PLUGIN_KEY } from '../formulas';

// TODO: refine the list of default HF settings
const DEFAULT_SETTINGS = {
  licenseKey: 'internal-use-in-handsontable',

  // default engine configuration
  binarySearchThreshold: 20,
  matrixDetection: true,
  matrixDetectionThreshold: 100,
  useColumnIndex: false,
  useStats: false,

  // desired UX
  evaluateNullToZero: true, // excel compatibility
  precisionEpsilon: 1e-13, // excel compatilibity
  precisionRounding: 14, // excel compatilibity
  smartRounding: true, // excel compatilibity
  leapYear1900: true, // excel and lotus123 leap year bug compatiblity
  nullDate: {
    year: 1899,
    month: 12,
    day: 31
  }, // same as above, not sure if correct
  nullYear: 30,

  // for simple formats (ie. US format)
  // for more advanced formats pls use: parseDateTime, stringifyDateTime
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'],

  // criterions, only wildcards and match whole cell
  matchWholeCell: true, // excel compatilibity
  useRegularExpressions: false, // excel compatilibity
  useWildcards: true, // excel compatilibity

  // those work together
  functionArgSeparator: ',', // excel compatibility (works with "language", "thousandSeparator", and "decimalSeparator")
  thousandSeparator: '', // excel compatiblity (works with "language", "decimalSeparator" and "functionArgSeparator")
  decimalSeparator: '.', // excel compatiblity (works with "language", "thousandSeparator" and "functionArgSeparator")
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
 * @param {object} configSettings Settings object provided by the Handsontable config.
 * @param {object} additionalSettings Settings object applied on top of the others.
 * @returns {object} The final engine settings.
 */
export function mergeEngineSettings(configSettings, additionalSettings) {
  if (configSettings) {
    configSettings = Object.keys(configSettings)
      .filter(key => key !== 'hyperformula')
      .reduce((obj, key) => {
        obj[key] = configSettings[key];

        return obj;
      }, {});
  }

  return {
    ...DEFAULT_SETTINGS,
    ...(configSettings || {}),
    ...additionalSettings || {}
  };
}
