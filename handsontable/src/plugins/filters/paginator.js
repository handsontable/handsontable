import { createPaginator } from '../../utils/paginator';
import { isVisible } from '../../helpers/dom/element';

/**
 * Creates paginator for menus and submenus.
 *
 * @param {Handsontable} filtersPlugin The Handsontable instance of the menu.
 * @returns {Paginator}
 */
export function createMenuPaginator(filtersPlugin) {
  const byCond = filtersPlugin.components.get('filter_by_condition');
  const operators = filtersPlugin.components.get('filter_operators');
  const byCond2 = filtersPlugin.components.get('filter_by_condition2');
  const byValue = filtersPlugin.components.get('filter_by_value');
  const actionBar = filtersPlugin.components.get('filter_action_bar');

  const elements = [
    byCond.getSelectElement(),
    ...byCond.getInputElements(),
    ...operators.elements,
    byCond2.getSelectElement(),
    ...byCond2.getInputElements(),
    byValue.getMultipleSelectElement().getSearchInputElement(),
    byValue.getMultipleSelectElement().getSelectAllElement(),
    byValue.getMultipleSelectElement().getClearAllElement(),
    ...actionBar.elements,
  ];

  return createPaginator({
    size: () => elements.length,
    onPageChange: (currentPage) => {
      if (!isVisible(elements[currentPage].element)) {
        return false;
      }

      elements[currentPage].focus();
    }
  });
}
