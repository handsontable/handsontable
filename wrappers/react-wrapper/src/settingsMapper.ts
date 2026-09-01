import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';
import { areEquivalentSettingsValue } from './helpers';

/**
 * Only these settings use deep comparison when diffing props for `updateSettings(false)`. Other
 * object settings (for example `mergeCells`, `cell`, `nestedHeaders`, hooks) stay on strict
 * reference equality so we avoid expensive deep walks and accidental false positives where functions
 * or class instances would not compare meaningfully by keys alone.
 *
 * `rowHeights`, `minRowHeights` (its documented alias) and `colWidths` are here because passing any
 * of them re-declares the sizes and discards the ones the user produced by dragging
 * (`ManualRowResize` / `ManualColumnResize`). A re-render must not do that, and a React app commonly
 * writes the value inline (`rowHeights={[50, 50]}`), which is a new array on every render and never
 * reference-equal. All three hold plain numbers, strings or arrays of them, so the deep walk is
 * cheap. The Vue wrapper already skips unchanged keys this way.
 */
const DEEP_COMPARABLE_SETTINGS: Array<keyof Handsontable.GridSettings> = [
  'dataSchema', 'columns', 'rowHeights', 'minRowHeights', 'colWidths'
];

/**
 * The size settings are compared against the grid's live settings rather than the previous props,
 * which is what the Angular and Vue wrappers already do. Comparing against props alone would stop
 * re-asserting the prop after anything changed the size through the instance ref.
 */
const COMPARED_AGAINST_LIVE_SETTINGS: Array<keyof Handsontable.GridSettings> = [
  'rowHeights', 'minRowHeights', 'colWidths'
];

export class SettingsMapper {
  /**
   * Parse component settings into Handsontable-compatible settings.
   *
   * @param {Object} properties Object containing properties from the HotTable object.
   * @param {Object} additionalSettings Additional settings.
   * @param {boolean} additionalSettings.isInit Flag determining whether the settings are being set during initialization.
   * @param {string[]} additionalSettings.initOnlySettingKeys Array of keys that can be set only during initialization.
   * @returns {Object} Handsontable-compatible settings object.
   */
  static getSettings(
    properties: HotTableProps,
    {
      prevProps = {},
      isInit = false,
      initOnlySettingKeys = [],
      currentSettings
    }: {
      prevProps?: HotTableProps;
      isInit?: boolean;
      initOnlySettingKeys?: Array<keyof Handsontable.GridSettings>;
      currentSettings?: Handsontable.GridSettings;
    } = {}): Handsontable.GridSettings {
    const shouldSkipProp = (key: keyof Handsontable.GridSettings) => {
      if (isInit) {
        return false;
      }

      // Checked before the value comparison below. The two lists do not overlap today, but a
      // changed deep-comparable key used to return early and skip this guard entirely, which would
      // have forwarded an init-only key to `updateSettings` as soon as one joined both lists.
      if (initOnlySettingKeys.includes(key)) {
        return true;
      }

      if (DEEP_COMPARABLE_SETTINGS.includes(key)) {
        const comparedValue = currentSettings && COMPARED_AGAINST_LIVE_SETTINGS.includes(key) ?
          currentSettings[key] :
          prevProps[key];

        return areEquivalentSettingsValue(comparedValue, properties[key]);
      }

      return false;
    };
    let newSettings: Handsontable.GridSettings = {};

    for (const key in properties) {
      if (
        key !== 'children' &&
        !shouldSkipProp(key as keyof Handsontable.GridSettings) &&
        properties.hasOwnProperty(key)
      ) {
        (newSettings as any)[key] = properties[key as keyof HotTableProps];
      }
    }

    return newSettings;
  }
}
