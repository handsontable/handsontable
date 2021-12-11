/**
 * Row utils class contains all necessary information about sizes of the rows.
 *
 * @class {RowUtils}
 */
export default class RowUtils {
  /**
   * @param {Walkontable} wot The walkontable instance. @todo remove.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(wot, wtSettings) {
    this.wot = wot;
    this.wtSettings = wtSettings;
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @returns {number}
   */
  getHeight(sourceIndex) {
    let height = this.wtSettings.getSetting('rowHeight', sourceIndex);
    const oversizedHeight = this.wot.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
