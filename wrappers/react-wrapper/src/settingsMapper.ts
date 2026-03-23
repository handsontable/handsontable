import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';

const appendDebugLog = (
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('fs').appendFileSync('/opt/cursor/logs/debug.log', JSON.stringify({
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now()
    }) + '\n');
  } catch (error) {
    // Debug-only logging must not affect runtime when fs is unavailable.
  }
};

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
    // #region agent log
    appendDebugLog('F', 'settingsMapper.ts:getSettings:entry', 'Mapping props to Handsontable settings', {
      isInit,
      propertiesKeysCount: Object.keys(properties).length,
      prevPropsKeysCount: Object.keys(prevProps).length,
      hasDataSchemaProp: Object.prototype.hasOwnProperty.call(properties, 'dataSchema'),
      hasColumnsProp: Object.prototype.hasOwnProperty.call(properties, 'columns'),
      hasAfterChangeProp: Object.prototype.hasOwnProperty.call(properties, 'afterChange'),
      initOnlySettingKeysCount: initOnlySettingKeys.length
    });
    // #endregion
    const shouldSkipProp = (key: keyof Handsontable.GridSettings) => {
      // Omit settings that can be set only during initialization and are intentionally modified.
      if (!isInit && initOnlySettingKeys.includes(key)) {
        return prevProps[key] === properties[key];
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

    // #region agent log
    appendDebugLog('G', 'settingsMapper.ts:getSettings:exit', 'Mapped settings object', {
      isInit,
      settingsKeysCount: Object.keys(newSettings).length,
      hasDataSchemaSetting: Object.prototype.hasOwnProperty.call(newSettings, 'dataSchema'),
      hasColumnsSetting: Object.prototype.hasOwnProperty.call(newSettings, 'columns'),
      hasAfterChangeSetting: Object.prototype.hasOwnProperty.call(newSettings, 'afterChange'),
      dataSchemaRefChanged: prevProps.dataSchema !== properties.dataSchema,
      columnsRefChanged: prevProps.columns !== properties.columns,
      afterChangeRefChanged: prevProps.afterChange !== properties.afterChange
    });
    // #endregion
    return newSettings;
  }
}
