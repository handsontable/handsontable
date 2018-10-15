'use strict';

exports.__esModule = true;
exports.columnFactory = columnFactory;

var _object = require('./object');

/* eslint-disable import/prefer-default-export */
/**
 * Factory for columns constructors.
 *
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
function columnFactory(GridSettings, conflictList) {
  function ColumnSettings() {}

  (0, _object.inherit)(ColumnSettings, GridSettings);

  // Clear conflict settings
  for (var i = 0, len = conflictList.length; i < len; i++) {
    ColumnSettings.prototype[conflictList[i]] = void 0;
  }

  return ColumnSettings;
}