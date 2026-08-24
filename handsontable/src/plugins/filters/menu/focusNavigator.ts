import { createPaginator } from '../../../utils/paginator';
import { isHTMLElement, isVisible } from '../../../helpers/dom/element';
import { MultipleSelectUI } from '../ui/multipleSelect';

/**
 * Creates navigator for switching the focus of the filter's elements.
 *
 * @param {BaseUI[]} elements The elements to paginate to.
 * @returns {Paginator}
 */
export function createFocusNavigator(elements: unknown[]) {
  const navigator = createPaginator({
    initialPage: 0,
    size: () => elements.length,
    onItemSelect: (currentIndex: number, directItemChange: boolean) => {
      const element = elements[currentIndex];

      if (element instanceof MultipleSelectUI) {
        return directItemChange;
      }

      const elementRecord = element as Record<string, unknown>;

      if (isHTMLElement(elementRecord.element) && !isVisible(elementRecord.element)) {
        return false;
      }

      (element as { focus: () => void }).focus();
    }
  });

  return navigator;
}
