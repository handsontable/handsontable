import { createPaginator } from '../../../utils/paginator';
import { isVisible } from '../../../helpers/dom/element';

/**
 * Creates navigator for between filter's subcomponents.
 *
 * @param {Array[]} elements The elements to paginate to.
 * @returns {Paginator}
 */
export function createMenuNavigator(elements) {
  const navigator = createPaginator({
    size: () => elements.length,
    onItemSelect: (currentIndex) => {
      if (!isVisible(elements[currentIndex].element)) {
        return false;
      }

      elements[currentIndex].focus();
    }
  });

  return navigator;
}
