import { createPaginator } from '../../utils/paginator';

/**
 * Creates a pagination focus controller instance.
 *
 * @private
 * @param {object} options The options for the pagination focus controller.
 * @param {function(): HTMLElement[]} options.focusableElements The focusable elements.
 * @returns {PaginationController} The pagination controller instance.
 */
export function createFocusableElementsNavigator({ focusableElements }) {
  const navigator = createPaginator({
    initialPage: 0,
    size: () => focusableElements().length,
    onItemSelect: (currentIndex) => {
      const elements = focusableElements();

      elements[currentIndex].focus();
    }
  });

  return navigator;
}
