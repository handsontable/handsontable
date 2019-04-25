export default class RowUtils {
  constructor(wot) {
    this.wot = wot;
  }

  getHeight(sourceRowIndex) {
    let height = this.wot.wtSettings.settings.rowHeight(sourceRowIndex);
    const oversizedHeight = this.wot.wtViewport.oversizedRows[sourceRowIndex];

    if (oversizedHeight !== void 0) {
      height = height === void 0 ? oversizedHeight : Math.max(height, oversizedHeight);
    }

    return height;
  }
}
