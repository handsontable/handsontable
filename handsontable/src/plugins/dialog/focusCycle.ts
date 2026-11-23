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
 * Checks whether the browser's sequential focus would visit the element.
 *
 * @param {HTMLElement} element The element to check.
 * @returns {boolean}
 */
function isTabStop(element: HTMLElement): boolean {
  return element.tabIndex >= 0 &&
    !(element as HTMLButtonElement).disabled &&
    !element.classList.contains('htFocusCatcher') &&
    !element.closest('[inert]') &&
    isVisible(element);
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
 * @param {HTMLElement} container The element that contains the focus.
 * @param {Element|null} activeElement The currently focused element.
 * @param {boolean} backwards `true` for Shift+Tab.
 * @returns {HTMLElement|null}
 */
export function resolveWrapTarget(
  container: HTMLElement,
  activeElement: Element | null,
  backwards: boolean
): HTMLElement | null {
  const stops = getTabStops(container);

  if (stops.length === 0) {
    return container;
  }

  const first = stops[0];
  const last = stops[stops.length - 1];

  if (activeElement === last && !backwards) {
    return first;
  }

  if (activeElement === first && backwards) {
    return last;
  }

  if (activeElement && container.contains(activeElement) && !stops.includes(activeElement as HTMLElement)) {
    return backwards ? last : first;
  }

  return null;
}
