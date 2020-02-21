import { settingsNormalizer } from './settingsNormalizer';

export default class SourceSettings {
  constructor(nestedHeadersSettings = []) {
    this.setData(nestedHeadersSettings);
  }

  setData(nestedHeadersSettings = []) {
    this.data = settingsNormalizer(nestedHeadersSettings);
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
}
