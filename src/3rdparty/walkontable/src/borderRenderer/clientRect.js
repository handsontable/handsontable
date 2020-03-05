/**
 *
 */
export default class ClientRect {
  svgWidth = 0;
  svgHeight = 0;
  clipWidth = 0;
  clipHeight = 0;
  clipLeft = Infinity;
  clipTop = Infinity;
  clipRight = 0;
  clipBottom = 0;

  reset() {
    this.svgWidth = 0;
    this.svgHeight = 0;
    this.clipWidth = 0;
    this.clipHeight = 0;
    this.clipLeft = Infinity;
    this.clipTop = Infinity;
    this.clipRight = 0;
    this.clipBottom = 0;
  }

  /**
   *
   *
   * @param {object} dimensions Object with properties width, height.
   * @param {object} padding Object with properties top, left, bottom, right. SVG graphic will cover the area of the table element (element passed to the render function), minus the specified paddings.
   */
  normalize({ width: containerWidth, height: containerHeight }, padding) {
    this.svgWidth = Math.max(Math.min(this.svgWidth, containerWidth), 0);
    this.svgHeight = Math.max(Math.min(this.svgHeight, containerHeight), 0);

    if (this.clipLeft === Infinity) {
      this.clipLeft = 0;
    }
    if (this.clipTop === Infinity) {
      this.clipTop = 0;
    }

    this.clipLeft += padding.left;
    this.clipTop += padding.top;
    this.clipRight += padding.right;
    this.clipBottom += padding.bottom;

    this.clipLeft = Math.max(this.clipLeft, 0);
    this.clipTop = Math.max(this.clipTop, 0);
    this.clipRight = Math.max(this.clipRight, 0);
    this.clipBottom = Math.max(this.clipBottom, 0);

    this.clipWidth = Math.max(this.svgWidth - this.clipLeft - this.clipRight, 0);
    this.clipHeight = Math.max(this.svgHeight - this.clipTop - this.clipBottom, 0);
  }
}
