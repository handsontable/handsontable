import { createPaginator } from '../../utils/paginator';

/**
 * Creates a pagination focus controller instance.
 *
 * @private
 * @param {object} options - The options for the pagination focus controller.
 * @param {HTMLElement[]} options.focusableElements - The focusable elements.
 * @param {Function} options.onElementClick - The callback to handle the click event.
 * @returns {PaginationController} The pagination controller instance.
 */
export function createPaginationFocusController({ focusableElements, onElementClick }) {
  const navigator = createPaginator({
    initialPage: 0,
    size: () => focusableElements.length,
    onItemSelect: (currentIndex) => {
      if (focusableElements[currentIndex].disabled) {
        return false;
      }

      focusableElements[currentIndex].focus();
    }
  });

  focusableElements.forEach((element) => {
    element.addEventListener('click', () => {
      onElementClick();
      navigator.setCurrentPage(focusableElements.indexOf(element));
    });
  });

  return navigator;
}
