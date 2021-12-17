/**
 * Row utils class contains all necessary information about sizes of the rows.
 *
 * @class {RowUtils}
 */
export default class RowUtils {
  /**
   * @param {TableDao} dataAccessObject The walkontable instance. @todo remove.
   * @param {Settings} wtSettings The walkontable settings.
   */
  constructor(dataAccessObject, wtSettings) {
    this.dataAccessObject = dataAccessObject;
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
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
