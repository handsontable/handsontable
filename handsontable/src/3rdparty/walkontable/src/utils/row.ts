import type { DataAccessObject } from '../types';
import type Settings from '../settings';
/**
 * Row utils class contains all necessary information about sizes of the rows.
 *
 * @class {RowUtils}
 */
export default class RowUtils {
  /**
   * @type {TableDao}
   */
  dataAccessObject;
  /**
   * @type {Settings}
   */
  wtSettings;

  /**
   * @param {TableDao} dataAccessObject The table Data Access Object.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject: DataAccessObject, wtSettings: Settings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {number}
   */
  getHeight(sourceIndex: number) {
    let height = this.wtSettings.getSetting<number | undefined>('rowHeight', sourceIndex);
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }

  /**
   * Returns row height based on passed source index for the specified overlay type.
   *
   * @param {number} sourceIndex Row source index.
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} overlayName The overlay name.
   * @returns {number}
   */
  getHeightByOverlayName(sourceIndex: number, overlayName: string) {
    let height = this.wtSettings.getSetting<number | undefined>('rowHeightByOverlayName', sourceIndex, overlayName);
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
