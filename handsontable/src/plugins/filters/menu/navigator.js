import { createPaginator } from '../../../utils/paginator';
import { isVisible } from '../../../helpers/dom/element';
import { isKey } from '../../../helpers/unicode';

/**
 * Creates paginator for menus and submenus.
 *
 * @param {Handsontable} filtersPlugin The Handsontable instance of the menu.
 * @returns {Paginator}
 */
export function createMenuNavigator(filtersPlugin) {
  const byCond = filtersPlugin.components.get('filter_by_condition');
  const operators = filtersPlugin.components.get('filter_operators');
  const byCond2 = filtersPlugin.components.get('filter_by_condition2');
  const byValue = filtersPlugin.components.get('filter_by_value');
  const actionBar = filtersPlugin.components.get('filter_action_bar');

  const elements = [
    ...byCond.getElements(),
    ...operators.getElements(),
    ...byCond2.getElements(),
    byValue.getMultipleSelectElement().getSearchInputElement(),
    byValue.getMultipleSelectElement().getSelectAllElement(),
    byValue.getMultipleSelectElement().getClearAllElement(),
    ...actionBar.getElements(),
  ];

  const navigator = createPaginator({
    size: () => elements.length,
    onItemSelect: (currentIndex) => {
      if (!isVisible(elements[currentIndex].element)) {
        return false;
      }

      elements[currentIndex].focus();
    }
  });

  elements.forEach((element) => {
    element.addLocalHook('keydown', (event) => {
      if (event.target.tagName !== 'INPUT') {
        return;
      }

      if (isKey(event.keyCode, 'TAB')) {
        event.preventDefault();

        if (event.shiftKey) {
          navigator.toPreviousItem();
        } else {
          navigator.toNextItem();
        }
      }
    });
  });

  return navigator;
}
