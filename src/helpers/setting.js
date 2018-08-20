import { inherit } from './object';
/* eslint-disable import/prefer-default-export */
/**
 * Factory for columns constructors.
 *
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
export function columnFactory(GridSettings, conflictList) {
  function ColumnSettings() {}

  inherit(ColumnSettings, GridSettings);

  // Clear conflict settings
  for (let i = 0, len = conflictList.length; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }

  return ColumnSettings;
}
