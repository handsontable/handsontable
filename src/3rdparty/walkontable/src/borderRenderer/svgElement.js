/**
 *
 */
export default class SvgElement {
  /**
   * @type {Document}
   */
  rootDocument;
  /**
   * @type {string}
   */
  uniqueDomId;
  /**
   * @type {SVGElement|undefined}
   */
  svg;
  /**
   * @type {Element|undefined}
   */
  rect;

  constructor(rootDocument, uniqueDomId) {
    this.rootDocument = rootDocument;
    this.uniqueDomId = uniqueDomId;

    this.createElement();
  }

  /**
   * @param {boolean} useInnerClipping Whether to use inner clipping.
   * @returns {HTMLElement}
   */
  createSvgGroup(useInnerClipping) {
    const group = this.rootDocument.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (useInnerClipping) {
      group.setAttribute('clip-path', `url(#${this.uniqueDomId}-inner-clip)`);
    }

    this.svg.appendChild(group);

    return group;
  }

  /**
   * @param {object} attrHolder
   */
  setSvgAttributes(attrHolder) {
    Object.keys(attrHolder).forEach((attrName) => {
      this.svg.setAttribute(attrName, attrHolder[attrName]);
    });
  }

  /**
   * @param {object} attrHolder
   */
  setClipAttributes(attrHolder) {
    Object.keys(attrHolder).forEach((attrName) => {
      this.rect.setAttribute(attrName, attrHolder[attrName]);
    });
  }

  /**
   * @returns {HTMLElement}
   */
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

    clipPath.setAttribute('id', `${this.uniqueDomId}-inner-clip`);
    clipPath.appendChild(rect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    this.rect = rect;
    this.svg = svg;
  }
}
