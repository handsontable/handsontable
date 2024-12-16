import { sanitize } from '../string';
import { A11Y_HIDDEN } from '../a11y';

/**
 * Get the parent of the specified node in the DOM tree.
 *
 * @param {HTMLElement} element Element from which traversing is started.
 * @param {number} [level=0] Traversing deep level.
 * @returns {HTMLElement|null}
 */
export function getParent(element, level = 0) {
  let iteration = -1;
  let parent = null;
  let elementToCheck = element;

  while (elementToCheck !== null) {
    if (iteration === level) {
      parent = elementToCheck;
      break;
    }

    if (elementToCheck.host && elementToCheck.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
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
export function isThisHotChild(element, thisHotContainer) {
  const closestHandsontableContainer = element.closest('.handsontable');

  return !!closestHandsontableContainer &&
    (
      closestHandsontableContainer.parentNode === thisHotContainer ||
      closestHandsontableContainer === thisHotContainer
    );
}

/**
 * Gets `frameElement` of the specified frame. Returns null if it is a top frame or if script has no access to read property.
 *
 * @param {Window} frame Frame from which should be get frameElement in safe way.
 * @returns {HTMLIFrameElement|null}
 */
export function getFrameElement(frame) {
  return Object.getPrototypeOf(frame.parent) && frame.frameElement;
}

/**
 * Gets parent frame of the specified frame. Returns null if it is a top frame or if script has no access to read property.
 *
 * @param {Window} frame Frame from which should get frameElement in a safe way.
 * @returns {Window|null}
 */
export function getParentWindow(frame) {
  return getFrameElement(frame) && frame.parent;
}

/**
 * Checks if script has access to read from parent frame of specified frame.
 *
 * @param {Window} frame Frame from which should get frameElement in a safe way.
 * @returns {boolean}
 */
export function hasAccessToParentWindow(frame) {
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
export function closest(element, nodes = [], until) {
  const { ELEMENT_NODE, DOCUMENT_FRAGMENT_NODE } = Node;
  let elementToCheck = element;

  while (elementToCheck !== null && elementToCheck !== undefined && elementToCheck !== until) {
    const { nodeType, nodeName } = elementToCheck;

    if (nodeType === ELEMENT_NODE && (nodes.includes(nodeName) || nodes.includes(elementToCheck))) {
      return elementToCheck;
    }

    const { host } = elementToCheck;

    if (host && nodeType === DOCUMENT_FRAGMENT_NODE) {
      elementToCheck = host;

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
export function closestDown(element, nodes, until) {
  const matched = [];
  let elementToCheck = element;

  while (elementToCheck) {
    elementToCheck = closest(elementToCheck, nodes, until);

    if (!elementToCheck || (until && !until.contains(elementToCheck))) {
      break;
    }
    matched.push(elementToCheck);

    if (elementToCheck.host && elementToCheck.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      elementToCheck = elementToCheck.host;

    } else {
      elementToCheck = elementToCheck.parentNode;
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
export function findFirstParentWithClass(element, className) {
  const matched = {
    element: undefined,
    classNames: []
  };
  let elementToCheck = element;

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
export function isChildOf(child, parent) {
  let node = child.parentNode;
  let queriedParents = [];

  if (typeof parent === 'string') {
    if (child.defaultView) {
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
export function index(element) {
  let i = 0;
  let elementToCheck = element;

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
export function overlayContainsElement(overlayType, element, root) {
  const overlayElement = root.parentElement.querySelector(`.ht_clone_${overlayType}`);

  return overlayElement ? overlayElement.contains(element) : null;
}

/**
 * @param {string[]} classNames The element "class" attribute string.
 * @returns {string[]}
 */
function filterEmptyClassNames(classNames) {
  if (!classNames || !classNames.length) {
    return [];
  }

  return classNames.filter(x => !!x);
}

/**
 * Filter out the RegExp entries from an array.
 *
 * @param {(string|RegExp)[]} list Array of either strings, Regexes or a mix of both.
 * @param {boolean} [returnBoth] If `true`, both the array without regexes and an array of regexes will be returned.
 * @returns {string[]|{regexFree: string[], regexes: RegExp[]}}
 */
function filterRegexes(list, returnBoth) {
  if (!list || !list.length) {
    return returnBoth ? { regexFree: [], regexes: [] } : [];
  }

  const regexes = [];
  const regexFree = [];

  regexFree.push(...list.filter((entry) => {
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
export function hasClass(element, className) {
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
export function addClass(element, className) {
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
export function removeClass(element, className) {
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
export function setAttribute(domElement, attributes = [], attributeValue) {
  if (!Array.isArray(attributes)) {
    attributes = [[attributes, attributeValue]];
  }

  attributes.forEach((attributeInfo) => {
    if (Array.isArray(attributeInfo) && attributeInfo[0] !== '') {
      domElement.setAttribute(...attributeInfo);
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
export function removeAttribute(domElement, attributesToRemove = []) {
  if (typeof attributesToRemove === 'string') {
    attributesToRemove = attributesToRemove.split(' ');

  } else if (attributesToRemove instanceof RegExp) {
    attributesToRemove = [attributesToRemove];
  }

  const {
    regexFree: stringAttributes,
    regexes: regexAttributes
  } = filterRegexes(attributesToRemove, true);

  stringAttributes.forEach((attributeNameToRemove) => {
    if (attributeNameToRemove !== '') {
      domElement.removeAttribute(attributeNameToRemove);
    }
  });

  regexAttributes.forEach((attributeRegex) => {
    domElement.getAttributeNames().forEach((attributeName) => {
      if (attributeRegex.test(attributeName)) {
        domElement.removeAttribute(attributeName);
      }
    });
  });
}

/**
 * @param {HTMLElement} element An element from the text is removed.
 */
export function removeTextNodes(element) {
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
export function empty(element) {
  let child;

  /* eslint-disable no-cond-assign */
  while (child = element.lastChild) {
    element.removeChild(child);
  }
}

export const HTML_CHARACTERS = /(<(.*)>|&(.*);)/;

/**
 * Insert content into element trying to avoid innerHTML method.
 *
 * @param {HTMLElement} element An element to write into.
 * @param {string} content The text to write.
 * @param {boolean} [sanitizeContent=true] If `true`, the content will be sanitized before writing to the element.
 */
export function fastInnerHTML(element, content, sanitizeContent = true) {
  if (HTML_CHARACTERS.test(content)) {
    element.innerHTML = sanitizeContent ? sanitize(content) : content;
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
export function fastInnerText(element, content) {
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
export function isVisible(element) {
  const documentElement = element.ownerDocument.documentElement;
  const windowElement = element.ownerDocument.defaultView;
  let next = element;

  while (next !== documentElement) { // until <html> reached
    if (next === null) { // parent detached from DOM
      return false;

    } else if (next.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      if (next.host) { // this is Web Components Shadow DOM
        // see: http://w3c.github.io/webcomponents/spec/shadow/#encapsulation
        // according to spec, should be if (next.ownerDocument !== window.document), but that doesn't work yet
        if (next.host.impl) { // Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features disabled
          return isVisible(next.host.impl);

        } else if (next.host) { // Chrome 33.0.1723.0 canary (2013-11-29) Web Platform features enabled
          return isVisible(next.host);
        }
        throw new Error('Lost in Web Components world');

      } else {
        return false; // this is a node detached from document in IE8
      }

    } else if (windowElement.getComputedStyle(next).display === 'none') {
      return false;
    }

    next = next.parentNode;
  }

  return true;
}

/**
 * Returns elements top and left offset relative to the document. Function is not compatible with jQuery offset.
 *
 * @param {HTMLElement} element An element to get the offset position from.
 * @returns {object} Returns object with `top` and `left` props.
 */
export function offset(element) {
  const rootDocument = element.ownerDocument;
  const rootWindow = rootDocument.defaultView;
  const documentElement = rootDocument.documentElement;
  let elementToCheck = element;
  let offsetLeft;
  let offsetTop;
  let lastElem;

  offsetLeft = elementToCheck.offsetLeft;
  offsetTop = elementToCheck.offsetTop;
  lastElem = elementToCheck;

  /* eslint-disable no-cond-assign */
  while (elementToCheck = elementToCheck.offsetParent) {
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
export function getWindowScrollTop(rootWindow = window) {
  return rootWindow.scrollY;
}

/**
 * Returns the document's scrollLeft property.
 *
 * @param {Window} [rootWindow] The document window owner.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
export function getWindowScrollLeft(rootWindow = window) {
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
export function getScrollTop(element, rootWindow = window) {
  if (element === rootWindow) {
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
export function getScrollLeft(element, rootWindow = window) {
  if (element === rootWindow) {
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
export function getScrollableElement(element) {
  let rootDocument = element.ownerDocument;
  let rootWindow = rootDocument ? rootDocument.defaultView : undefined;

  if (!rootDocument) {
    rootDocument = element.document ? element.document : element;
    rootWindow = rootDocument.defaultView;
  }

  const props = ['auto', 'scroll'];
  let el = element.parentNode;

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

    el = el.parentNode;
  }

  return rootWindow;
}

/**
 * Get the maximum available `scrollTop` value for the provided element.
 *
 * @param {HTMLElement} element The element to get the maximum scroll top value from.
 * @returns {number} The maximum scroll top value.
 */
export function getMaximumScrollTop(element) {
  return element.scrollHeight - element.clientHeight;
}

/**
 * Get the maximum available `scrollLeft` value for the provided element.
 *
 * @param {HTMLElement} element The element to get the maximum scroll left value from.
 * @returns {number} The maximum scroll left value.
 */
export function getMaximumScrollLeft(element) {
  return element.scrollWidth - element.clientWidth;
}

/**
 * Returns a DOM element responsible for trimming the provided element.
 *
 * @param {HTMLElement} base Base element.
 * @returns {HTMLElement} Base element's trimming parent.
 */
export function getTrimmingContainer(base) {
  const rootDocument = base.ownerDocument;
  const rootWindow = rootDocument.defaultView;

  let el = base.parentNode;

  while (el && el.style && rootDocument.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    }

    const computedStyle = rootWindow.getComputedStyle(el);
    const allowedProperties = ['scroll', 'hidden', 'auto'];
    const property = computedStyle.getPropertyValue('overflow');
    const propertyY = computedStyle.getPropertyValue('overflow-y');
    const propertyX = computedStyle.getPropertyValue('overflow-x');

    if (allowedProperties.includes(property) ||
        allowedProperties.includes(propertyY) ||
        allowedProperties.includes(propertyX)) {
      return el;
    }

    el = el.parentNode;
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
export function getStyle(element, prop, rootWindow = window) {
  if (!element) {
    return;

  } else if (element === rootWindow) {
    if (prop === 'width') {
      return `${rootWindow.innerWidth}px`;

    } else if (prop === 'height') {
      return `${rootWindow.innerHeight}px`;
    }

    return;
  }

  const styleProp = element.style[prop];

  if (styleProp !== '' && styleProp !== undefined) {
    return styleProp;
  }

  const computedStyle = rootWindow.getComputedStyle(element);

  if (computedStyle[prop] !== '' && computedStyle[prop] !== undefined) {
    return computedStyle[prop];
  }
}

/**
 * Verifies if element fit to provided CSSRule.
 *
 * @param {Element} element Element to verify with selector text.
 * @param {CSSRule} rule Selector text from CSSRule.
 * @returns {boolean}
 */
export function matchesCSSRules(element, rule) {
  const { selectorText } = rule;
  let result = false;

  if (rule.type === CSSRule.STYLE_RULE && selectorText) {
    if (element.msMatchesSelector) {
      result = element.msMatchesSelector(selectorText);

    } else if (element.matches) {
      result = element.matches(selectorText);
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
export function outerWidth(element) {
  return element.offsetWidth;
}

/**
 * Returns the element's outer height.
 *
 * @param {HTMLElement} element An element to get the height from.
 * @returns {number} Element's outer height.
 */
export function outerHeight(element) {
  return element.offsetHeight;
}

/**
 * Returns the element's inner height.
 *
 * @param {HTMLElement} element An element to get the height from.
 * @returns {number} Element's inner height.
 */
export function innerHeight(element) {
  return element.clientHeight || element.innerHeight;
}

/**
 * Returns the element's inner width.
 *
 * @param {HTMLElement} element An element to get the width from.
 * @returns {number} Element's inner width.
 */
export function innerWidth(element) {
  return element.clientWidth || element.innerWidth;
}

/**
 * @param {HTMLElement} element An element to which the event is added.
 * @param {string} event The event name.
 * @param {Function} callback The callback to add.
 */
export function addEvent(element, event, callback) {
  element.addEventListener(event, callback, false);
}

/**
 * @param {HTMLElement} element An element from which the event is removed.
 * @param {string} event The event name.
 * @param {Function} callback The function reference to remove.
 */
export function removeEvent(element, event, callback) {
  element.removeEventListener(event, callback, false);
}

/**
 * Returns caret position in text input.
 *
 * @author https://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @param {HTMLElement} el An element to check.
 * @returns {number}
 */
export function getCaretPosition(el) {
  if (el.selectionStart) {
    return el.selectionStart;
  }

  return 0;
}

/**
 * Returns end of the selection in text input.
 *
 * @param {HTMLElement} el An element to check.
 * @returns {number}
 */
export function getSelectionEndPosition(el) {
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
export function getSelectionText(rootWindow = window) {
  const rootDocument = rootWindow.document;
  let text = '';

  if (rootWindow.getSelection) {
    text = rootWindow.getSelection().toString();

  } else if (rootDocument.selection && rootDocument.selection.type !== 'Control') {
    text = rootDocument.selection.createRange().text;
  }

  return text;
}

/**
 * Cross-platform helper to clear text selection.
 *
 * @param {Window} [rootWindow] The document window owner.
 */
// eslint-disable-next-line no-restricted-globals
export function clearTextSelection(rootWindow = window) {
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
 * @param {Element} element An element to process.
 * @param {number} pos The selection start position.
 * @param {number} endPos The selection end position.
 */
export function setCaretPosition(element, pos, endPos) {
  if (endPos === undefined) {
    endPos = pos;
  }
  if (element.setSelectionRange) {
    element.focus();

    try {
      element.setSelectionRange(pos, endPos);
    } catch (err) {
      const elementParent = element.parentNode;
      const parentDisplayValue = elementParent.style.display;

      elementParent.style.display = 'block';
      element.setSelectionRange(pos, endPos);
      elementParent.style.display = parentDisplayValue;
    }
  }
}

let cachedScrollbarWidth;

/**
 * Helper to calculate scrollbar width.
 * Source: https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes.
 *
 * @private
 * @param {Document} rootDocument The onwer of the document.
 * @returns {number}
 */
// eslint-disable-next-line no-restricted-globals
function walkontableCalculateScrollbarWidth(rootDocument = document) {
  const inner = rootDocument.createElement('div');

  inner.style.height = '200px';
  inner.style.width = '100%';

  const outer = rootDocument.createElement('div');

  outer.style.boxSizing = 'content-box';
  outer.style.height = '150px';
  outer.style.left = '0px';
  outer.style.overflow = 'hidden';
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.width = '200px';
  outer.style.visibility = 'hidden';
  outer.appendChild(inner);

  (rootDocument.body || rootDocument.documentElement).appendChild(outer);
  const w1 = inner.offsetWidth;

  outer.style.overflow = 'scroll';
  let w2 = inner.offsetWidth;

  if (w1 === w2) {
    w2 = outer.clientWidth;
  }
  (rootDocument.body || rootDocument.documentElement).removeChild(outer);

  return (w1 - w2);
}

/**
 * Returns the computed width of the native browser scroll bar.
 *
 * @param {Document} [rootDocument] The owner of the document.
 * @returns {number} Width.
 */
// eslint-disable-next-line no-restricted-globals
export function getScrollbarWidth(rootDocument = document) {
  if (cachedScrollbarWidth === undefined) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth(rootDocument);
  }

  return cachedScrollbarWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement} element An element to check.
 * @returns {boolean}
 */
export function hasVerticalScrollbar(element) {
  return element.offsetWidth !== element.clientWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement} element An element to check.
 * @returns {boolean}
 */
export function hasHorizontalScrollbar(element) {
  return element.offsetHeight !== element.clientHeight;
}

/**
 * Sets overlay position depending on it's type and used browser.
 *
 * @param {HTMLElement} overlayElem An element to process.
 * @param {number|string} left The left position of the overlay.
 * @param {number|string} top The top position of the overlay.
 */
export function setOverlayPosition(overlayElem, left, top) {
  overlayElem.style.transform = `translate3d(${left},${top},0)`;
}

/**
 * @param {HTMLElement} element An element to process.
 * @returns {number|Array}
 */
export function getCssTransform(element) {
  let transform;

  if (element.style.transform && (transform = element.style.transform) !== '') {
    return ['transform', transform];
  }

  return -1;
}

/**
 * @param {HTMLElement} element An element to process.
 */
export function resetCssTransform(element) {
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
export function isInput(element) {
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
export function isOutsideInput(element) {
  return isInput(element) && element.hasAttribute('data-hot-input') === false;
}

/**
 * Check if the given DOM element can be focused (by using "select" method).
 *
 * @param {HTMLElement} element - DOM element.
 */
export function selectElementIfAllowed(element) {
  const activeElement = element.ownerDocument.activeElement;

  if (!isOutsideInput(activeElement)) {
    element.select();
  }
}

/**
 * Check if the provided element is detached from DOM.
 *
 * @param {HTMLElement} element HTML element to be checked.
 * @returns {boolean} `true` if the element is detached, `false` otherwise.
 */
export function isDetached(element) {
  return !element.parentNode;
}

/**
 * Set up an observer to recognize when the provided element first becomes visible and trigger a callback when it
 * happens.
 *
 * @param {HTMLElement} elementToBeObserved Element to be observed.
 * @param {Function} callback The callback function.
 */
export function observeVisibilityChangeOnce(elementToBeObserved, callback) {
  const visibilityObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && elementToBeObserved.offsetParent !== null) {
        callback();
        observer.unobserve(elementToBeObserved);
      }
    });
  }, {
    root: elementToBeObserved.ownerDocument.body
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
export function makeElementContentEditableAndSelectItsContent(element, invisibleSelection = true, ariaHidden = true) {
  const ownerDocument = element.ownerDocument;
  const range = ownerDocument.createRange();
  const sel = ownerDocument.defaultView.getSelection();

  setAttribute(element, 'contenteditable', true);

  if (ariaHidden) {
    setAttribute(element, ...A11Y_HIDDEN());
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
export function removeContentEditableFromElementAndDeselect(selectedElement, removeInvisibleSelectionClass = true) {
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
export function runWithSelectedContendEditableElement(element, callback, invisibleSelection = true) {
  makeElementContentEditableAndSelectItsContent(element, invisibleSelection);

  callback();

  removeContentEditableFromElementAndDeselect(element, invisibleSelection);
}
