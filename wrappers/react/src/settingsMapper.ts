import Handsontable from 'handsontable';
import { HotTableProps } from './types';

export class SettingsMapper {
  /**
   * Parse component settings into Handosntable-compatible settings.
   *
   * @param {Object} properties Object containing properties from the HotTable object.
   * @returns {Object} Handsontable-compatible settings object.
   */
  static getSettings(properties: HotTableProps): Handsontable.GridSettings {
    let newSettings: Handsontable.GridSettings = {};

    if (properties.settings) {
      let settings = properties.settings;
      for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
          newSettings[key] = settings[key];
        }
      }
    }

    for (const key in properties) {
      if (key !== 'settings' && key !== 'children' && properties.hasOwnProperty(key)) {
        newSettings[key] = properties[key];
      }
    }

    return newSettings;
  }
}
