export default class ViewSize {
  constructor() {
    this.currentViewSize = 0;
    this.nextViewSize = 0;
    this.currentOffset = 0;
    this.nextOffset = 0;
  }

  setSize(size) {
    this.currentViewSize = this.nextViewSize;
    this.nextViewSize = size;
  }

  setOffset(offset) {
    this.currentOffset = this.nextOffset;
    this.nextOffset = offset;
  }

  getSize() {
    return {
      currentViewSize: this.currentViewSize,
      nextViewSize: this.nextViewSize,
      currentOffset: this.currentOffset,
      nextOffset: this.nextOffset,
    };
  }
}
