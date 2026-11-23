import { isVisible } from '../../helpers/dom/element';

/**
 * Selector for the elements that can take part in sequential (Tab) focus navigation.
 */
const TAB_STOP_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

/**
 * `Node.DOCUMENT_POSITION_PRECEDING`, as `compareDocumentPosition()` reports it.
 */
const DOCUMENT_POSITION_PRECEDING = 2;
/**
 * `Node.DOCUMENT_POSITION_FOLLOWING`, as `compareDocumentPosition()` reports it.
 */
const DOCUMENT_POSITION_FOLLOWING = 4;

/**
 * Checks whether the element is rendered and not hidden with `visibility`. Sequential focus skips an
 * element under `visibility: hidden` as it skips one under `display: none`.
 *
 * @param {HTMLElement} element The element to check.
 * @returns {boolean}
 */
function isRenderedVisible(element: HTMLElement): boolean {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true });
  }

  const view = element.ownerDocument.defaultView;

  return isVisible(element) && view?.getComputedStyle(element).visibility !== 'hidden';
}

/**
 * Checks whether the browser's sequential focus would visit the element.
 *
 * @param {HTMLElement} element The element to check.
 * @returns {boolean}
 */
function isTabStop(element: HTMLElement): boolean {
  return element.tabIndex >= 0 &&
    // `:disabled` also matches a control inside a disabled `fieldset`, which the `disabled` property does not.
    !element.matches(':disabled') &&
    !element.classList.contains('htFocusCatcher') &&
    !element.closest('[inert]') &&
    isRenderedVisible(element);
}

/**
 * Returns the elements inside the container, in document order, that the browser's sequential
 * focus would visit.
 *
 * @param {HTMLElement} container The element to search in.
 * @returns {HTMLElement[]}
 */
export function getTabStops(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR)).filter(isTabStop);
}

/**
 * Returns the element to focus instead of the native Tab move, or `null` to let the browser move.
 *
 * A press from the last stop (Tab) or the first one (Shift+Tab) wraps to the other end. A press from the
 * container itself goes to the end the key points at. A press from another focused element that is not a
 * stop (a heading the application focused, an item of a roving tabindex) is left to the browser while a
 * stop lies in the direction of the key, and wraps otherwise.
 *
 * @param {HTMLElement} container The element that contains the focus.
 * @param {Element|null} activeElement The currently focused element.
 * @param {boolean} backwards `true` for Shift+Tab.
 * @param {HTMLElement[]} [stops] The container's tab stops, when the caller has them already.
 * @returns {HTMLElement|null}
 */
export function resolveWrapTarget(
  container: HTMLElement,
  activeElement: Element | null,
  backwards: boolean,
  stops: HTMLElement[] = getTabStops(container),
): HTMLElement | null {
  if (stops.length === 0) {
    return container;
  }

  const first = stops[0];
  const last = stops[stops.length - 1];
  const wrapTarget = backwards ? last : first;

  if (activeElement === (backwards ? first : last) || activeElement === container) {
    return wrapTarget;
  }

  if (activeElement && container.contains(activeElement) && !stops.includes(activeElement as HTMLElement)) {
    const direction = backwards ? DOCUMENT_POSITION_PRECEDING : DOCUMENT_POSITION_FOLLOWING;
    // `compareDocumentPosition()` answers with a bit mask (a descendant stop is FOLLOWING | CONTAINED_BY).
    // eslint-disable-next-line no-bitwise
    const hasStopAhead = stops.some(stop => (activeElement.compareDocumentPosition(stop) & direction) !== 0);

    return hasStopAhead ? null : wrapTarget;
  }

  return null;
}
