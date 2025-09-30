/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * Visibility rules:
 * - 'spec' mode: display:none, visibility:hidden|collapse, hidden, [inert], closed <details> (except its <summary>).
 * - 'strict' mode also requires: has a layout box, opacity != 0, pointer-events != none, content-visibility: visible.
 */
const VISIBILITY_MODE = 'spec';

/**
 * The variable keeps the reference to the last focused element. The difference between this
 * and `document.activeElement` is that the second can be changed by code (e.g. by calling `blur()` which changes
 * active element to the body) where in fact the focus position even after changing by `blur()` call is stored
 * by the browser so hitting the Tab key would continue focus traversal from the last focused element.
 */
let activeElement = document.body;

document.addEventListener('focusin', (event) => {
  activeElement = event.target;
});

/**
 * Gets the next focusable element. If shift is true, gets the previous focusable element,
 * otherwise gets the next focusable element.
 *
 * @param {boolean} shift If true, gets the previous focusable element, otherwise gets the next focusable element.
 * @returns {HTMLElement}
 */
export function getNextFocusableElement(shift = false) {
  const from = document.activeElement === document.body ? activeElement : document.activeElement;
  const result = findNextFocusableInDOM(from, shift) ?? document.body;

  return result;
}

/**
 * Finds the next or previous focusable element in DOM order starting from the given element.
 *
 * @param {HTMLElement} element The element to start searching from.
 * @param {boolean} shift If true, finds the previous focusable element, otherwise finds the next.
 * @returns {HTMLElement|null} The next/previous focusable element in DOM order, or null if not found.
 */
function findNextFocusableInDOM(element, shift = false) {
  // Get all elements in DOM order
  const allElements = [];
  const walker = document.createTreeWalker(
    document,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  let node = walker.nextNode();

  while (node) {
    allElements.push(node);

    node = walker.nextNode();
  }

  const currentIndex = allElements.indexOf(element);

  if (currentIndex === -1) {
    return shift ? findLastFocusableElement(allElements) : findFirstFocusableElement(allElements);
  }

  if (shift) {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (isTabStop(allElements[i])) {
        return allElements[i];
      }
    }

    return findLastFocusableElement(allElements);
  }

  for (let i = currentIndex + 1; i < allElements.length; i++) {
    if (isTabStop(allElements[i])) {
      return allElements[i];
    }
  }

  return findFirstFocusableElement(allElements);
}

/**
 * Finds the first focusable element in the given array.
 *
 * @param {HTMLElement[]} elements Array of elements to search through.
 * @returns {HTMLElement|null} The first focusable element, or null if not found.
 */
function findFirstFocusableElement(elements) {
  for (const element of elements) {
    if (isTabStop(element)) {
      return element;
    }
  }

  return null;
}

/**
 * Finds the last focusable element in the given array.
 *
 * @param {HTMLElement[]} elements Array of elements to search through.
 * @returns {HTMLElement|null} The last focusable element, or null if not found.
 */
function findLastFocusableElement(elements) {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (isTabStop(elements[i])) {
      return elements[i];
    }
  }

  return null;
}

/**
 * Gets the tabindex attribute of the element.
 *
 * @param {HTMLElement} element The element to get the tabindex attribute of.
 * @returns {number|null} The tabindex attribute of the element.
 */
function tabindexAttr(element) {
  if (!element.hasAttribute('tabindex')) {
    return null;
  }

  const n = Number(element.getAttribute('tabindex'));

  return Number.isInteger(n) ? n : null;
}

/**
 * Checks if the element is a tab stop.
 *
 * @param {HTMLElement} element The element to check if it is a tab stop.
 * @returns {boolean} True if the element is a tab stop, false otherwise.
 */
function isTabStop(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (!isVisible(element)) {
    return false;
  }

  // Disabled form controls
  if ('disabled' in element && element.disabled) {
    return false;
  }

  // tabindex attribute rules
  const ti = tabindexAttr(element);

  if (ti !== null) {
    return ti >= 0; // -1 = programmatic only
  }

  // No tabindex attribute → native tabbables or contenteditable
  return isNativelyTabbable(element) || isContentEditable(element);
}

/**
 * Checks if the element is a natively tabbable element.
 *
 * @param {HTMLElement} element The element to check if it is a natively tabbable element.
 * @returns {boolean} True if the element is a natively tabbable element, false otherwise.
 */
function isNativelyTabbable(element) {
  const t = element.tagName;

  if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA' || t === 'BUTTON') {
    return true;
  }

  if ((t === 'A' || t === 'AREA') && element.hasAttribute('href')) {
    return true;
  }

  if (t === 'SUMMARY') {
    return true;
  }

  if (t === 'IFRAME') {
    return true;
  }

  if ((t === 'AUDIO' || t === 'VIDEO') && element.hasAttribute('controls')) {
    return true;
  }

  return false;
}

/**
 * Checks if the element is a content editable element.
 *
 * @param {HTMLElement} element The element to check if it is a content editable element.
 * @returns {boolean} True if the element is a content editable element, false otherwise.
 */
function isContentEditable(element) {
  const ce = element.getAttribute('contenteditable');

  return ce && ce !== 'false';
}

/**
 * Checks if the element is visible.
 *
 * @param {HTMLElement} element The element to check if it is visible.
 * @returns {boolean} True if the element is visible, false otherwise.
 */
function isVisible(element) {
  if (!element.isConnected) {
    return false;
  }

  const visibilityMode = VISIBILITY_MODE;

  for (let n = element; n; n = composedParent(n)) {
    if (n.nodeType !== 1) {
      continue; // eslint-disable-line no-continue
    }

    const e = /** @type {Element} */ (n);

    if (e.getAttribute && e.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    if (e.hasAttribute && e.hasAttribute('inert')) {
      return false;
    }
    if (e.hasAttribute && e.hasAttribute('hidden')) {
      return false;
    }

    const win = e.ownerDocument?.defaultView;

    if (!win) {
      return false;
    }

    const cs = win.getComputedStyle(e);

    if (cs.display === 'none') {
      return false;
    }
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') {
      return false;
    }

    if (visibilityMode === 'strict') {
      if (cs.opacity === '0') {
        return false;
      }
      if (cs.pointerEvents === 'none') {
        return false;
      }
      // content-visibility not visible => treat as hidden in strict mode
      // (property may not exist in older engines)
      if ('contentVisibility' in cs && cs.contentVisibility !== 'visible') {
        return false;
      }
    }
  }

  if (visibilityMode === 'strict') {
    // Require a box (handles fully clipped/zero-sized content)
    if (element.getClientRects().length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Gets the composed parent of the element.
 *
 * @param {HTMLElement} node The element to get the composed parent of.
 * @returns {HTMLElement|null} The composed parent of the element.
 */
function composedParent(node) {
  if (!node) {
    return null;
  }

  if (node.parentElement) {
    return node.parentElement;
  }

  const root = node.getRootNode?.();

  if (root && root.host) {
    return root.host; // climb out of an open shadow root
  }

  return null;
}
