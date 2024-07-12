import { createPaginator } from '../../../utils/paginator';
import { isVisible } from '../../../helpers/dom/element';
import { MultipleSelectUI } from '../ui/multipleSelect';

/**
 * Creates navigator for switching the focus of the filter's elements.
 *
 * @param {BaseUI[]} elements The elements to paginate to.
 * @returns {Paginator}
 */
export function createFocusNavigator(elements) {
  const navigator = createPaginator({
    initialPage: 0,
    size: () => elements.length,
    onItemSelect: (currentIndex, directItemChange) => {
      const element = elements[currentIndex];

      if (element instanceof MultipleSelectUI) {
        return directItemChange;
      }

      if (element.element && !isVisible(element.element)) {
        return false;
      }

      element.focus();
    }
  });

  return navigator;
}
