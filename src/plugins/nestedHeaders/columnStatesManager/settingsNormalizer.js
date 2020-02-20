import { arrayEach, arrayMap } from '../../../helpers/array';
import { isObject } from '../../../helpers/object';
import { stringify } from '../../../helpers/mixed';
import { HEADER_DEFAULT_SETTINGS } from './constants';

export default class SettingsNormalizer {
  constructor(nestedHeadersSettings = []) {
    this.data = this.normalize(nestedHeadersSettings);
    this.dataLength = this.data.length;
  }

  getColumnSettings(headerLevel, columnIndex) {
    if (headerLevel >= this.dataLength) {
      return null;
    }

    const columnsSettings = this.data[headerLevel];

    if (columnIndex >= columnsSettings.length) {
      return null;
    }

    return columnsSettings[columnIndex];
  }

  getColumnsSettings(headerLevel, columnIndex, columnsLength = 1) {
    const columnsSettingsChunks = [];

    if (headerLevel >= this.dataLength) {
      return columnsSettingsChunks;
    }

    const columnsSettings = this.data[headerLevel];
    let currentLength = 0;

    for (let i = columnIndex; i < columnsSettings.length; i++) {
      const columnSettings = columnsSettings[i];

      if (columnSettings.hidden === true) {
        throw new Error('The first column settings cannot overlap the other header layers');
      }

      currentLength += columnSettings.colspan;
      columnsSettingsChunks.push(columnSettings);

      if (columnSettings.colspan > 1) {
        i += columnSettings.colspan - 1;
      }

      // We met the current sum of the child colspans
      if (currentLength === columnsLength) {
        break;
      }
      // We exceeds the current sum of the child colspans, the last columns colspan overlaps the "columnsLength" length.
      if (currentLength > columnsLength) {
        throw new Error('The last column settings cannot overlap the other header layers');
      }
    }

    return columnsSettingsChunks;
  }

  getLayersCount() {
    return this.data.length;
  }

  getColumnsCount() {
    return this.data.length > 0 ? this.data[0].length : 0;
  }

  normalize(nestedHeadersSettings) {
    const nestedHeadersState = [];

    // Normalize array items (header settings) into one shape - literal object with default props
    arrayEach(nestedHeadersSettings, (columnsSettings) => {
      const columns = [];

      nestedHeadersState.push(columns);

      arrayEach(columnsSettings, (columnSettings) => {
        const headerSettings = {
          ...HEADER_DEFAULT_SETTINGS,
        };

        if (isObject(columnSettings)) {
          const {
            label, colspan,
          } = columnSettings;

          headerSettings.label = stringify(label);

          if (typeof colspan === 'number' && colspan > 1) {
            headerSettings.colspan = colspan;
          }
        } else {
          headerSettings.label = stringify(columnSettings);
        }

        columns.push(headerSettings);

        if (headerSettings.colspan > 1) {
          for (let i = 0; i < headerSettings.colspan - 1; i++) {
            columns.push({
              ...HEADER_DEFAULT_SETTINGS,
              hidden: true,
            });
          }
        }
      });
    });

    const columnsLength = Math.max(...arrayMap(nestedHeadersState, (columnsSettings => columnsSettings.length)));

    // Normalize the length of each header layer to the same columns length
    arrayEach(nestedHeadersState, (columnsSettings) => {
      if (columnsSettings.length < columnsLength) {
        const defaultSettings = arrayMap(new Array(columnsLength - columnsSettings.length), () => ({ ...HEADER_DEFAULT_SETTINGS }));

        columnsSettings.splice(columnsSettings.length, 0, ...defaultSettings);
      }
    });

    return nestedHeadersState;
  }
}
