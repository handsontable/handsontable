import { randomString } from '../../../../helpers/string';

/**
 *
 */
export default class SvgElement {
  /**
   * @type {Document}
   */
  rootDocument;
  /**
   * Value of the id of the clipPath element. Must be unique in the whole document.
   *
   * @type {string}
   */
  uniqueDomInnerClipId;
  /**
   * @type {SVGElement|undefined}
   */
  svg;
  /**
   * @type {Element|undefined}
   */
  rect;

  constructor(rootDocument) {
    this.rootDocument = rootDocument;
    this.uniqueDomInnerClipId = `${randomString()}-inner-clip`;

    this.createElement();
  }

  /**
   * @param {boolean} useInnerClipping Whether to use inner clipping.
   * @returns {HTMLElement}
   */
  createSvgGroup(useInnerClipping) {
    const group = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (useInnerClipping) {
      group.setAttribute('clip-path', `url(#${this.uniqueDomInnerClipId}`);
    }

    this.svg.appendChild(group);

    return group;
  }

  /**
   * @param {object} attrHolder Object with any properties that should be added to clip rectangle.
   */
  setClipAttributes(attrHolder) {
    Object.keys(attrHolder).forEach((attrName) => {
      this.rect.setAttribute(attrName, attrHolder[attrName]);
    });
  }

  createElement() {
    if (this.svg !== void 0) {
      return;
    }

    const svg = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.position = 'absolute';
    svg.style.zIndex = '5';
    svg.setAttribute('pointer-events', 'none');
    svg.setAttribute('class', 'wtBorders'); // in IE, classList is not defined on SVG elements and className is read-only

    const defs = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    const rect = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');

    clipPath.setAttribute('id', this.uniqueDomInnerClipId);
    clipPath.appendChild(rect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    this.rect = rect;
    this.svg = svg;
  }
}
