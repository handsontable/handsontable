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
  padding = {};

  constructor(padding) {
    /**
     * SVG graphic will cover the area of the table element (element passed to the render function), minus the specified paddings.
     *
     * @type {object} Object with properties top, left, bottom, right
     */
    this.padding = padding;
  }

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

  normalize({ width: containerWidth, height: containerHeight }) {
    this.svgWidth = Math.max(Math.min(this.svgWidth, containerWidth), 0);
    this.svgHeight = Math.max(Math.min(this.svgHeight, containerHeight), 0);

    if (this.clipLeft === Infinity) {
      this.clipLeft = 0;
    }
    if (this.clipTop === Infinity) {
      this.clipTop = 0;
    }

    this.clipLeft += this.padding.left;
    this.clipTop += this.padding.top;
    this.clipRight += this.padding.right;
    this.clipBottom += this.padding.bottom;

    this.clipLeft = Math.max(this.clipLeft, 0);
    this.clipTop = Math.max(this.clipTop, 0);
    this.clipRight = Math.max(this.clipRight, 0);
    this.clipBottom = Math.max(this.clipBottom, 0);

    this.clipWidth = Math.max(this.svgWidth - this.clipLeft - this.clipRight, 0);
    this.clipHeight = Math.max(this.svgHeight - this.clipTop - this.clipBottom, 0);
  }
}
