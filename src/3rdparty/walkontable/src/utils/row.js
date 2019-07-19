/**
 * Row utils class contains all necessary information about sizes of the rows.
 *
 * @class {RowUtils}
 */
export default class RowUtils {
  constructor(wot) {
    this.wot = wot;
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {Number} sourceIndex Row source index.
   * @returns {Number}
   */
  getHeight(sourceIndex) {
    let height = this.wot.wtSettings.settings.rowHeight(sourceIndex);
    const oversizedHeight = this.wot.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
