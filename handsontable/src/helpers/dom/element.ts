import { sanitize } from '../string';
import { A11Y_HIDDEN } from '../a11y';
import { isSafariBefore261, isMobileBrowser, isIpadOS, isWindowsOS } from '../browser';
import { deprecatedWarn } from '../console';
import { throwWithCause } from '../../helpers/errors';

/**
 * Get the parent of the specified node in the DOM tree.
 *
 * @param {HTMLElement} element Element from which traversing is started.
 * @param {number} [level=0] Traversing deep level.
 * @returns {HTMLElement|null}
 */
export function getParent(element: HTMLElement | Node, level: number = 0): HTMLElement | null {
  let iteration = -1;
  let parent: HTMLElement | null = null;
  let elementToCheck: Node | null = element;

  while (elementToCheck !== null) {
    if (iteration === level) {
      parent = isHTMLElement(elementToCheck) ? elementToCheck : null;
      break;
    }

    if (isShadowRoot(elementToCheck)) {
      elementToCheck = elementToCheck.host;

    } else {
      iteration += 1;
      elementToCheck = elementToCheck.parentNode;
    }
  }

  return parent;
}

/**
 * Check if the provided element is a child of the provided Handsontable container.
 *
 * @param {HTMLElement} element Element to be analyzed.
 * @param {HTMLElement} thisHotContainer The Handsontable container.
 * @returns {boolean}
 */
export function isInternalElement(element: HTMLElement, thisHotContainer: HTMLElement) {
  const closestHandsontableContainer = element.closest('.handsontable');

  return !!closestHandsontableContainer &&
    (
      closestHandsontableContainer.parentNode === thisHotContainer ||
      closestHandsontableContainer === thisHotContainer
    );
}

/**
 * Gets the event target element cast to the specified HTML element type.
 * Centralizes the `event.target as HTMLElement` cast pattern.
 *
 * @param {Event} event The event.
 * @returns {T|null} The target element or null.
 */
export function eventTargetEl<T extends HTMLElement = HTMLElement>(event: Event): T | null {
  return event.target as T | null;
}

/**
 * Gets `frameElement` of the specified frame. Returns null if it is a top frame or if script has no access to read property.
 *
 * @param {Window} frame Frame from which should be get frameElement in safe way.
 * @returns {HTMLIFrameElement|null}
 */
export function getFrameElement(frame: Window): HTMLIFrameElement | null {
  const { frameElement } = frame;

  return Object.getPrototypeOf(frame.parent) &&
    frameElement instanceof HTMLIFrameElement ? frameElement : null;
}

/**
 * Gets parent frame of the specified frame. Returns null if it is a top frame or if script has no access to read property.
 *
 * @param {Window} frame Frame from which should get frameElement in a safe way.
 * @returns {Window|null}
 */
export function getParentWindow(frame: Window): Window {
  return getFrameElement(frame) && frame.parent;
}

/**
 * Checks if script has access to read from parent frame of specified frame.
 *
 * @param {Window} frame Frame from which should get frameElement in a safe way.
 * @returns {boolean}
 */
export function hasAccessToParentWindow(frame: Window): boolean {
  return !!Object.getPrototypeOf(frame.parent);
}

/**
 * Goes up the DOM tree (including given element) until it finds an parent element that matches the nodes or nodes name.
 * This method goes up through web components.
 *
 * @param {Node} element Element from which traversing is started.
 * @param {Array<string|Node>} [nodes] Array of elements or Array of elements name (in uppercase form).
 * @param {Node} [until] The element until the traversing ends.
 * @returns {Node|null}
 */
export function closest(
  element: HTMLElement, nodes: Array<string | HTMLElement> = [], until?: Node): HTMLElement | null {
  const { ELEMENT_NODE, DOCUMENT_FRAGMENT_NODE } = Node;
  let elementToCheck: Node | null = element;

  while (elementToCheck !== null && elementToCheck !== undefined && elementToCheck !== until) {
    const { nodeType, nodeName } = elementToCheck;

    if (nodeType === ELEMENT_NODE && isHTMLElement(elementToCheck) &&
        (nodes.includes(nodeName) || nodes.includes(elementToCheck))) {
      return elementToCheck;
    }

    if (isShadowRoot(elementToCheck)) {
      elementToCheck = elementToCheck.host;

    } else {
      elementToCheck = elementToCheck.parentNode;
    }
  }

  return null;
}

/**
 * Goes "down" the DOM tree (including given element) until it finds an element that matches the nodes or nodes name.
 *
 * @param {HTMLElement} element Element from which traversing is started.
 * @param {Array} nodes Array of elements or Array of elements name.
 * @param {HTMLElement} [until] The list of elements until the traversing ends.
 * @returns {HTMLElement|null}
 */
export function closestDown(
  element: HTMLElement | Node, nodes: Array<string | HTMLElement>, until?: HTMLElement): HTMLElement | null {
  const matched: HTMLElement[] = [];
  let elementToCheck: HTMLElement | null = isHTMLElement(element) ? element : null;

  while (elementToCheck) {
    elementToCheck = closest(elementToCheck, nodes, until);

    if (!elementToCheck || (until && !until.contains(elementToCheck))) {
      break;
    }
    matched.push(elementToCheck);

    if (isShadowRoot(elementToCheck)) {
      const { host } = elementToCheck;

      elementToCheck = isHTMLElement(host) ? host : null;

    } else {
      elementToCheck = elementToCheck.parentElement;
    }
  }
  const length = matched.length;

  return length ? matched[length - 1] : null;
}

/**
 * Traverses up the DOM tree from the given element and finds parent elements that have a specified class name
 * or match a provided class name regular expression.
 *
 * @param {HTMLElement} element - The element from which to start traversing.
 * @param {string|RegExp} className - The class name or class name regular expression to check.
 * @returns {{element: HTMLElement, classNames: string[]}} - Returns an object containing the matched parent element and an array of matched class names.
 */
export function findFirstParentWithClass(element: HTMLElement, className: string | RegExp) {
  const matched: { element: HTMLElement | undefined; classNames: string[] } = {
    element: undefined,
    classNames: []
  };
  let elementToCheck: HTMLElement | null = element;

  while (elementToCheck !== null && elementToCheck !== element.ownerDocument.documentElement && !matched.element) {
    if (typeof className === 'string' && elementToCheck.classList.contains(className)) {

      matched.element = elementToCheck;
      matched.classNames.push(className);

    } else if (className instanceof RegExp) {
      const matchingClasses = Array.from(elementToCheck.classList).filter(cls => className.test(cls));

      if (matchingClasses.length) {

        matched.element = elementToCheck;
        matched.classNames.push(...matchingClasses);
      }
    }

    elementToCheck = elementToCheck.parentElement;
  }

  return matched;
}

/**
 * Goes up the DOM tree and checks if element is child of another element.
 *
 * @param {HTMLElement} child Child element An element to check.
 * @param {object|string} parent Parent element OR selector of the parent element.
 *                               If string provided, function returns `true` for the first occurrence of element with that class.
 * @returns {boolean}
 */
export function isChildOf(child: HTMLElement | Document, parent: HTMLElement | Document | string): boolean {
  let node: Node | null = child.parentNode;
  let queriedParents: Node[] = [];

  if (typeof parent === 'string') {
    if (child instanceof Document) {
      queriedParents = Array.prototype.slice.call(child.querySelectorAll(parent), 0);
    } else {
      queriedParents = Array.prototype.slice.call(child.ownerDocument.querySelectorAll(parent), 0);
    }
  } else {
    queriedParents.push(parent);
  }

  while (node !== null) {
    if (queriedParents.indexOf(node) > -1) {
      return true;
    }
    node = node.parentNode;
  }

  return false;
}

/**
 * Counts index of element within its parent.
 * WARNING: for performance reasons, assumes there are only element nodes (no text nodes). This is true
 * for Walkotnable, otherwise would need to check for nodeType or use previousElementSibling.
 *
 * @see http://jsperf.com/sibling-index/10
 * @param {Element} element The element to check.
 * @returns {number}
 */
export function index(element: Element): number {
  let i = 0;
  let elementToCheck: Node | null = element;

  if (elementToCheck.previousSibling) {
    /* eslint-disable no-cond-assign */
    while (elementToCheck = elementToCheck.previousSibling) {
      i += 1;
    }
  }

  return i;
}

/**
 * Check if the provided overlay contains the provided element.
 *
 * @param {string} overlayType The type of the overlay.
 * @param {HTMLElement} element An element to check.
 * @param {HTMLElement} root The root element.
 * @returns {boolean}
 */
export function overlayContainsElement(overlayType: string, element: HTMLElement, root: HTMLElement): boolean {
  const overlayElement = root.parentElement.querySelector(`.ht_clone_${overlayType}`);

  return overlayElement ? overlayElement.contains(element) : null;
}

/**
 * Checks whether the provided TH belongs to the bottom-most visual layer of column headers.
 * The function treats headers that use `rowspan` and reach the last header row as bottom-most.
 *
 * @param {HTMLTableCellElement} TH The TH element to check.
 * @returns {boolean}
 */
export function isBottomMostColumnHeader(TH: HTMLTableCellElement) {
  if (!TH || !TH.classList || !TH.parentNode || !TH.parentNode.parentNode) {
    return false;
  }

  if (TH.classList.contains('hiddenHeader') || TH.style.display === 'none') {
    return false;
  }

  const headerRow = TH.parentNode;
  const headerRows: Node[] = Array.from(headerRow.parentNode.childNodes);
  const headerLevel = headerRows.indexOf(headerRow);
  const rowspan = Number.parseInt(TH.getAttribute('rowspan'), 10) || 1;

  return headerLevel + rowspan >= headerRows.length;
}

/**
 * @param {string[]} classNames The element "class" attribute string.
 * @returns {string[]}
 */
function filterEmptyClassNames(classNames: string[]) {
  if (!classNames || !classNames.length) {
    return [];
  }

  return classNames.filter((x: string) => !!x);
}

function filterRegexes(list: (string | RegExp)[], returnBoth: true): { regexFree: string[]; regexes: RegExp[] };
function filterRegexes(list: (string | RegExp)[], returnBoth?: false): string[];
/**
 * Filter out the RegExp entries from an array.
 *
 * @param {(string|RegExp)[]} list Array of either strings, Regexes or a mix of both.
 * @param {boolean} [returnBoth] If `true`, both the array without regexes and an array of regexes will be returned.
 * @returns {string[]|{regexFree: string[], regexes: RegExp[]}}
 */
function filterRegexes(
  list: (string | RegExp)[], returnBoth?: boolean): string[] | { regexFree: string[]; regexes: RegExp[] } {
  if (!list || !list.length) {
    return returnBoth ? { regexFree: [], regexes: [] } : [];
  }

  const regexes: RegExp[] = [];
  const regexFree: string[] = [];

  regexFree.push(...list.filter((entry: string | RegExp): entry is string => {
    const isRegex = entry instanceof RegExp;

    if (isRegex && returnBoth) {
      regexes.push(entry);
    }

    return !isRegex;
  }));

  return returnBoth ? {
    regexFree,
    regexes
  } : regexFree;
}

/**
 * Checks if element has class name.
 *
 * @param {HTMLElement} element An element to check.
 * @param {string} className Class name to check.
 * @returns {boolean}
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  if (element.classList === undefined || typeof className !== 'string' || className === '') {
    return false;
  }

  return element.classList.contains(className);
}

/**
 * Add class name to an element.
 *
 * @param {HTMLElement} element An element to process.
 * @param {string|Array} className Class name as string or array of strings.
 */
export function addClass(element: HTMLElement, className: string | string[]): void {
  if (typeof className === 'string') {
    className = className.split(' ');
  }

  className = filterEmptyClassNames(className);

  if (className.length > 0) {
    element.classList.add(...className);
  }
}

/**
 * Remove class name from an element.
 *
 * @param {HTMLElement} element An element to process.
 * @param {string|RegExp|Array<string|RegExp>} className Class name as string or array of strings.
 */
export function removeClass(element: HTMLElement, className: string | string[] | RegExp | (string | RegExp)[]): void {
  if (typeof className === 'string') {
    className = className.split(' ');

  } else if (className instanceof RegExp) {
    className = [className];
  }

  let {
    regexFree: stringClasses,
    // eslint-disable-next-line prefer-const
    regexes: regexClasses
  } = filterRegexes(className, true);

  stringClasses = filterEmptyClassNames(stringClasses);

  if (stringClasses.length > 0) {
    element.classList.remove(...stringClasses);
  }

  regexClasses.forEach((regexClassName) => {
    element.classList.forEach((currentClassName) => {
      if (regexClassName.test(currentClassName)) {
        element.classList.remove(currentClassName);
      }
    });
  });
}

/**
 * Set a single attribute or multiple attributes at once.
 *
 * @param {HTMLElement} domElement The HTML element to be modified.
 * @param {Array[]|string} attributes If setting multiple attributes at once, `attributes` holds an array containing the
 * attributes to be added. Each element of the array should be an array in a form of `[attributeName,
 * attributeValue]`. If setting a single attribute, `attributes` holds the name of the attribute.
 * @param {string|number|undefined} [attributeValue] If setting a single attribute, `attributeValue` holds the attribute
 * value.
 */
export function setAttribute(
  domElement: HTMLElement,
  attributes: [string, string | number | boolean][] | string = [],
  attributeValue?: string | number | boolean) {
  if (!Array.isArray(attributes)) {
    attributes = [[attributes, attributeValue]];
  }

  attributes.forEach((attributeInfo: [string, string | number | boolean] | string) => {
    if (Array.isArray(attributeInfo) && attributeInfo[0] !== '') {
      domElement.setAttribute(attributeInfo[0], String(attributeInfo[1]));
    }
  });
}

/**
 * Remove a single attribute or multiple attributes from the provided element at once.
 *
 * @param {HTMLElement} domElement The HTML element to be processed.
 * @param {Array<string|RegExp>|string} attributesToRemove If removing multiple attributes, `attributesToRemove`
 * holds an array of attribute names to be removed from the provided element. If removing a single attribute, it
 * holds the attribute name.
 */
export function removeAttribute(
  domElement: HTMLElement, attributesToRemove: (string | RegExp)[] | string | RegExp = []) {
  if (typeof attributesToRemove === 'string') {
    attributesToRemove = attributesToRemove.split(' ');

  } else if (attributesToRemove instanceof RegExp) {
    attributesToRemove = [attributesToRemove];
  }

  const {
    regexFree: stringAttributes,
    regexes: regexAttributes
  } = filterRegexes(attributesToRemove, true);

  stringAttributes.forEach((attributeNameToRemove: string) => {
    if (attributeNameToRemove !== '') {
      domElement.removeAttribute(attributeNameToRemove);
    }
  });

  regexAttributes.forEach((attributeRegex: RegExp) => {
    domElement.getAttributeNames().forEach((attributeName: string) => {
      if (attributeRegex.test(attributeName)) {
        domElement.removeAttribute(attributeName);
      }
    });
  });
}

/**
 * @param {Node} element An element from the text is removed.
 */
export function removeTextNodes(element: Node): void {
  if (element.nodeType === 3) {
    element.parentNode.removeChild(element); // bye text nodes!

  } else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(element.nodeName) > -1) {
    const childs = element.childNodes;

    for (let i = childs.length - 1; i >= 0; i--) {
      removeTextNodes(childs[i]);
    }
  }
}

/**
 * Remove children function
 * WARNING - this doesn't unload events and data attached by jQuery
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/9
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/11 - no siginificant improvement with Chrome remove() method.
 *
 * @param {HTMLElement} element An element to clear.
 */
export function empty(element: HTMLElement): void {
  let child;

  /* eslint-disable no-cond-assign */
  while (child = element.lastChild) {
    element.removeChild(child);
  }
}

export const HTML_CHARACTERS = /(<([^>]*)>|&([^;]*);)/;
const dompurifyDeprecatedMessageShown = false;

/**
 * Insert content into element trying to avoid innerHTML method.
 *
 * @param {HTMLElement} element An element to write into.
 * @param {string} content The text to write.
 * @param {boolean|function(string, string): string} [sanitizer] When true, use default sanitizer; when a function, use it; when false, skip sanitization.
 * @param {string} [context] The sanitization context passed as the second argument to a custom sanitizer function.
 */
let fastInnerHTMLDeprecationWarned = false;

/**
 *
 */
export function fastInnerHTML(
  element: HTMLElement, content: string,
  sanitizer: boolean | ((html: string, context: string) => string) = true,
  context = 'innerHTML'): void {
  if (HTML_CHARACTERS.test(content)) {
    let sanitized: string;

    if (typeof sanitizer === 'function') {
      sanitized = sanitizer(content, context);
    } else if (sanitizer) {
      if (!fastInnerHTMLDeprecationWarned) {
        fastInnerHTMLDeprecationWarned = true;
        deprecatedWarn(
          'The HTML sanitization using DOMPurify library is deprecated and will be removed in the ' +
          'next major release. Use the `sanitizer` option instead.\n\n' +
          'Migration guide: https://handsontable.com/docs/migration-from-16.2-to-17.0/\n' +
          '`sanitizer` documentation: https://handsontable.com/docs/api/options/#sanitizer'
        );
      }

      sanitized = sanitize(content, undefined);
    } else {
      sanitized = content;
    }

    element.innerHTML = sanitized;
  } else {
    fastInnerText(element, content);
  }
}

/**
 * Insert text content into element.
 *
 * @param {HTMLElement} element An element to write into.
 * @param {string} content The text to write.
 */
export function fastInnerText(element: HTMLElement, content: string): void {
  const child = element.firstChild;

  if (child && child.nodeType === 3 && child.nextSibling === null) {
    // fast lane - replace existing text node
    child.textContent = content;

  } else {
    // slow lane - empty element and insert a text node
    empty(element);
    element.appendChild(element.ownerDocument.createTextNode(content));
  }
}

/**
 * Returns true if element is attached to the DOM and visible, false otherwise.
 *
 * @param {HTMLElement} element An element to check.
 * @returns {boolean}
 */
export function isVisible(element: HTMLElement): boolean {
  // Fast path: use the native checkVisibility() API (Chrome 105+, Firefox 106+, Safari 17.4+).
  // With no options it checks display:none ancestry and DOM attachment — matching the legacy
  // ancestor walk below, but in O(1) browser-native time instead of O(DOM depth) with
  // per-node getComputedStyle() calls that force full-document layout recalculation.
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }

  // Legacy fallback: manual ancestor walk for browsers that do not support checkVisibility().
  const documentElement = element.ownerDocument.documentElement;
  const windowElement = element.ownerDocument.defaultView;
  let next: Node = element;

  while (next !== documentElement) { // until <html> reached
    if (next === null) { // parent detached from DOM
      return false;

    } else if (isShadowRoot(next)) { // this is Web Components Shadow DOM
      // see: http://w3c.github.io/webcomponents/spec/shadow/#encapsulation
      // according to spec, should be if (next.ownerDocument !== window.document), but that doesn't work yet

      // `impl` was a non-standard property in Chrome 33.0.1723.0 canary (2013-11-29) that exposed the
      // internal implementation node when Web Platform features were disabled. It is no longer present
      // in any supported browser, but we keep the fallback to avoid a silent regression on very old builds.
      interface ShadowHostWithImpl extends HTMLElement { impl?: HTMLElement }
      const host = next.host as ShadowHostWithImpl;

      if (host.impl) { // Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features disabled
        return isVisible(host.impl);

      } else { // Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features enabled
        return isVisible(host);
      }

    } else if (next.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      return false; // this is a node detached from document in IE8

    } else if (next.nodeType === Node.ELEMENT_NODE && isHTMLElement(next) &&
      windowElement.getComputedStyle(next).display === 'none') {
      return false;
    }

    next = next.parentNode;
  }

  return true;
}

/**
 * Returns true if the element has the height set to `0` or `0px` and overflow to `hidden` (height deliberately set to be 0).
 *
 * @param {HTMLElement} element The element to check.
 * @returns {boolean} `true` if the element has height set to `0` or `0px` and overflow is set to `hidden`, `false` otherwise.
 */
export function hasZeroHeight(element: HTMLElement): boolean {
  const rootDocument = element.ownerDocument;
  const rootWindow = rootDocument.defaultView;
  let currentElement: HTMLElement | null = element;

  while (currentElement.parentElement) {
    if (currentElement.style.height === '0px' || currentElement.style.height === '0') {
      const computedOverflow = rootWindow.getComputedStyle(currentElement)
        .getPropertyValue('overflow');

      return computedOverflow === 'hidden' || computedOverflow === 'clip';
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

/**
 * Returns elements top and left offset relative to the document. Function is not compatible with jQuery offset.
 *
 * @param {HTMLElement} element An element to get the offset position from.
 * @returns {object} Returns object with `top` and `left` props.
 */
export function offset(element: HTMLElement): { left: number, top: number } {
  const rootDocument = element.ownerDocument;
  const rootWindow = rootDocument.defaultView;
  const documentElement = rootDocument.documentElement;
  let elementToCheck: HTMLElement | null = element;
  let offsetLeft;
  let offsetTop;
  let lastElem: HTMLElement;

  offsetLeft = elementToCheck.offsetLeft;
  offsetTop = elementToCheck.offsetTop;
  lastElem = elementToCheck;

  /* eslint-disable no-cond-assign */
  while (elementToCheck = (isHTMLElement(elementToCheck.offsetParent) ? elementToCheck.offsetParent : null)) {
    // from my observation, document.body always has scrollLeft/scrollTop == 0
    if (elementToCheck === rootDocument.body) {
      break;
    }
    // If the element is inside an SVG context, the `offsetParent` can be
    // a <foreignObject> that does not have properties `offsetLeft` and `offsetTop` defined.
    if (!('offsetLeft' in elementToCheck)) {
      break;
    }
    offsetLeft += elementToCheck.offsetLeft;
    offsetTop += elementToCheck.offsetTop;
    lastElem = elementToCheck;
  }

  // slow - http://jsperf.com/offset-vs-getboundingclientrect/6
  if (lastElem && lastElem.style.position === 'fixed') {
    // if(lastElem !== document.body) { //faster but does gives false positive in Firefox
    offsetLeft += rootWindow.pageXOffset || documentElement.scrollLeft;
    offsetTop += rootWindow.pageYOffset || documentElement.scrollTop;
  }

  return {
    left: offsetLeft,
    top: offsetTop
  };
}

/**
 * Returns the document's scrollTop property.
 *
 * @param {Window} [rootWindow] The document window owner.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
export function getWindowScrollTop(rootWindow: Window = window): number {
  return rootWindow.scrollY;
}

/**
 * Returns the document's scrollLeft property.
 *
 * @param {Window} [rootWindow] The document window owner.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
export function getWindowScrollLeft(rootWindow: Window = window): number {
  return rootWindow.scrollX;
}

/**
 * Returns the provided element's scrollTop property.
 *
 * @param {HTMLElement} element An element to get the scroll top position from.
 * @param {Window} [rootWindow] The document window owner.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
export function getScrollTop(element: HTMLElement | Window, rootWindow: Window = window): number {
  if (element instanceof Window) {
    return getWindowScrollTop(rootWindow);
  }

  return element.scrollTop;
}

/**
 * Returns the provided element's scrollLeft property.
 *
 * @param {HTMLElement} element An element to get the scroll left position from.
 * @param {Window} [rootWindow] The document window owner.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
export function getScrollLeft(element: HTMLElement | Window, rootWindow: Window = window): number {
  if (element instanceof Window) {
    return getWindowScrollLeft(rootWindow);
  }

  return element.scrollLeft;
}

/**
 * Returns a DOM element responsible for scrolling of the provided element.
 *
 * @param {HTMLElement} element An element to get the scrollable element from.
 * @returns {HTMLElement} Element's scrollable parent.
 */
export function getScrollableElement(element: HTMLElement): HTMLElement | Window {
  const rootDocument = element.ownerDocument;
  const rootWindow = rootDocument.defaultView;

  const props = ['auto', 'scroll'];
  let el: HTMLElement | null = element.parentElement;

  while (el && el.style && rootDocument.body !== el) {
    let { overflow, overflowX, overflowY } = el.style;

    if ([overflow, overflowX, overflowY].includes('scroll')) {
      return el;

    } else {
      ({ overflow, overflowX, overflowY } = rootWindow.getComputedStyle(el));

      if (props.includes(overflow) || props.includes(overflowX) || props.includes(overflowY)) {
        return el;
      }
    }

    // The '+ 1' after the scrollHeight/scrollWidth is to prevent problems with zoomed out Chrome.
    if (el.clientHeight <= el.scrollHeight + 1 && (props.includes(overflowY) || props.includes(overflow))) {
      return el;
    }
    if (el.clientWidth <= el.scrollWidth + 1 && (props.includes(overflowX) || props.includes(overflow))) {
      return el;
    }

    el = el.parentElement;
  }

  return rootWindow;
}

/**
 * Get the maximum available `scrollTop` value for the provided element.
 *
 * @param {HTMLElement} element The element to get the maximum scroll top value from.
 * @returns {number} The maximum scroll top value.
 */
export function getMaximumScrollTop(element: HTMLElement) {
  return element.scrollHeight - element.clientHeight;
}

/**
 * Get the maximum available `scrollLeft` value for the provided element.
 *
 * @param {HTMLElement} element The element to get the maximum scroll left value from.
 * @returns {number} The maximum scroll left value.
 */
export function getMaximumScrollLeft(element: HTMLElement) {
  return element.scrollWidth - element.clientWidth;
}

/**
 * Returns a DOM element responsible for trimming the provided element.
 *
 * @param {HTMLElement} base Base element.
 * @returns {HTMLElement} Base element's trimming parent.
 */
export function getTrimmingContainer(base: HTMLElement): HTMLElement | Window {
  const rootDocument = base.ownerDocument;
  const rootWindow = rootDocument.defaultView;

  let el: HTMLElement | null = base.parentElement;

  while (el && el.style && rootDocument.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    }

    const computedStyle = rootWindow.getComputedStyle(el);
    const allowedProperties = ['scroll', 'hidden', 'auto', 'clip'];
    const property = computedStyle.getPropertyValue('overflow');
    const propertyY = computedStyle.getPropertyValue('overflow-y');
    const propertyX = computedStyle.getPropertyValue('overflow-x');

    if (allowedProperties.includes(property) ||
        allowedProperties.includes(propertyY) ||
        allowedProperties.includes(propertyX)) {
      return el;
    }

    el = el.parentElement;
  }

  return rootWindow;
}

/**
 * Returns a style property for the provided element. (Be it an inline or external style).
 *
 * @param {HTMLElement} element An element to get the style from.
 * @param {string} prop Wanted property.
 * @param {Window} [rootWindow] The document window owner.
 * @returns {string|undefined} Element's style property.
 */
// eslint-disable-next-line no-restricted-globals
export function getStyle(element: HTMLElement | Window, prop: string, rootWindow: Window = window): string {
  if (!element) {
    return;

  } else if (element instanceof Window) {
    if (prop === 'width') {
      return `${element.innerWidth}px`;

    } else if (prop === 'height') {
      return `${element.innerHeight}px`;
    }

    return;
  }

  const styleProp = element.style.getPropertyValue(prop) ||
    (element.style as unknown as Record<string, string>)[prop];

  if (styleProp !== '' && styleProp !== undefined) {
    return styleProp;
  }

  const computedStyle = rootWindow.getComputedStyle(element);
  const computedProp = computedStyle.getPropertyValue(prop) ||
    (computedStyle as unknown as Record<string, string>)[prop];

  if (computedProp !== '' && computedProp !== undefined) {
    return computedProp;
  }
}

/**
 * Verifies if element fit to provided CSSRule.
 *
 * @param {Element} element Element to verify with selector text.
 * @param {CSSRule} rule Selector text from CSSRule.
 * @returns {boolean}
 */
export function matchesCSSRules(element: Element, rule: CSSRule): boolean {
  let result = false;

  if (rule instanceof CSSStyleRule && rule.selectorText) {
    // msMatchesSelector is a non-standard alias present in IE and old Edge
    type ElementWithMs = Element & { msMatchesSelector: (selector: string) => boolean };
    const elementWithMs = element as ElementWithMs;

    if ('msMatchesSelector' in element && typeof elementWithMs.msMatchesSelector === 'function') {
      result = elementWithMs.msMatchesSelector(rule.selectorText);

    } else if (element.matches) {
      result = element.matches(rule.selectorText);
    }
  }

  return result;
}

/**
 * Returns the element's outer width.
 *
 * @param {HTMLElement} element An element to get the width from.
 * @returns {number} Element's outer width.
 */
export function outerWidth(element: HTMLElement): number {
  return element.offsetWidth;
}

/**
 * Returns the element's outer height.
 *
 * @param {HTMLElement} element An element to get the height from.
 * @returns {number} Element's outer height.
 */
export function outerHeight(element: HTMLElement): number {
  return element.offsetHeight;
}

/**
 * Returns the element's inner height.
 *
 * @param {HTMLElement} element An element to get the height from.
 * @returns {number} Element's inner height.
 */
export function innerHeight(element: HTMLElement | Window): number {
  return element instanceof Window ? element.innerHeight : element.clientHeight;
}

/**
 * Returns the element's inner width.
 *
 * @param {HTMLElement} element An element to get the width from.
 * @returns {number} Element's inner width.
 */
export function innerWidth(element: HTMLElement | Window): number {
  return element instanceof Window ? element.innerWidth : element.clientWidth;
}

/**
 * @param {HTMLElement} element An element to which the event is added.
 * @param {string} event The event name.
 * @param {Function} callback The callback to add.
 */
export function addEvent(element: HTMLElement, event: string, callback: (event?: Event) => void): void {
  element.addEventListener(event, callback, false);
}

/**
 * @param {HTMLElement} element An element from which the event is removed.
 * @param {string} event The event name.
 * @param {Function} callback The function reference to remove.
 */
export function removeEvent(element: HTMLElement, event: string, callback: () => void): void {
  element.removeEventListener(event, callback, false);
}

/**
 * Returns caret position in text input.
 *
 * @author https://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @param {HTMLInputElement|HTMLTextAreaElement} el An element to check.
 * @returns {number}
 */
export function getCaretPosition(el: HTMLInputElement | HTMLTextAreaElement): number {
  if (el.selectionStart) {
    return el.selectionStart;
  }

  return 0;
}

/**
 * Returns end of the selection in text input.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} el An element to check.
 * @returns {number}
 */
export function getSelectionEndPosition(el: HTMLInputElement | HTMLTextAreaElement): number {
  if (el.selectionEnd) {
    return el.selectionEnd;
  }

  return 0;
}

/**
 * Returns text under selection.
 *
 * @param {Window} [rootWindow] The document window owner.
 * @returns {string}
 */
// eslint-disable-next-line no-restricted-globals
export function getSelectionText(rootWindow: Window = window): string {
  const rootDocument = rootWindow.document;
  let text = '';

  if (rootWindow.getSelection) {
    text = rootWindow.getSelection().toString();

  } else {
    // `document.selection` is an IE-only non-standard API
    type DocWithSelection = Document & { selection?: { type: string; createRange(): { text: string } } };

    if ('selection' in rootDocument) {
      const docWithSel = rootDocument as DocWithSelection;

      if (docWithSel.selection && docWithSel.selection.type !== 'Control') {
        text = docWithSel.selection.createRange().text;
      }
    }
  }

  return text;
}

/**
 * Cross-platform helper to clear text selection.
 *
 * @param {Window} [rootWindow] The document window owner.
 */
// eslint-disable-next-line no-restricted-globals
export function clearTextSelection(rootWindow: Window = window): void {
  // http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
  if (rootWindow.getSelection) {
    if (rootWindow.getSelection().empty) { // Chrome
      rootWindow.getSelection().empty();
    } else if (rootWindow.getSelection().removeAllRanges) { // Firefox
      rootWindow.getSelection().removeAllRanges();
    }
  }
}

/**
 * Sets caret position in text input.
 *
 * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
 * @param {HTMLInputElement|HTMLTextAreaElement} element An element to process.
 * @param {number} pos The selection start position.
 * @param {number} endPos The selection end position.
 */
export function setCaretPosition(element: HTMLInputElement | HTMLTextAreaElement, pos: number, endPos: number): void {
  if (endPos === undefined) {
    endPos = pos;
  }

  if (element.setSelectionRange) {
    element.focus();

    try {
      element.setSelectionRange(pos, endPos);
    } catch (err) {
      const elementParent = element.parentElement;

      if (elementParent) {
        const parentDisplayValue = elementParent.style.display;

        elementParent.style.display = 'block';
        element.setSelectionRange(pos, endPos);
        elementParent.style.display = parentDisplayValue;
      }
    }
  }
}

let cachedScrollbarWidth: number | undefined;

/**
 * Returns the fractional scaling compensation for scrollbar width calculation.
 *
 * @param {Document} rootDocument The onwer of the document.
 * @returns {number} The compensation for the scrollbar width, when the device pixel ratio is not an integer.
 */
// eslint-disable-next-line no-restricted-globals
export function getFractionalScalingCompensation(rootDocument: Document = document): number {
  if (!isWindowsOS()) {
    return 0;
  }

  // On Windows, fractional scaling makes the scrollbar wider to compensate for the anti-aliasing.
  // This is a workaround to calculate the correct scrollbar width.
  return Number.isInteger(rootDocument.defaultView.devicePixelRatio || 1) ? 0 : 2;
}

/**
 * Helper to calculate scrollbar width.
 * Source: https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes.
 *
 * @private
 * @param {Document} rootDocument The owner of the document.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
function walkontableCalculateScrollbarWidth(rootDocument = document) {
  const calculateScrollbarWidth = (shouldForceWebkitScrollbarStyles = false) => {
    const inner = rootDocument.createElement('div');

    inner.style.height = '200px';
    inner.style.width = '100%';

    const outer = rootDocument.createElement('div');

    outer.classList.add('htScrollbarTest');

    if (shouldForceWebkitScrollbarStyles) {
      outer.classList.add('htScrollbarSafariTest');
    }

    outer.style.boxSizing = 'content-box';
    outer.style.height = '150px';
    outer.style.left = '0px';
    outer.style.overflow = 'hidden';
    outer.style.position = 'absolute';
    outer.style.top = '0px';
    outer.style.width = '200px';
    outer.style.visibility = 'hidden';
    outer.appendChild(inner);

    rootDocument.body.appendChild(outer);

    const w1 = inner.offsetWidth;

    outer.style.overflow = 'scroll';

    let w2 = inner.offsetWidth;

    if (w1 === w2) {
      w2 = outer.clientWidth;
    }

    rootDocument.body.removeChild(outer);

    return w1 - w2;
  };

  const defaultScrollbarWidth = calculateScrollbarWidth();

  // Safari around 26.x (e.g. 26.2/26.3) changed how scrollbars are rendered: overlay scrollbars
  // and the standard scrollbar-color/scrollbar-width properties are preferred. When those are set
  // (e.g. on .wtHolder via theme), they override the non-standard ::-webkit-scrollbar per spec,
  // so the real scrollbar can be 0-width. Older Safari (before 26.1) sometimes reports 0 because
  // it needs explicit ::-webkit-scrollbar size to lay out a classic scrollbar; the fallback below
  // forces that via htScrollbarSafariTest so we get a correct non-zero width. We must only run
  // this fallback when isSafariBefore261(), otherwise Safari 26.1+ with overlay scrollbars would
  // be given 9px from the probe (which has no theme) while .wtHolder actually has 0-width overlay.
  if (defaultScrollbarWidth === 0 && isSafariBefore261() && !isMobileBrowser() && !isIpadOS()) {
    return calculateScrollbarWidth(true);
  }

  return defaultScrollbarWidth;
}

/**
 * Returns the computed width of the native browser scroll bar.
 *
 * @param {Document} [rootDocument] The owner of the document.
 * @returns {number} The computed width of the native browser scroll bar.
 */
// eslint-disable-next-line no-restricted-globals
export function getScrollbarWidth(rootDocument: Document = document): number {
  if (cachedScrollbarWidth === undefined) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth(rootDocument);
  }

  return cachedScrollbarWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement|Window} element An element to check.
 * @returns {boolean}
 */
export function hasVerticalScrollbar(element: HTMLElement | Window): boolean {
  if (element instanceof Window) {
    return element.document.body.scrollHeight > element.innerHeight;
  }

  return element.offsetWidth !== element.clientWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement|Window} element An element to check.
 * @returns {boolean}
 */
export function hasHorizontalScrollbar(element: HTMLElement | Window): boolean {
  if (element instanceof Window) {
    return element.document.body.scrollWidth > element.innerWidth;
  }

  return element.offsetHeight !== element.clientHeight;
}

/**
 * Sets overlay position depending on it's type and used browser.
 *
 * @param {HTMLElement} overlayElem An element to process.
 * @param {number|string} left The left position of the overlay.
 * @param {number|string} top The top position of the overlay.
 */
export function setOverlayPosition(overlayElem: HTMLElement, left: string | number, top: string | number): void {
  overlayElem.style.transform = `translate3d(${left},${top},0)`;
}

/**
 * @param {HTMLElement} element An element to process.
 * @returns {number|Array}
 */
export function getCssTransform(element: HTMLElement): number | [string, string] {
  let transform;

  if (element.style.transform && (transform = element.style.transform) !== '') {
    return ['transform', transform];
  }

  return -1;
}

/**
 * @param {HTMLElement} element An element to process.
 */
export function resetCssTransform(element: HTMLElement): void {
  if (element.style.transform && element.style.transform !== '') {
    element.style.transform = '';
  }
}

/**
 * Determines if the given DOM element is an input field.
 * Notice: By 'input' we mean input, textarea and select nodes.
 *
 * @param {HTMLElement} element - DOM element.
 * @returns {boolean}
 */
export function isInput(element: HTMLElement): boolean {
  const inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return element && (inputs.indexOf(element.nodeName) > -1 || element.contentEditable === 'true');
}

/**
 * Determines if the given DOM element is an input field placed OUTSIDE of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes which have defined 'data-hot-input' attribute.
 *
 * @param {HTMLElement} element - DOM element.
 * @returns {boolean}
 */
export function isOutsideInput(element: HTMLElement): boolean {
  return isInput(element) && element.hasAttribute('data-hot-input') === false;
}

/**
 * Check if the given DOM element can be focused (by using "select" method).
 *
 * @param {HTMLElement} element - DOM element.
 */
export function selectElementIfAllowed(element: HTMLElement): void {
  const activeElement = element.ownerDocument.activeElement;

  if (isHTMLElement(activeElement) && !isOutsideInput(activeElement) &&
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    element.select();
  }
}

/**
 * Check if the provided element is detached from DOM.
 *
 * @param {HTMLElement} element HTML element to be checked.
 * @returns {boolean} `true` if the element is detached, `false` otherwise.
 */
export function isDetached(element: HTMLElement): boolean {
  return !element.parentNode;
}

/**
 * Set up an observer to recognize when the provided element first becomes visible and trigger a callback when it
 * happens.
 *
 * @param {HTMLElement} elementToBeObserved Element to be observed.
 * @param {Function} callback The callback function.
 */
export function observeVisibilityChangeOnce(elementToBeObserved: HTMLElement, callback: () => void) {
  const visibilityObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
  });

  visibilityObserver.observe(elementToBeObserved);
}

/**
 * Add a `contenteditable` attribute, select the contents and optionally add the `invisibleSelection`
 * class to the provided element.
 *
 * @param {HTMLElement} element Element to be processed.
 * @param {boolean} [invisibleSelection=true] `true` if the class should be added to the element.
 * @param {boolean} [ariaHidden=true] `true` if the `aria-hidden` attribute should be added to the processed element.
 */
export function makeElementContentEditableAndSelectItsContent(
  element: HTMLElement, invisibleSelection = true, ariaHidden = true) {
  const ownerDocument = element.ownerDocument;
  const range = ownerDocument.createRange();
  const sel = ownerDocument.defaultView.getSelection();

  setAttribute(element, 'contenteditable', true);

  if (ariaHidden) {
    const hiddenAttr = A11Y_HIDDEN();

    setAttribute(element, hiddenAttr[0], hiddenAttr[1]);
  }

  if (invisibleSelection) {
    addClass(element, 'invisibleSelection');
  }

  range.selectNodeContents(element);

  sel.removeAllRanges();

  sel.addRange(range);
}

/**
 * Remove the `contenteditable` attribute, deselect the contents and optionally remove the `invisibleSelection`
 * class from the provided element.
 *
 * @param {HTMLElement} selectedElement The element to be deselected.
 * @param {boolean} [removeInvisibleSelectionClass=true] `true` if the class should be removed from the element.
 */
export function removeContentEditableFromElementAndDeselect(
  selectedElement: HTMLElement, removeInvisibleSelectionClass = true) {
  const sel = selectedElement.ownerDocument.defaultView.getSelection();

  if (selectedElement.hasAttribute('aria-hidden')) {
    selectedElement.removeAttribute('aria-hidden');
  }

  sel.removeAllRanges();

  if (removeInvisibleSelectionClass) {
    removeClass(selectedElement, 'invisibleSelection');
  }

  selectedElement.removeAttribute('contenteditable');
}

/**
 * Run the provided callback while the provided element is selected and modified to have the `contenteditable`
 * attribute added. Optionally, the selection can be configured to be invisible.
 *
 * @param {HTMLElement} element Element to be selected.
 * @param {Function} callback Callback to be called.
 * @param {boolean} [invisibleSelection=true] `true` if the selection should be invisible.
 */
export function runWithSelectedContendEditableElement(
  element: HTMLElement, callback: () => void, invisibleSelection = true) {
  makeElementContentEditableAndSelectItsContent(element, invisibleSelection);

  callback();

  removeContentEditableFromElementAndDeselect(element, invisibleSelection);
}

/**
 * Check if the element is HTMLElement.
 *
 * @param {*} element Element to check.
 * @returns {boolean} `true` if the element is HTMLElement.
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  if (typeof element !== 'object' || element === null) {
    return false;
  }

  const OwnElement = (element as { ownerDocument?: { defaultView?: { Element?: typeof Element } } })
    .ownerDocument?.defaultView?.Element;

  return !!(OwnElement && element instanceof OwnElement);
}

/**
 * Check if the element is an HTMLInputElement.
 *
 * @param {HTMLElement} element Element to check.
 * @returns {boolean} `true` if the element is an HTMLInputElement.
 */
export function isHTMLInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.tagName === 'INPUT';
}

/**
 * Check if the node is a ShadowRoot (a document fragment attached to a host element).
 *
 * @param {Node} node Node to check.
 * @returns {boolean} `true` if the node is a ShadowRoot.
 */
export function isShadowRoot(node: Node): node is ShadowRoot {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in node;
}

/**
 * Gets a child node at the specified index cast to the specified HTML element type.
 *
 * @param {ParentNode} parent The parent node.
 * @param {number} index The child index.
 * @returns {T|null} The child element or null.
 */
export function getChildEl<T extends HTMLElement = HTMLElement>(parent: ParentNode, index: number): T | null {
  const node = parent.childNodes[index];

  return node ? (node as T) : null;
}
