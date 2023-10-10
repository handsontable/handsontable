import { createMenuNavigator } from './navigator';
import SelectUI from '../ui/select';

const SHORTCUTS_CONTEXT = 'menu_filters';

/**
 * Creates paginator for menus and submenus.
 *
 * @param {Handsontable} filtersPlugin The Handsontable instance of the menu.
 * @returns {Paginator}
 */
export function createMenuNavigatorCtrl(filtersPlugin) {
  const menu = filtersPlugin.dropdownMenuPlugin.menu;
  const byCond = filtersPlugin.components.get('filter_by_condition');
  const operators = filtersPlugin.components.get('filter_operators');
  const byCond2 = filtersPlugin.components.get('filter_by_condition2');
  const byValue = filtersPlugin.components.get('filter_by_value');
  const actionBar = filtersPlugin.components.get('filter_action_bar');
  const elements = [
    ...byCond.getElements(),
    ...operators.getElements(),
    ...byCond2.getElements(),
    ...byValue.getElements(),
    ...actionBar.getElements(),
  ];
  const componentIds = Array.from(filtersPlugin.components).map(([, component]) => component.id);
  const updateNavigatorPosition = element => () => navigator.setCurrentPage(elements.indexOf(element));

  // update navigator position to element that was recently clicked or focused
  elements.forEach((element) => {
    element.addLocalHook('focus', updateNavigatorPosition(element));
    element.addLocalHook('click', updateNavigatorPosition(element));
    element.addLocalHook('afterClose', updateNavigatorPosition(element));
  });

  const navigator = createMenuNavigator(elements);

  menu.addLocalHook('afterSelectionChange', (selectedItem) => {
    if (!componentIds.includes(selectedItem.key)) {
      navigator.clear();
    }
  });

  menu.addLocalHook('afterOpen', () => {
    menu.addShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        menu.getNavigator().clear();

        if (event.shiftKey) {
          navigator.toPreviousItem();
        } else {
          navigator.toNextItem();
        }
      },
    }, {
      keys: [['Enter'], ['Space']],
      preventDefault: false,
      callback: (event) => {
        const element = elements[navigator.getCurrentPage()];

        if (element instanceof SelectUI) {
          element.openOptions();
          event.preventDefault();
        }
      }
    }], SHORTCUTS_CONTEXT);

    menu.addShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      forwardToContext: menu.getShortcutManager().getContext(SHORTCUTS_CONTEXT),
      callback: () => {
        menu.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT);
      },
    }]);
  });

  return navigator;
}
