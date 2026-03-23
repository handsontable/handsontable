import Handsontable from 'handsontable/base';
import { HotTableProps } from './types';

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function areEquivalentSettingsValue(previousValue: unknown, currentValue: unknown): boolean {
  if (previousValue === currentValue) {
    return true;
  }

  if (!isObjectLike(previousValue) || !isObjectLike(currentValue)) {
    return false;
  }

  const previousIsArray = Array.isArray(previousValue);
  const currentIsArray = Array.isArray(currentValue);

  if (previousIsArray !== currentIsArray) {
    return false;
  }

  if (previousIsArray) {
    const previousEntries = previousValue as unknown[];
    const currentEntries = currentValue as unknown[];

    if (previousEntries.length !== currentEntries.length) {
      return false;
    }

    for (let index = 0; index < previousEntries.length; index++) {
      if (!areEquivalentSettingsValue(previousEntries[index], currentEntries[index])) {
        return false;
      }
    }

    return true;
  }

  const previousKeys = Object.keys(previousValue);
  const currentKeys = Object.keys(currentValue);

  if (previousKeys.length !== currentKeys.length) {
    return false;
  }

  for (const key of previousKeys) {
    if (!Object.prototype.hasOwnProperty.call(currentValue, key)) {
      return false;
    }

    if (!areEquivalentSettingsValue(previousValue[key], currentValue[key])) {
      return false;
    }
  }

  return true;
}

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
      if (!isInit && (key === 'dataSchema' || key === 'columns')) {
        return areEquivalentSettingsValue(prevProps[key], properties[key]);
      }

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

    return newSettings;
  }
}
