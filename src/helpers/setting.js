import {inherit} from './object';

/**
 * These ambiguous fields have another meaning based on where they are currently placed. For example 'data' key in general settings
 * provides posibility to load source data where in columns or rows (`columns: [{data: 'my_key'}]`) it defines which column/row should be
 * taken from data source to visualize it in the grid.
 *
 * @type {Array}
 */
const AMBIGUOUS_FIELDS = ['data', 'width', 'height'];

/**
 * Factory for columns constructors.
 *
 * @param {Object} GridSettings
 * @param {Array} conflictList
 * @return {Object} ColumnSettings
 */
export function columnSettingsFactory(GridSettings) {
  function ColumnSettings() {};

  inherit(ColumnSettings, GridSettings);

  // Set as 'undefined' all fields which are ambiguous. These fields have another meaning based on where they are currently placed.
  for (let i = 0, len = AMBIGUOUS_FIELDS.length; i < len; i++) {
    ColumnSettings.prototype[AMBIGUOUS_FIELDS[i]] = void 0;
  }

  return ColumnSettings;
}

window.columnSettingsFactory = columnSettingsFactory;
