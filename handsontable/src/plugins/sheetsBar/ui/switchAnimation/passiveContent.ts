/**
 * The namespace of HTML elements.
 */
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/**
 * The namespace of SVG elements.
 */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * The HTML elements a copy may contain. Each one only draws: none loads a resource, runs a
 * script, or takes part in a form once its attributes are filtered. An `img` is copied as an
 * empty box of its size, and an `input` only as a checkbox or a radio button.
 */
const PASSIVE_HTML_ELEMENTS = new Set([
  'a', 'abbr', 'b', 'br', 'button', 'code', 'del', 'div', 'em', 'i', 'img', 'input', 'ins', 'kbd',
  'label', 'mark', 'p', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'u', 'wbr',
]);

/**
 * The SVG elements a copy may contain: shapes, text, and the paint servers they reference.
 */
const PASSIVE_SVG_ELEMENTS = new Set([
  'circle', 'clipPath', 'defs', 'desc', 'ellipse', 'g', 'line', 'linearGradient', 'path', 'polygon',
  'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text', 'title', 'tspan',
]);

/**
 * The input types a copy may contain, as passive pictures of their checked state.
 */
const PASSIVE_INPUT_TYPES = new Set(['checkbox', 'radio']);

/**
 * The attributes every copied element keeps.
 */
const COMMON_ATTRIBUTES = ['aria-hidden', 'class', 'dir', 'lang', 'style'];

/**
 * The attributes a copied HTML element keeps, beyond the common ones, by element name.
 */
const HTML_ATTRIBUTES: Record<string, string[]> = {
  input: ['type', 'checked'],
};

/**
 * The attributes a copied SVG element keeps: the common ones, its geometry, and its paint.
 */
const SVG_ATTRIBUTES = new Set([
  ...COMMON_ATTRIBUTES,
  'clip-path', 'clip-rule', 'cx', 'cy', 'd', 'dominant-baseline', 'dx', 'dy', 'fill', 'fill-opacity',
  'fill-rule', 'font-family', 'font-size', 'font-weight', 'gradientTransform', 'gradientUnits', 'height',
  'offset', 'opacity', 'points', 'preserveAspectRatio', 'r', 'rx', 'ry', 'stop-color', 'stop-opacity',
  'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-width',
  'text-anchor', 'transform', 'viewBox', 'width', 'x', 'x1', 'x2', 'y', 'y1', 'y2',
]);

/**
 * The elements whose text a reader never sees, left out of a cell's plain text.
 */
const UNSEEN_TEXT_ELEMENTS = new Set(['noscript', 'script', 'style', 'template', 'title']);

/**
 * Matches an attribute value that points at a resource other than an element of the same
 * document.
 */
const EXTERNAL_REFERENCE = /url\(\s*['"]?(?!#)/i;

/**
 * Returns the inline declarations that make a copied element look like its source.
 */
export type SourceStyle = (source: Element) => string;

/**
 * Tells whether an element is an HTML element.
 */
function isHtml(element: Element): element is HTMLElement {
  return element.namespaceURI === HTML_NAMESPACE;
}

/**
 * Tells whether an element only draws, so a copy of it can do nothing else.
 */
function isPassiveElement(element: Element): boolean {
  if (element.namespaceURI === SVG_NAMESPACE) {
    return PASSIVE_SVG_ELEMENTS.has(element.localName);
  }

  if (!isHtml(element) || !PASSIVE_HTML_ELEMENTS.has(element.localName)) {
    return false;
  }

  return element.localName !== 'input' || PASSIVE_INPUT_TYPES.has((element as HTMLInputElement).type);
}

/**
 * Tells whether a copy may keep an attribute of its source element.
 */
function keepsAttribute(element: Element, name: string, value: string): boolean {
  if (EXTERNAL_REFERENCE.test(value)) {
    return false;
  }

  if (!isHtml(element)) {
    return SVG_ATTRIBUTES.has(name);
  }

  return COMMON_ATTRIBUTES.includes(name) || (HTML_ATTRIBUTES[element.localName]?.includes(name) ?? false);
}

/**
 * Creates the empty copy of an element. An image becomes a `span`, which loads nothing.
 */
function createCopy(element: Element, doc: Document): Element {
  if (!isHtml(element)) {
    return doc.createElementNS(SVG_NAMESPACE, element.localName);
  }

  return doc.createElement(element.localName === 'img' ? 'span' : element.localName);
}

/**
 * Makes a copied control a picture of its source: an input keeps its checked state, but no
 * name, form, or group, and takes no part in a form; a button never submits one.
 */
function settleControl(source: Element, copy: Element): void {
  if (source.localName === 'input') {
    (copy as HTMLInputElement).checked = (source as HTMLInputElement).checked;
    (copy as HTMLInputElement).disabled = true;
  } else if (source.localName === 'button') {
    copy.setAttribute('type', 'button');
  }
}

/**
 * Copies one element with its filtered attributes, but no children. An HTML element and an
 * `svg` root also carry their source's computed styles.
 */
function copyElement(element: Element, doc: Document, styleOf: SourceStyle): Element {
  const copy = createCopy(element, doc);

  Array.from(element.attributes).forEach(({ name, value }) => {
    if (keepsAttribute(element, name, value)) {
      copy.setAttribute(name, value);
    }
  });
  settleControl(element, copy);

  const styles = isHtml(element) || element.localName === 'svg' ? styleOf(element) : '';
  const box = element.localName === 'img'
    ? `display:inline-block;width:${(element as HTMLImageElement).width}px;`
      + `height:${(element as HTMLImageElement).height}px;`
    : '';

  if (styles !== '' || box !== '') {
    (copy as HTMLElement | SVGElement).style.cssText += styles + box;
  }

  return copy;
}

/**
 * Copies a node and its subtree. Comments and other nodes that draw nothing are left out.
 */
function copyNode(node: Node, doc: Document, styleOf: SourceStyle): Node | null {
  if (node.nodeType === node.TEXT_NODE) {
    return doc.createTextNode(node.nodeValue ?? '');
  }

  if (node.nodeType !== node.ELEMENT_NODE) {
    return null;
  }

  const copy = copyElement(node as Element, doc, styleOf);

  node.childNodes.forEach((child) => {
    const childCopy = copyNode(child, doc, styleOf);

    if (childCopy !== null) {
      copy.appendChild(childCopy);
    }
  });

  return copy;
}

/**
 * Copies a cell's content for the switch layer, built element by element rather than cloned, so
 * no copied element can load, run, or submit anything: only elements that just draw are copied,
 * and only the attributes that style them. Answers `null` when the cell holds any other element.
 * A cloned `<svg><script>` that the HTML parser left inert runs once it is inserted.
 */
export function copyPassiveContent(cell: Element, styleOf: SourceStyle): DocumentFragment | null {
  if (!Array.from(cell.querySelectorAll('*')).every(isPassiveElement)) {
    return null;
  }

  const doc = cell.ownerDocument;
  const fragment = doc.createDocumentFragment();

  cell.childNodes.forEach((node) => {
    const copy = copyNode(node, doc, styleOf);

    if (copy !== null) {
      fragment.appendChild(copy);
    }
  });

  return fragment;
}

/**
 * Returns the text a reader sees in a cell: the text of its nodes, without the text of scripts,
 * styles, templates, and other elements that never draw theirs.
 */
export function visibleText(node: Node): string {
  if (node.nodeType === node.TEXT_NODE) {
    return node.nodeValue ?? '';
  }

  if (node.nodeType !== node.ELEMENT_NODE || UNSEEN_TEXT_ELEMENTS.has((node as Element).localName)) {
    return '';
  }

  return Array.from(node.childNodes, visibleText).join('');
}
