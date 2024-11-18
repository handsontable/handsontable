import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';

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
      // Omit settings that can be set only during initialization and are intentionally modified.
      if (!isInit && initOnlySettingKeys.includes(key)) {
        return prevProps[key] === properties[key];
      }
      return false;
    };
    let newSettings: Handsontable.GridSettings = {};

    if (properties.settings) {
      let settings = properties.settings;
      for (const key in settings) {
        if (
          settings.hasOwnProperty(key)
          &&
          !shouldSkipProp(key as keyof Handsontable.GridSettings)
        ) {
          newSettings[key] = settings[key];
        }
      }
    }

    for (const key in properties) {
      if (
        key !== 'settings' &&
        key !== 'children' &&
        !shouldSkipProp(key as keyof Handsontable.GridSettings) &&
        properties.hasOwnProperty(key)
      ) {
        newSettings[key] = properties[key];
      }
    }

    return newSettings;
  }
}
