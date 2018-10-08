import { isIE8, isIE9, isSafari } from '../browser';
import { hasCaptionProblem } from '../feature';

/**
 * Get the parent of the specified node in the DOM tree.
 *
 * @param  {HTMLElement} element Element from which traversing is started.
 * @param  {Number} [level=0] Traversing deep level.
 * @return {HTMLElement|null}
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
 * Goes up the DOM tree (including given element) until it finds an element that matches the nodes or nodes name.
 * This method goes up through web components.
 *
 * @param {HTMLElement} element Element from which traversing is started
 * @param {Array} nodes Array of elements or Array of elements name
 * @param {HTMLElement} [until]
 * @returns {HTMLElement|null}
 */
export function closest(element, nodes, until) {
  let elementToCheck = element;

  while (elementToCheck !== null && elementToCheck !== until) {
    if (elementToCheck.nodeType === Node.ELEMENT_NODE && (nodes.indexOf(elementToCheck.nodeName) > -1 || nodes.indexOf(elementToCheck) > -1)) {
      return elementToCheck;
    }
    if (elementToCheck.host && elementToCheck.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
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
    queriedParents = Array.prototype.slice.call(document.querySelectorAll(parent), 0);
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
 * @return {Number}
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
 * @returns {boolean}
 */
export function overlayContainsElement(overlayType, element) {
  const overlayElement = document.querySelector(`.ht_clone_${overlayType}`);
  return overlayElement ? overlayElement.contains(element) : null;
}

const classListSupport = !!document.documentElement.classList;
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

if (classListSupport) {
  const isSupportMultipleClassesArg = (function() {
    const element = document.createElement('div');

    element.classList.add('test', 'test2');

    return element.classList.contains('test2');
  }());

  _hasClass = function(element, className) {
    if (element.classList === void 0 || typeof className !== 'string' || className === '') {
      return false;
    }

    return element.classList.contains(className);
  };

  _addClass = function(element, classes) {
    let className = classes;

    if (typeof className === 'string') {
      className = className.split(' ');
    }

    className = filterEmptyClassNames(className);

    if (className.length > 0) {
      if (isSupportMultipleClassesArg) {
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
 * @return {void}
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
 * @return {void}
 */

const textContextSupport = !!document.createTextNode('test').textContent;

export function fastInnerText(element, content) {
  const child = element.firstChild;

  if (child && child.nodeType === 3 && child.nextSibling === null) {
    // fast lane - replace existing text node

    if (textContextSupport) {
      // http://jsperf.com/replace-text-vs-reuse
      child.textContent = content;
    } else {
      // http://jsperf.com/replace-text-vs-reuse
      child.data = content;
    }
  } else {
    // slow lane - empty element and insert a text node
    empty(element);
    element.appendChild(document.createTextNode(content));
  }
}

/**
 * Returns true if element is attached to the DOM and visible, false otherwise
 * @param elem
 * @returns {boolean}
 */
export function isVisible(elem) {
  let next = elem;

  while (polymerUnwrap(next) !== document.documentElement) { // until <html> reached
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
    } else if (next.style.display === 'none') {
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
 * @return {Object} Returns object with `top` and `left` props
 */
export function offset(elem) {
  const docElem = document.documentElement;
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
      top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
      left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
    };
  }
  offsetLeft = elementToCheck.offsetLeft;
  offsetTop = elementToCheck.offsetTop;
  lastElem = elementToCheck;

  /* eslint-disable no-cond-assign */
  while (elementToCheck = elementToCheck.offsetParent) {
    // from my observation, document.body always has scrollLeft/scrollTop == 0
    if (elementToCheck === document.body) {
      break;
    }
    offsetLeft += elementToCheck.offsetLeft;
    offsetTop += elementToCheck.offsetTop;
    lastElem = elementToCheck;
  }

  // slow - http://jsperf.com/offset-vs-getboundingclientrect/6
  if (lastElem && lastElem.style.position === 'fixed') {
    // if(lastElem !== document.body) { //faster but does gives false positive in Firefox
    offsetLeft += window.pageXOffset || docElem.scrollLeft;
    offsetTop += window.pageYOffset || docElem.scrollTop;
  }

  return {
    left: offsetLeft,
    top: offsetTop
  };
}

/**
 * Returns the document's scrollTop property.
 *
 * @returns {Number}
 */
export function getWindowScrollTop() {
  let res = window.scrollY;

  if (res === void 0) { // IE8-11
    res = document.documentElement.scrollTop;
  }

  return res;
}

/**
 * Returns the document's scrollLeft property.
 *
 * @returns {Number}
 */
export function getWindowScrollLeft() {
  let res = window.scrollX;

  if (res === void 0) { // IE8-11
    res = document.documentElement.scrollLeft;
  }

  return res;
}

/**
 * Returns the provided element's scrollTop property.
 *
 * @param element
 * @returns {Number}
 */
export function getScrollTop(element) {
  if (element === window) {
    return getWindowScrollTop();
  }
  return element.scrollTop;

}

/**
 * Returns the provided element's scrollLeft property.
 *
 * @param element
 * @returns {Number}
 */
export function getScrollLeft(element) {
  if (element === window) {
    return getWindowScrollLeft();
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
  const props = ['auto', 'scroll'];
  let el = element.parentNode;
  let overflow;
  let overflowX;
  let overflowY;
  let computedStyle = '';
  let computedOverflow = '';
  let computedOverflowY = '';
  let computedOverflowX = '';

  while (el && el.style && document.body !== el) {
    overflow = el.style.overflow;
    overflowX = el.style.overflowX;
    overflowY = el.style.overflowY;

    if (overflow === 'scroll' || overflowX === 'scroll' || overflowY === 'scroll') {
      return el;

    } else if (window.getComputedStyle) {
      computedStyle = window.getComputedStyle(el);
      computedOverflow = computedStyle.getPropertyValue('overflow');
      computedOverflowY = computedStyle.getPropertyValue('overflow-y');
      computedOverflowX = computedStyle.getPropertyValue('overflow-x');

      if (computedOverflow === 'scroll' || computedOverflowX === 'scroll' || computedOverflowY === 'scroll') {
        return el;
      }
    }

    // The '+ 1' after the scrollHeight/scrollWidth is to prevent problems with zoomed out Chrome.
    if (el.clientHeight <= el.scrollHeight + 1 && (props.indexOf(overflowY) !== -1 || props.indexOf(overflow) !== -1 ||
        props.indexOf(computedOverflow) !== -1 || props.indexOf(computedOverflowY) !== -1)) {
      return el;
    }
    if (el.clientWidth <= el.scrollWidth + 1 && (props.indexOf(overflowX) !== -1 || props.indexOf(overflow) !== -1 ||
        props.indexOf(computedOverflow) !== -1 || props.indexOf(computedOverflowX) !== -1)) {
      return el;
    }
    el = el.parentNode;
  }

  return window;
}

/**
 * Returns a DOM element responsible for trimming the provided element.
 *
 * @param {HTMLElement} base Base element
 * @returns {HTMLElement} Base element's trimming parent
 */
export function getTrimmingContainer(base) {
  let el = base.parentNode;

  while (el && el.style && document.body !== el) {
    if (el.style.overflow !== 'visible' && el.style.overflow !== '') {
      return el;

    } else if (window.getComputedStyle) {
      const computedStyle = window.getComputedStyle(el);

      if (computedStyle.getPropertyValue('overflow') !== 'visible' && computedStyle.getPropertyValue('overflow') !== '') {
        return el;
      }
    }

    el = el.parentNode;
  }

  return window;
}

/**
 * Returns a style property for the provided element. (Be it an inline or external style).
 *
 * @param {HTMLElement} element
 * @param {String} prop Wanted property
 * @returns {String|undefined} Element's style property
 */
export function getStyle(element, prop) {
  /* eslint-disable */
  if (!element) {
    return;

  } else if (element === window) {
    if (prop === 'width') {
      return window.innerWidth + 'px';

    } else if (prop === 'height') {
      return window.innerHeight + 'px';
    }

    return;
  }

  var
    styleProp = element.style[prop],
    computedStyle;

  if (styleProp !== '' && styleProp !== void 0) {
    return styleProp;

  } else {
    computedStyle = getComputedStyle(element);

    if (computedStyle[prop] !== '' && computedStyle[prop] !== void 0) {
      return computedStyle[prop];
    }
  }
}

/**
 * Returns a computed style object for the provided element. (Needed if style is declared in external stylesheet).
 *
 * @param element
 * @returns {IEElementStyle|CssStyle} Elements computed style object
 */
export function getComputedStyle(element) {
  return element.currentStyle || document.defaultView.getComputedStyle(element);
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
  if (window.addEventListener) {
    element.addEventListener(event, callback, false);
  } else {
    element.attachEvent('on' + event, callback);
  }
}

export function removeEvent(element, event, callback) {
  if (window.removeEventListener) {
    element.removeEventListener(event, callback, false);
  } else {
    element.detachEvent('on' + event, callback);
  }
}

/**
 * Returns caret position in text input
 *
 * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
 * @return {Number}
 */
export function getCaretPosition(el) {
  if (el.selectionStart) {
    return el.selectionStart;

  } else if (document.selection) { // IE8
    el.focus();

    let r = document.selection.createRange();

    if (r == null) {
      return 0;
    }
    let re = el.createTextRange();
    let rc = re.duplicate();

    re.moveToBookmark(r.getBookmark());
    rc.setEndPoint('EndToStart', re);

    return rc.text.length;
  }

  return 0;
}

/**
 * Returns end of the selection in text input
 *
 * @return {Number}
 */
export function getSelectionEndPosition(el) {
  if (el.selectionEnd) {
    return el.selectionEnd;

  } else if (document.selection) { // IE8
    let r = document.selection.createRange();

    if (r == null) {
      return 0;
    }
    let re = el.createTextRange();

    return re.text.indexOf(r.text) + r.text.length;
  }

  return 0;
}

/**
 * Returns text under selection.
 *
 * @returns {String}
 */
export function getSelectionText() {
  let text = '';

  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== 'Control') {
    text = document.selection.createRange().text;
  }

  return text;
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

var cachedScrollbarWidth;

// http://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
function walkontableCalculateScrollbarWidth() {
  const inner = document.createElement('div');
  inner.style.height = '200px';
  inner.style.width = '100%';

  const outer = document.createElement('div');
  outer.style.boxSizing = 'content-box';
  outer.style.height = '150px';
  outer.style.left = '0px';
  outer.style.overflow = 'hidden';
  outer.style.position = 'absolute';
  outer.style.top = '0px';
  outer.style.width = '200px';
  outer.style.visibility = 'hidden';
  outer.appendChild(inner);

  (document.body || document.documentElement).appendChild(outer);
  const w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  let w2 = inner.offsetWidth;
  if (w1 == w2) {
    w2 = outer.clientWidth;
  }

  (document.body || document.documentElement).removeChild(outer);

  return (w1 - w2);
}

/**
 * Returns the computed width of the native browser scroll bar.
 *
 * @return {Number} width
 */
export function getScrollbarWidth() {
  if (cachedScrollbarWidth === void 0) {
    cachedScrollbarWidth = walkontableCalculateScrollbarWidth();
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
    overlayElem.style['-webkit-transform'] = 'translate3d(' + left + ',' + top + ',0)';
  } else {
    overlayElem.style.transform = 'translate3d(' + left + ',' + top + ',0)';
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
  return isInput(element) && element.className.indexOf('handsontableInput') == -1 && element.className.indexOf('copyPaste') == -1;
}
