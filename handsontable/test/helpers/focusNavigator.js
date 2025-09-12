/* eslint-disable jsdoc/require-description-complete-sentence */
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
 * @param {HTMLElement} from The element to start the focus traversal from.
 * @returns {HTMLElement}
 */
export function getNextFocusableElement(shift = false, from = activeElement) {
  const order = computeTabOrder(document, { visibilityMode: 'spec' });
  const idx = indexOfElementInOrder(order, from);
  const to = chooseNext(order, idx, shift) ?? document.body;

  return to;
}

/**
 * Computes the tab order of the elements in the document.
 *
 * @param {HTMLElement} root The root element to compute the tab order for.
 * @param {object} options The options for the tab order computation.
 * @param {string} options.visibilityMode The visibility mode to use for the tab order computation.
 * @returns {HTMLElement[]} The tab order of the elements in the document.
 */
function computeTabOrder(root, options) {
  const entries = [];
  let domSequence = 0;

  walkComposed(root, (element) => {
    if (!isTabStop(element, options)) {
      return;
    }

    const ti = tabindexAttr(element);

    domSequence += 1;

    entries.push({
      element,
      group: ti > 0 ? 0 : 1,
      ti: ti > 0 ? ti : 0,
      dom: domSequence,
    });
  });

  entries.sort((a, b) => a.group - b.group || a.ti - b.ti || a.dom - b.dom);

  return entries.map(entry => entry.element);
}

/**
 * Finds the index of the element in the tab order.
 *
 * @param {HTMLElement[]} order The tab order of the elements.
 * @param {HTMLElement} element The element to find the index of.
 * @returns {number} The index of the element in the tab order.
 */
function indexOfElementInOrder(order, element) {
  const chain = composedPathChain(element);

  for (const n of chain) {
    const i = order.indexOf(n);

    if (i !== -1) {
      return i;
    }
  }

  return order.indexOf(element);
}

/**
 * Chooses the next element in the tab order.
 *
 * @param {HTMLElement[]} order The tab order of the elements.
 * @param {number} idx The index of the element in the tab order.
 * @param {boolean} shift If true, gets the previous focusable element, otherwise gets the next focusable element.
 * @returns {HTMLElement} The next element in the tab order.
 */
function chooseNext(order, idx, shift) {
  if (!order.length) {
    return null;
  }

  if (idx === -1) {
    return shift ? order[order.length - 1] : order[0];
  }

  return shift
    ? order[(idx - 1 + order.length) % order.length]
    : order[(idx + 1) % order.length];
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
 * @param {object} options The options for the tab stop check.
 * @param {string} options.visibilityMode The visibility mode to use for the tab stop check.
 * @returns {boolean} True if the element is a tab stop, false otherwise.
 */
function isTabStop(element, options) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (!isVisible(element, options)) {
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
 * Visibility rules:
 * - Always climb the *composed* ancestor chain (crosses open shadow roots).
 * - 'spec' mode: display:none, visibility:hidden|collapse, hidden, [inert], closed <details> (except its <summary>).
 * - 'strict' mode also requires: has a layout box, opacity != 0, pointer-events != none, content-visibility: visible.
 *
 * @param {HTMLElement} element The element to check if it is visible.
 * @param {object} options The options for the visibility check.
 * @param {string} options.visibilityMode The visibility mode to use for the visibility check.
 * @returns {boolean} True if the element is visible, false otherwise.
 */
function isVisible(element, { visibilityMode = 'spec' } = {}) {
  if (!element.isConnected) {
    return false;
  }

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
 * Walks the composed tree of the element.
 *
 * @param {HTMLElement} root The root element to walk the composed tree of.
 * @param {Function} visitor The visitor function to call for each element in the composed tree.
 */
function walkComposed(root, visitor) {
  const start = root instanceof Document ? root.documentElement : root;

  (function visit(node) { // eslint-disable-line wrap-iife
    if (node.nodeType !== 1) {
      return;
    }

    const el = /** @type {Element} */ (node);

    visitor(el);

    const sr = el.shadowRoot;

    if (sr && sr.mode === 'open') {
      sr.childNodes.forEach(c => visit(c));
    }

    el.childNodes.forEach(c => visit(c));
  })(start);
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

/**
 * Gets the composed path chain of the element.
 *
 * @param {HTMLElement} element The element to get the composed path chain of.
 * @returns {HTMLElement[]} The composed path chain of the element.
 */
function composedPathChain(element) {
  const chain = [];
  let cur = element;

  while (cur) {
    chain.push(cur);
    const root = cur.getRootNode?.();

    if (root && root.host) {
      cur = root.host;
    } else {
      cur = cur.parentElement || null;
    }
  }

  return chain;
}
