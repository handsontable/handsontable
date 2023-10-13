import { createFocusNavigator } from './focusNavigator';
import { SelectUI } from '../ui/select';
import { BaseUI } from '../ui/_base';

const SHORTCUTS_MENU_CONTEXT = 'filters';
const SHORTCUTS_CONTEXT = `menu:${SHORTCUTS_MENU_CONTEXT}`;

/**
 * Creates navigator controller for filter subcomponents in the menu.
 *
 * @param {Menu} menu The Menu instance.
 * @param {BaseUI[]} menuItems The list of the component's elements to paginate to.
 * @returns {Paginator}
 */
export function createMenuFocusController(menu, menuItems) {
  const navigator = createFocusNavigator(menuItems);
  const updateNavigatorPosition = element => () => navigator.setCurrentPage(menuItems.indexOf(element));

  // update navigator position to element that was recently clicked or focused
  menuItems.forEach((element) => {
    if (element instanceof BaseUI) {
      element.addLocalHook('focus', updateNavigatorPosition(element));
      element.addLocalHook('click', updateNavigatorPosition(element));
      element.addLocalHook('afterClose', updateNavigatorPosition(element));
    }
  });

  menu.addLocalHook('afterSelectionChange', (selectedItem) => {
    if (!selectedItem.key.startsWith('filter_')) {
      navigator.clear();
    }
  });

  menu.addLocalHook('afterOpen', () => {
    navigator.clear();

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
      keys: [['Escape']],
      callback: () => {
        menu.close();
      }
    }, {
      keys: [['Enter'], ['Space']],
      preventDefault: false,
      callback: (event) => {
        const element = menuItems[navigator.getCurrentPage()];

        if (element instanceof SelectUI) {
          element.openOptions();
          event.preventDefault();
        }
        if (!(element instanceof BaseUI)) {
          event.preventDefault();
        }
      }
    }], SHORTCUTS_MENU_CONTEXT);

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
