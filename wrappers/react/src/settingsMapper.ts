import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';

export class SettingsMapper {
  /**
   * Parse component settings into Handsontable-compatible settings.
   *
   * @param {Object} properties Object containing properties from the HotTable object.
   * @returns {Object} Handsontable-compatible settings object.
   */
  static getSettings(properties: HotTableProps): Handsontable.GridSettings {
    let newSettings: Handsontable.GridSettings = {};

    for (const key in properties) {
      if (key !== 'children' && properties.hasOwnProperty(key)) {
        newSettings[key] = properties[key];
      }
    }

    return newSettings;
  }
}
