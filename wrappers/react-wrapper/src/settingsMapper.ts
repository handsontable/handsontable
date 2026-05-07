import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';
import { areEquivalentSettingsValue } from './helpers';

/**
 * Only `dataSchema` and `columns` use deep comparison when diffing props for `updateSettings(false)`.
 * Other object settings (for example `mergeCells`, `cell`, `nestedHeaders`, hooks) stay on strict
 * reference equality so we avoid expensive deep walks and accidental false positives where functions
 * or class instances would not compare meaningfully by keys alone.
 */
const DEEP_COMPARABLE_SETTINGS: Array<keyof Handsontable.GridSettings> = ['dataSchema', 'columns'];

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
      initOnlySettingKeys = []
    }: {
      prevProps?: HotTableProps;
      isInit?: boolean;
      initOnlySettingKeys?: Array<keyof Handsontable.GridSettings>
    } = {}): Handsontable.GridSettings {
    const shouldSkipProp = (key: keyof Handsontable.GridSettings) => {
      if (!isInit && DEEP_COMPARABLE_SETTINGS.includes(key)) {
        return areEquivalentSettingsValue(prevProps[key], properties[key]);
      }

      if (!isInit && initOnlySettingKeys.includes(key)) {
        return true;
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
