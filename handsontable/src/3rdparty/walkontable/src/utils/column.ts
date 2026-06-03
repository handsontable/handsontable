import type { DataAccessObject } from '../types';
import type Settings from '../settings';
/**
 * Column utils class contains all necessary information about sizes of the columns.
 *
 * @class {ColumnUtils}
 */
export default class ColumnUtils {
  /**
   * @type {TableDao}
   */
  dataAccessObject;
  /**
   * @type {Settings}
   */
  wtSettings;
  /**
   * @type {Map<number, number>}
   */
  headerWidths = new Map<number, number>();

  /**
   * @param {TableDao} dataAccessObject The table Data Access Object.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject: DataAccessObject, wtSettings: Settings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;
  }

  /**
   * Returns column width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getWidth(sourceIndex: number): number | undefined {
    const width = this.wtSettings.getSetting<number | undefined>('columnWidth', sourceIndex)
      || this.wtSettings.getSetting<number | undefined>('defaultColumnWidth');

    return width;
  }

  /**
   * Returns column header height based on passed header level.
   *
   * @param {number} level Column header level.
   * @returns {number}
   */
  getHeaderHeight(level: number) {
    let height = this.wtSettings.getSetting('stylesHandler').getDefaultRowHeight();
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedColumnHeaders[level];

    if (oversizedHeight !== undefined) {
      height = height ? Math.max(height, oversizedHeight) : oversizedHeight;
    }

    return height;
  }

  /**
   * Returns column header width based on passed source index.
   *
   * @param {number} sourceIndex Column source index.
   * @returns {number}
   */
  getHeaderWidth(sourceIndex: number) {
    const { columnFilter } = this.dataAccessObject.wtTable;

    if (!columnFilter) {
      return undefined;
    }

    return this.headerWidths.get(columnFilter.sourceToRendered(sourceIndex));
  }

  /**
   * Calculates column header widths that can be retrieved from the cache.
   */
  calculateWidths() {
    const { wtSettings } = this;
    let rowHeaderWidthSetting = wtSettings.getSetting('rowHeaderWidth');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rowHeaderWidthSetting = wtSettings.getSetting('onModifyRowHeaderWidth', rowHeaderWidthSetting);

    if (rowHeaderWidthSetting !== null && rowHeaderWidthSetting !== undefined) {
      const rowHeadersCount = wtSettings.getSetting<Function[]>('rowHeaders').length;
      const defaultColumnWidth = wtSettings.getSetting('defaultColumnWidth');

      for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let width = Array.isArray(rowHeaderWidthSetting)
          ? rowHeaderWidthSetting[visibleColumnIndex] : rowHeaderWidthSetting;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        width = (width === null || width === undefined) ? defaultColumnWidth : width;

        this.headerWidths.set(visibleColumnIndex, width);
      }
    }
  }
}
