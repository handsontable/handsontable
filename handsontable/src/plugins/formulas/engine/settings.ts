import { PLUGIN_KEY } from '../formulas';

export const DEFAULT_LICENSE_KEY = 'internal-use-in-handsontable';

export const DEFAULT_SETTINGS = {
  licenseKey: DEFAULT_LICENSE_KEY,

  useArrayArithmetic: true,
  useColumnIndex: false,
  useStats: false,
  evaluateNullToZero: true,
  precisionEpsilon: 1e-13,
  precisionRounding: 14,
  smartRounding: true,
  leapYear1900: false,
  nullDate: {
    year: 1899,
    month: 12,
    day: 30
  },
  nullYear: 30,
  dateFormats: ['YYYY-MM-DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss', 'hh:mm:ss.sss'],
  matchWholeCell: true,
  useRegularExpressions: false,
  useWildcards: true,
  functionArgSeparator: ',',
  thousandSeparator: '',
  decimalSeparator: '.',
  language: 'enGB',
};

/**
 * Size limits that Handsontable applies to one grid, but HyperFormula applies to a whole engine.
 * They may be set when the engine is created, and never synced afterwards - see GH #10672.
 */
const ENGINE_SIZE_SETTINGS = ['maxRows', 'maxColumns'];

/**
 * Drops the engine-wide size limits from a set of settings.
 *
 * @param {object} engineSettings Engine settings.
 * @returns {object}
 */
function dropEngineSizeSettings(engineSettings: Record<string, unknown>) {
  return Object.keys(engineSettings)
    .reduce<Record<string, unknown>>((obj, key) => {
      if (!ENGINE_SIZE_SETTINGS.includes(key)) {
        obj[key] = engineSettings[key];
      }

      return obj;
    }, {});
}

/**
 * Gets a set of engine settings to be applied on top of the provided settings, based on user's Handsontable settings.
 *
 * @param {object} hotSettings Handsontable settings object.
 * @returns {object} Object containing the overriding options.
 */
export function getEngineSettingsOverrides(hotSettings: Record<string, unknown>) {
  const pluginSetting = hotSettings[PLUGIN_KEY] as Record<string, unknown> | undefined;

  return {
    language: (pluginSetting?.language as Record<string, unknown> | undefined)?.langCode
  };
}

/**
 * Drop `hyperformula` key from object if it exists.
 *
 * @param {object} pluginSettings Formulas plugin settings.
 * @returns {object}
 */
function cleanEngineSettings(pluginSettings: Record<string, unknown>) {
  return Object.keys(pluginSettings)
    .reduce<Record<string, unknown>>((obj, key) => {
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
export function getEngineSettingsWithDefaultsAndOverrides(hotSettings: Record<string, unknown>) {
  const pluginSettings = hotSettings[PLUGIN_KEY] as Record<string, unknown> | undefined;

  const engine = pluginSettings?.engine as Record<string, unknown> | undefined;
  const userSettings = cleanEngineSettings(
    engine?.hyperformula ? engine : {}
  );

  const overrides = getEngineSettingsOverrides(hotSettings);

  return {
    ...DEFAULT_SETTINGS,
    ...userSettings,
    ...overrides,
    // The engine created here belongs to this grid alone, so bounding it by the grid's own limits is
    // safe. `maxColumns` is not a Handsontable option - the option is `maxCols` - so it always resolves
    // to `undefined`; kept as-is to leave the created engine's configuration exactly as it was.
    maxColumns: hotSettings.maxColumns,
    maxRows: hotSettings.maxRows,
  };
}

/**
 * Get engine settings from a Handsontable settings object with overrides.
 *
 * Meant to be used on *every* `updateSettings`, so it must never carry the engine-wide size limits:
 * the engine it updates may be shared with other grids, and shrinking it below what their sheets
 * already hold makes HyperFormula throw `SheetSizeLimitExceededError`. See GH #10672.
 *
 * @param {object} hotSettings Handsontable settings object.
 * @returns {object}
 */
export function getEngineSettingsWithOverrides(hotSettings: Record<string, unknown>) {
  const pluginSettings = hotSettings[PLUGIN_KEY] as Record<string, unknown> | undefined;

  const engine = pluginSettings?.engine as Record<string, unknown> | undefined;
  const userSettings = cleanEngineSettings(engine?.hyperformula ? engine : {});
  const overrides = getEngineSettingsOverrides(hotSettings);

  return dropEngineSizeSettings({
    ...userSettings,
    ...overrides
  });
}

/**
 * Check if the new settings are defined and are different from the ones currently used by the engine.
 *
 * @param {object} currentEngineSettings Currently used engine settings.
 * @param {object} newEngineSettings New engine settings.
 * @returns {boolean}
 */
export function haveEngineSettingsChanged(
  currentEngineSettings: Record<string, unknown>, newEngineSettings: Record<string, unknown>
) {
  return Object.keys(newEngineSettings).some((settingOption) => {
    return newEngineSettings[settingOption] !== undefined &&
      newEngineSettings[settingOption] !== currentEngineSettings[settingOption];
  });
}
