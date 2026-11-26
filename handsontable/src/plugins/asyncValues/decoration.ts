import { addClass, removeAttribute, setAttribute } from '../../helpers/dom/element';
import { A11Y_BUSY, A11Y_INVALID } from '../../helpers/a11y';
import { addCellDescriptionPart, CELL_DESCRIPTION_RANK } from '../../utils/cellDescription/cellDescription';
import type { AsyncValueStatus } from './types';

/**
 * The class of a cell whose request is pending.
 */
export const PENDING_CLASS_NAME = 'htAsyncPending';

/**
 * The class of a cell whose request failed.
 */
export const ERROR_CLASS_NAME = 'htAsyncError';

/**
 * The class of the pending indicator element.
 */
export const INDICATOR_CLASS_NAME = 'htAsyncIndicator';

/**
 * The class of the visually hidden element that carries the error message to assistive technology.
 */
export const ERROR_MESSAGE_CLASS_NAME = 'htAsyncErrorMessage';

/**
 * The class of the bar that marks a failed cell with something other than a color, drawn as a border so it
 * stays visible in forced-colors mode.
 */
export const ERROR_MARKER_CLASS_NAME = 'htAsyncErrorMarker';

/**
 * The classes of the elements the plugin adds to a cell.
 */
const ELEMENT_CLASS_NAMES = [
  INDICATOR_CLASS_NAME, ERROR_MESSAGE_CLASS_NAME, ERROR_MARKER_CLASS_NAME,
];

/**
 * Marks a cell element the plugin decorated, and holds the `title` the plugin wrote on it, so the
 * decoration can be taken off a recycled element without touching a `title` a renderer wrote.
 */
const DECORATION_ATTRIBUTE = 'data-ht-async';

/**
 * Creates one of the plugin's elements inside a cell.
 *
 * @param {Document} rootDocument The cell's document.
 * @param {string} className The element's class.
 * @param {string} text The element's text.
 * @returns {HTMLSpanElement}
 */
function createElement(rootDocument: Document, className: string, text: string): HTMLSpanElement {
  const element = rootDocument.createElement('span');

  element.className = className;

  if (text === '') {
    element.setAttribute('aria-hidden', 'true');

  } else {
    // The leading space keeps the text apart from the cell's value. The element follows the value with
    // nothing in between, and a screen reader that reads the cell as one run of text (VoiceOver with
    // WebKit) joined the two into one word. The stylesheet keeps the space (`white-space: pre`): at the
    // start of a box it would otherwise collapse.
    element.textContent = ` ${text}`;
  }

  return element;
}

/**
 * Decorates a cell element with a pending or an error state.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @param {string} status The cell's state.
 * @param {string} message The error message, or for a pending cell the translated loading text, which goes to
 * the cell's description (`utils/cellDescription/`): it is the same phrase for every pending cell, and no common
 * screen reader announces `aria-busy` on a grid cell.
 * @param {boolean} ariaTags Whether the grid writes ARIA attributes.
 * @param {number} [pendingFor=0] For a pending cell, how long the request has been pending, in milliseconds.
 */
export function decorateCell(
  TD: HTMLTableCellElement, status: AsyncValueStatus, message: string, ariaTags: boolean, pendingFor = 0,
): void {
  const rootDocument = TD.ownerDocument;

  if (status === 'pending') {
    const indicator = createElement(rootDocument, INDICATOR_CLASS_NAME, '');

    // Every paint builds a new indicator, and a new element starts its animation from the first turn. A
    // negative delay resumes the turns where the request's time puts them, so a grid that keeps rendering
    // (other cells resolve, the user scrolls) does not keep the ring turning past its four turns (WCAG 2.2.2).
    if (pendingFor > 0) {
      indicator.style.animationDelay = `-${Math.round(pendingFor)}ms`;
    }

    TD.appendChild(indicator);
    addClass(TD, PENDING_CLASS_NAME);
    TD.setAttribute(DECORATION_ATTRIBUTE, '');

    if (ariaTags) {
      setAttribute(TD, [A11Y_BUSY()]);
      addCellDescriptionPart(TD, CELL_DESCRIPTION_RANK.PENDING, message);
    }

    return;
  }

  addClass(TD, ERROR_CLASS_NAME);
  TD.setAttribute(DECORATION_ATTRIBUTE, message);
  TD.appendChild(createElement(rootDocument, ERROR_MARKER_CLASS_NAME, ''));

  if (message !== '') {
    TD.setAttribute('title', message);
    // The `title` reaches a pointer only, and a screen reader drops it while the cell carries
    // `aria-describedby` (its column header). Visually hidden text is read with the cell's content.
    TD.appendChild(createElement(rootDocument, ERROR_MESSAGE_CLASS_NAME, message));
  }

  if (ariaTags) {
    setAttribute(TD, [A11Y_INVALID()]);
  }
}

/**
 * Takes the decoration off a cell element, if it carries one. The classes and ARIA attributes are reset
 * by the renderer on every paint, so only the plugin's elements and its own `title` remain.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 */
export function undecorateCell(TD: HTMLTableCellElement): void {
  if (!TD.hasAttribute(DECORATION_ATTRIBUTE)) {
    return;
  }

  const title = TD.getAttribute(DECORATION_ATTRIBUTE);

  if (title !== '' && TD.getAttribute('title') === title) {
    TD.removeAttribute('title');
  }

  removeAttribute(TD, [DECORATION_ATTRIBUTE]);
  Array.from(TD.children)
    .filter(child => ELEMENT_CLASS_NAMES.some(className => child.classList.contains(className)))
    .forEach(child => child.remove());
}
