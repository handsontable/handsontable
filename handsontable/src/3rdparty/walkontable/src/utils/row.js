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
  constructor(dataAccessObject, wtSettings) {
    this.dataAccessObject = dataAccessObject;
    this.wtSettings = wtSettings;
  }

  /**
   * Returns row height based on passed source index.
   *
   * @param {number} sourceIndex Row source index.
   * @param {'inline_start'|'top'|'top_inline_start_corner'|'bottom'|'bottom_inline_start_corner'|'master'} [overlayType] If provided,
   * the hight for the specified overlay will be returned. Otherwise, the height for the master table will be returned.
   * @param {string} [source] The source of the row height call.
   * @returns {number}
   */
  getHeight(sourceIndex, overlayType, source) {
    let height = this.wtSettings.getSetting('rowHeight', sourceIndex, overlayType, source);
    const oversizedHeight = this.dataAccessObject.wtViewport.oversizedRows[sourceIndex];

    if (oversizedHeight !== undefined) {
      height = height === undefined ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
