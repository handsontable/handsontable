import { isIE8, isIE9, isSafari } from '../browser';
import {
  hasCaptionProblem,
  isClassListSupported,
  isTextContentSupported,
  isGetComputedStyleSupported,
} from '../feature';

/**
 * Get the parent of the specified node in the DOM tree.
 *
 * @param  {HTMLElement} element Element from which traversing is started.
 * @param  {Number} [level=0] Traversing deep level.
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
 * @param {Window} frame Frame from which should be get frameElement in safe way.
 * @returns {Window|null}
 */
export function getParentWindow(frame) {
  return getFrameElement(frame) && frame.parent;
}

/**
 * Checks if script has access to read from parent frame of specified frame.

 * @param {Window} frame Frame from which should be get frameElement in safe way.
 */
export function hasAccessToParentWindow(frame) {
  return !!Object.getPrototypeOf(frame.parent);
}

/**
 * Goes up the DOM tree (including given element) until it finds an parent element that matches the nodes or nodes name.
 * This method goes up through web components.
 *
 * @param {Node} element Element from which traversing is started.
 * @param {(string | Node)[]} [nodes] Array of elements or Array of elements name (in uppercase form).
 * @param {Node} [until] The element until the traversing ends.
 * @returns {Node|null}
 */
export function closest(element, nodes = [], until) {
  const { ELEMENT_NODE, DOCUMENT_FRAGMENT_NODE } = Node;
  let elementToCheck = element;

  while (elementToCheck !== null && elementToCheck !== void 0 && elementToCheck !== until) {
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
 * @param {HTMLElement} element Element from which traversing is started
 * @param {Array} nodes Array of elements or Array of elements name
 * @param {HTMLElement} [until]
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
 * Goes up the DOM tree and checks if element is child of another element.
 *
 * @param child Child element
 * @param {Object|String} parent Parent element OR selector of the parent element.
 *                               If string provided, function returns `true` for the first occurrence of element with that class.
 * @returns {Boolean}
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
 * Check if an element is part of `hot-table` web component.
 *
 * @param {Element} element
 * @returns {Boolean}
 */
export function isChildOfWebComponentTable(element) {
  const hotTableName = 'hot-table';
  let result = false;
  let parentNode = polymerWrap(element);

  function isHotTable(testElement) {
    return testElement.nodeType === Node.ELEMENT_NODE && testElement.nodeName === hotTableName.toUpperCase();
  }

  while (parentNode !== null) {
    if (isHotTable(parentNode)) {
      result = true;
      break;
    } else if (parentNode.host && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      result = isHotTable(parentNode.host);

      if (result) {
        break;
      }
      parentNode = parentNode.host;
    }
    parentNode = parentNode.parentNode;
  }

  return result;
}

/* global Polymer wrap unwrap */

/**
 * Wrap element into polymer/webcomponent container if exists
 *
 * @param element
 * @returns {*}
 */
export function polymerWrap(element) {
  return typeof Polymer !== 'undefined' && typeof wrap === 'function' ? wrap(element) : element;
}

/**
 * Unwrap element from polymer/webcomponent container if exists
 *
 * @param element
 * @returns {*}
 */
export function polymerUnwrap(element) {
  return typeof Polymer !== 'undefined' && typeof unwrap === 'function' ? unwrap(element) : element;
}

/**
 * Counts index of element within its parent
 * WARNING: for performance reasons, assumes there are only element nodes (no text nodes). This is true for Walkotnable
 * Otherwise would need to check for nodeType or use previousElementSibling
 *
 * @see http://jsperf.com/sibling-index/10
 * @param {Element} element
 * @returns {Number}
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
 * Check if the provided overlay contains the provided element
 *
 * @param {String} overlay
 * @param {HTMLElement} element
 * @param {HTMLElement} root
 * @returns {boolean}
 */
export function overlayContainsElement(overlayType, element, root) {
  const overlayElement = root.parentElement.querySelector(`.ht_clone_${overlayType}`);
  return overlayElement ? overlayElement.contains(element) : null;
}

let _hasClass;
let _addClass;
let _removeClass;

function filterEmptyClassNames(classNames) {
  const result = [];

  if (!classNames || !classNames.length) {
    return result;
  }

  let len = 0;

  while (classNames[len]) {
    result.push(classNames[len]);
    len += 1;
  }

  return result;
}

if (isClassListSupported()) {
  const isSupportMultipleClassesArg = function(rootDocument) {
    const element = rootDocument.createElement('div');

    element.classList.add('test', 'test2');

    return element.classList.contains('test2');
  };

  _hasClass = function(element, className) {
    if (element.classList === void 0 || typeof className !== 'string' || className === '') {
      return false;
    }

    return element.classList.contains(className);
  };

  _addClass = function(element, classes) {
    const rootDocument = element.ownerDocument;
    let className = classes;

    if (typeof className === 'string') {
      className = className.split(' ');
    }

    className = filterEmptyClassNames(className);

    if (className.length > 0) {
      if (isSupportMultipleClassesArg(rootDocument)) {
        element.classList.add(...className);

      } else {
        let len = 0;

        while (className && className[len]) {
          element.classList.add(className[len]);
          len += 1;
        }
      }
    }
  };

  _removeClass = function(element, classes) {
    let className = classes;

    if (typeof className === 'string') {
      className = className.split(' ');
    }

    className = filterEmptyClassNames(className);

    if (className.length > 0) {
      if (isSupportMultipleClassesArg) {
        element.classList.remove(...className);

      } else {
        let len = 0;

        while (className && className[len]) {
          element.classList.remove(className[len]);
          len += 1;
        }
      }
    }
  };

} else {
  const createClassNameRegExp = function(className) {
    return new RegExp(`(\\s|^)${className}(\\s|$)`);
  };

  _hasClass = function(element, className) {
    // http://snipplr.com/view/3561/addclass-removeclass-hasclass/
    return element.className !== void 0 && createClassNameRegExp(className).test(element.className);
  };

  _addClass = function(element, classes) {
    let len = 0;
    let _className = element.className;
    let className = classes;

    if (typeof className === 'string') {
      className = className.split(' ');
    }
    if (_className === '') {
      _className = className.join(' ');

    } else {
      while (className && className[len]) {
        if (!createClassNameRegExp(className[len]).test(_className)) {
          _className += ` ${className[len]}`;
        }
        len += 1;
      }
    }
    element.className = _className;
  };

  _removeClass = function(element, classes) {
    let len = 0;
    let _className = element.className;
    let className = classes;

    if (typeof className === 'string') {
      className = className.split(' ');
    }
    while (className && className[len]) {
      // String.prototype.trim is defined in polyfill.js
      _className = _className.replace(createClassNameRegExp(className[len]), ' ').trim();
      len += 1;
    }
    if (element.className !== _className) {
      element.className = _className;
    }
  };
}

/**
 * Checks if element has class name
 *
 * @param {HTMLElement} element
 * @param {String} className Class name to check
 * @returns {Boolean}
 */
export function hasClass(element, className) {
  return _hasClass(element, className);
}

/**
 * Add class name to an element
 *
 * @param {HTMLElement} element
 * @param {String|Array} className Class name as string or array of strings
 */
export function addClass(element, className) {
  return _addClass(element, className);
}

/**
 * Remove class name from an element
 *
 * @param {HTMLElement} element
 * @param {String|Array} className Class name as string or array of strings
 */
export function removeClass(element, className) {
  return _removeClass(element, className);
}

export function removeTextNodes(element, parent) {
  if (element.nodeType === 3) {
    parent.removeChild(element); // bye text nodes!

  } else if (['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'].indexOf(element.nodeName) > -1) {
    const childs = element.childNodes;
    for (let i = childs.length - 1; i >= 0; i--) {
      removeTextNodes(childs[i], element);
    }
  }
}

/**
 * Remove childs function
 * WARNING - this doesn't unload events and data attached by jQuery
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/9
 * http://jsperf.com/jquery-html-vs-empty-vs-innerhtml/11 - no siginificant improvement with Chrome remove() method
 *
 * @param element
 * @returns {void}
 */
//
export function empty(element) {
  let child;
  /* eslint-disable no-cond-assign */
  while (child = element.lastChild) {
    element.removeChild(child);
  }
}

export const HTML_CHARACTERS = /(<(.*)>|&(.*);)/;

/**
 * Insert content into element trying avoid innerHTML method.
 * @returns {void}
 */
export function fastInnerHTML(element, content) {
  if (HTML_CHARACTERS.test(content)) {
    element.innerHTML = content;
  } else {
    fastInnerText(element, content);
  }
}

/**
 * Insert text content into element
 * @returns {Boolean}
 */
export function fastInnerText(element, content) {
  const child = element.firstChild;

  if (child && child.nodeType === 3 && child.nextSibling === null) {
    // fast lane - replace existing text node

    if (isTextContentSupported) {
      // http://jsperf.com/replace-text-vs-reuse
      child.textContent = content;
    } else {
      // http://jsperf.com/replace-text-vs-reuse
      child.data = content;
    }
  } else {
    // slow lane - empty element and insert a text node
    empty(element);
    element.appendChild(element.ownerDocument.createTextNode(content));
  }
}

/**
 * Returns true if element is attached to the DOM and visible, false otherwise
 * @param elem
 * @returns {boolean}
 */
export function isVisible(elem) {
  const documentElement = elem.ownerDocument.documentElement;
  let next = elem;

  while (polymerUnwrap(next) !== documentElement) { // until <html> reached
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

    } else if (next.style && next.style.display === 'none') {
      return false;
    }

    next = next.parentNode;
  }

  return true;
}

/**
 * Returns elements top and left offset relative to the document. Function is not compatible with jQuery offset.
 *
 * @param {HTMLElement} elem
 * @returns {Object} Returns object with `top` and `left` props
 */
export function offset(elem) {
  const rootDocument = elem.ownerDocument;
  const rootWindow = rootDocument.defaultView;
  const documentElement = rootDocument.documentElement;
  let elementToCheck = elem;
  let offsetLeft;
  let offsetTop;
  let lastElem;
  let box;

  if (hasCaptionProblem() && elementToCheck.firstChild && elementToCheck.firstChild.nodeName === 'CAPTION') {
    // fixes problem with Firefox ignoring <caption> in TABLE offset (see also export outerHeight)
    // http://jsperf.com/offset-vs-getboundingclientrect/8
    box = elementToCheck.getBoundingClientRect();

    return {
      top: box.top + (rootWindow.pageYOffset || documentElement.scrollTop) - (documentElement.clientTop || 0),
      left: box.left + (rootWindow.pageXOffset || documentElement.scrollLeft) - (documentElement.clientLeft || 0)
    };
  }
  offsetLeft = elementToCheck.offsetLeft;
  offsetTop = elementToCheck.offsetTop;
  lastElem = elementToCheck;

  /* eslint-disable no-cond-assign */
  while (elementToCheck = elementToCheck.offsetParent) {
    // from my observation, document.body always has scrollLeft/scrollTop == 0
    if (elementToCheck === rootDocument.body) {
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
 * @param {Window} rootWindow
 * @returns {Number}
 */
// eslint-disable-next-line no-restricted-globals
export function getWindowScrollTop(rootWindow = window) {
  let res = rootWindow.scrollY;

  if (res === void 0) { // IE8-11
    res = rootWindow.document.documentElement.scrollTop;
  }

  return res;
}

/**
 * Returns the document's scrollLeft property.
 *
 * @param {Window} rootWindow
 * @returns {Number}
 */
// eslint-disable-next-line no-restricted-globals
export function getWindowScrollLeft(rootWindow = window) {
  let res = rootWindow.scrollX;

  if (res === void 0) { // IE8-11
    res = rootWindow.document.documentElement.scrollLeft;
  }

  return res;
}

/**
 * Returns the provided element's scrollTop property.
 *
 * @param element
 * @param {Window} rootWindow
 * @returns {Number}
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
 * @param element
 * @param {Window} rootWindow
 * @returns {Number}
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
 * @param {HTMLElement} element
 * @returns {HTMLElement} Element's scrollable parent
 */
export function getScrollableElement(element) {
  let rootDocument = element.ownerDocument;
  let rootWindow = rootDocument ? rootDocument.defaultView : void 0;

  if (!rootDocument) {
    rootDocument = element.document ? element.document : element;
    rootWindow = rootDocument.defaultView;
  }

  const props = ['auto', 'scroll'];
  const supportedGetComputedStyle = isGetComputedStyleSupported();
  let el = element.parentNode;

  while (el && el.style && rootDocument.body !== el) {
    let { overflow, overflowX, overflowY } = el.style;

    if ([overflow, overflowX, overflowY].includes('scroll')) {
      return el;

    } else if (supportedGetComputedStyle) {
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
 * Returns a DOM element responsible for trimming the provided element.
 *
 * @param {HTMLElement} base Base element
 * @returns {HTMLElement} Base element's trimming parent
 */
export function getTrimmingContainer(base) {
  const rootDocument = base.ownerDocument;
  const rootWindow = rootDocument.defaultView;

  let el = base.parentNode;

  while (el && el.style && rootDocument.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;
    }

    const computedStyle = getComputedStyle(el, rootWindow);
    const allowedProperties = ['scroll', 'hidden', 'auto'];
    const property = computedStyle.getPropertyValue('overflow');
    const propertyY = computedStyle.getPropertyValue('overflow-y');
    const propertyX = computedStyle.getPropertyValue('overflow-x');

    if (allowedProperties.includes(property) || allowedProperties.includes(propertyY) || allowedProperties.includes(propertyX)) {
      return el;
    }

    el = el.parentNode;
  }

  return rootWindow;
}

/**
 * Returns a style property for the provided element. (Be it an inline or external style).
 *
 * @param {HTMLElement} element
 * @param {String} prop Wanted property
 * @param {Window} rootWindow
 * @returns {String|undefined} Element's style property
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

  if (styleProp !== '' && styleProp !== void 0) {
    return styleProp;
  }

  const computedStyle = getComputedStyle(element, rootWindow);

  if (computedStyle[prop] !== '' && computedStyle[prop] !== void 0) {
    return computedStyle[prop];
  }
}

/**
 * Verifies if element fit to provided CSSRule.
 *
 * @param {Element} element Element to verify with selector text.
 * @param {CSSRule} rule Selector text from CSSRule.
 * @returns {Boolean}
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
 * Returns a computed style object for the provided element. (Needed if style is declared in external stylesheet).
 *
 * @param element
 * @param {Window} rootWindow
 * @returns {IEElementStyle|CssStyle} Elements computed style object
 */
// eslint-disable-next-line no-restricted-globals
export function getComputedStyle(element, rootWindow = window) {
  return element.currentStyle || rootWindow.getComputedStyle(element);
}

/**
 * Returns the element's outer width.
 *
 * @param element
 * @returns {number} Element's outer width
 */
export function outerWidth(element) {
  return element.offsetWidth;
}

/**
 * Returns the element's outer height
 *
 * @param elem
 * @returns {number} Element's outer height
 */
export function outerHeight(elem) {
  if (hasCaptionProblem() && elem.firstChild && elem.firstChild.nodeName === 'CAPTION') {
    // fixes problem with Firefox ignoring <caption> in TABLE.offsetHeight
    // jQuery (1.10.1) still has this unsolved
    // may be better to just switch to getBoundingClientRect
    // http://bililite.com/blog/2009/03/27/finding-the-size-of-a-table/
    // http://lists.w3.org/Archives/Public/www-style/2009Oct/0089.html
    // http://bugs.jquery.com/ticket/2196
    // http://lists.w3.org/Archives/Public/www-style/2009Oct/0140.html#start140
    return elem.offsetHeight + elem.firstChild.offsetHeight;
  }

  return elem.offsetHeight;
}

/**
 * Returns the element's inner height.
 *
 * @param element
 * @returns {number} Element's inner height
 */
export function innerHeight(element) {
  return element.clientHeight || element.innerHeight;
}

/**
 * Returns the element's inner width.
 *
 * @param element
 * @returns {number} Element's inner width
 */
export function innerWidth(element) {
  return element.clientWidth || element.innerWidth;
}

export function addEvent(element, event, callback) {
  let rootWindow = element.defaultView;

  if (!rootWindow) {
    rootWindow = element.document ? element : element.ownerDocument.defaultView;
  }

  if (rootWindow.addEventListener) {
    element.addEventListener(event, callback, false);
  } else {
    element.attachEvent(`on${event}`, callback);
  }
}

export function removeEvent(element, event, callback) {
  let rootWindow = element.defaultView;

  if (!rootWindow) {
    rootWindow = element.document ? element : element.ownerDocument.defaultView;
  }

  if (rootWindow.removeEventListener) {
    element.removeEventListener(event, callback, false);
  } else {
    element.detachEvent(`on${event}`, callback);
  }
}

/**
 * Returns caret position in text input
 *
 * @author https://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @returns {Number}
 */
export function getCaretPosition(el) {
  const rootDocument = el.ownerDocument;

  if (el.selectionStart) {
    return el.selectionStart;

  } else if (rootDocument.selection) { // IE8
    el.focus();

    const r = rootDocument.selection.createRange();

    if (r === null) {
      return 0;
    }
    const re = el.createTextRange();
    const rc = re.duplicate();

    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);

    return rc.text.length;
  }

  return 0;
}

/**
 * Returns end of the selection in text input
 *
 * @returns {Number}
 */
export function getSelectionEndPosition(el) {
  const rootDocument = el.ownerDocument;

  if (el.selectionEnd) {
    return el.selectionEnd;

  } else if (rootDocument.selection) { // IE8
    const r = rootDocument.selection.createRange();

    if (r === null) {
      return 0;
    }

    const re = el.createTextRange();

    return re.text.indexOf(r.text) + r.text.length;
  }

  return 0;
}

/**
 * Returns text under selection.
 *
 * @param {Window} rootWindow
 * @returns {String}
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
 * @param {Window} rootWindow
 */
// eslint-disable-next-line no-restricted-globals
export function clearTextSelection(rootWindow = window) {
  const rootDocument = rootWindow.document;
  // http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
  if (rootWindow.getSelection) {
    if (rootWindow.getSelection().empty) { // Chrome
      rootWindow.getSelection().empty();
    } else if (rootWindow.getSelection().removeAllRanges) { // Firefox
      rootWindow.getSelection().removeAllRanges();
    }
  } else if (rootDocument.selection) { // IE?
    rootDocument.selection.empty();
  }
}

/**
 * Sets caret position in text input.
 *
 * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
 * @param {Element} element
 * @param {Number} pos
 * @param {Number} endPos
 */
export function setCaretPosition(element, pos, endPos) {
  if (endPos === void 0) {
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
  } else if (element.createTextRange) { // IE8
    const range = element.createTextRange();
    range.collapse(true);
    range.moveEnd('character', endPos);
    range.moveStart('character', pos);
    range.select();
  }
}

let cachedScrollbarWidth;

/**
 * Helper to calculate scrollbar width.
 * Source: https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
 *
 * @private
 * @param {Document} rootDocument
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
 * @param {Document} rootDocument
 * @returns {Number} width
 */
// eslint-disable-next-line no-restricted-globals
export function getScrollbarWidth(rootDocument = document) {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth(rootDocument);
  }

  return cachedScrollbarWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement} element
 * @returns {Boolean}
 */
export function hasVerticalScrollbar(element) {
  return element.offsetWidth !== element.clientWidth;
}

/**
 * Checks if the provided element has a vertical scrollbar.
 *
 * @param {HTMLElement} element
 * @returns {Boolean}
 */
export function hasHorizontalScrollbar(element) {
  return element.offsetHeight !== element.clientHeight;
}

/**
 * Sets overlay position depending on it's type and used browser
 */
export function setOverlayPosition(overlayElem, left, top) {
  if (isIE8() || isIE9()) {
    overlayElem.style.top = top;
    overlayElem.style.left = left;
  } else if (isSafari()) {
    overlayElem.style['-webkit-transform'] = `translate3d(${left},${top},0)`;
    overlayElem.style['-webkit-transform'] = `translate3d(${left},${top},0)`;
  } else {
    overlayElem.style.transform = `translate3d(${left},${top},0)`;
  }
}

export function getCssTransform(element) {
  let transform;

  if (element.style.transform && (transform = element.style.transform) !== '') {
    return ['transform', transform];

  } else if (element.style['-webkit-transform'] && (transform = element.style['-webkit-transform']) !== '') {

    return ['-webkit-transform', transform];
  }

  return -1;
}

export function resetCssTransform(element) {
  if (element.style.transform && element.style.transform !== '') {
    element.style.transform = '';
  } else if (element.style['-webkit-transform'] && element.style['-webkit-transform'] !== '') {
    element.style['-webkit-transform'] = '';
  }
}

/**
 * Determines if the given DOM element is an input field.
 * Notice: By 'input' we mean input, textarea and select nodes
 *
 * @param {HTMLElement} element - DOM element
 * @returns {Boolean}
 */
export function isInput(element) {
  const inputs = ['INPUT', 'SELECT', 'TEXTAREA'];

  return element && (inputs.indexOf(element.nodeName) > -1 || element.contentEditable === 'true');
}

/**
 * Determines if the given DOM element is an input field placed OUTSIDE of HOT.
 * Notice: By 'input' we mean input, textarea and select nodes
 *
 * @param {HTMLElement} element - DOM element
 * @returns {Boolean}
 */
export function isOutsideInput(element) {
  return isInput(element) && element.className.indexOf('handsontableInput') === -1 && element.className.indexOf('HandsontableCopyPaste') === -1;
}

/**
 * Check if the given DOM element can be focused (by using "select" method).
 *
 * @param {HTMLElement} element - DOM element
 */
export function selectElementIfAllowed(element) {
  const activeElement = element.ownerDocument.activeElement;

  if (!isOutsideInput(activeElement)) {
    element.select();
  }
}
