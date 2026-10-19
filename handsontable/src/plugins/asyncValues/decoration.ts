import { addClass, removeAttribute, setAttribute } from '../../helpers/dom/element';
import { A11Y_BUSY, A11Y_INVALID } from '../../helpers/a11y';
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
    element.textContent = text;
  }

  return element;
}

/**
 * Decorates a cell element with a pending or an error state.
 *
 * @param {HTMLTableCellElement} TD The cell element.
 * @param {string} status The cell's state.
 * @param {string} message The error message.
 * @param {boolean} ariaTags Whether the grid writes ARIA attributes.
 */
export function decorateCell(
  TD: HTMLTableCellElement, status: AsyncValueStatus, message: string, ariaTags: boolean,
): void {
  const rootDocument = TD.ownerDocument;

  if (status === 'pending') {
    TD.appendChild(createElement(rootDocument, INDICATOR_CLASS_NAME, ''));
    addClass(TD, PENDING_CLASS_NAME);
    TD.setAttribute(DECORATION_ATTRIBUTE, '');

    if (ariaTags) {
      setAttribute(TD, [A11Y_BUSY()]);
    }

    return;
  }

  addClass(TD, ERROR_CLASS_NAME);
  TD.setAttribute(DECORATION_ATTRIBUTE, message);

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
    .filter(child => child.classList.contains(INDICATOR_CLASS_NAME) ||
      child.classList.contains(ERROR_MESSAGE_CLASS_NAME))
    .forEach(child => child.remove());
}
