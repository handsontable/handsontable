import { createFocusNavigator } from './focusNavigator';
import { SelectUI } from '../ui/select';
import { BaseUI } from '../ui/_base';

const SHORTCUTS_MENU_CONTEXT = 'filters';

/**
 * Creates navigator controller for filter subcomponents in the menu.
 *
 * @param {Menu} mainMenu The main Menu instance.
 * @param {BaseUI[]} menuItems The list of the component's elements to paginate to.
 * @returns {Paginator}
 */
export function createMenuFocusController(mainMenu, menuItems) {
  const navigator = createFocusNavigator(menuItems);
  const updateNavigatorPosition = element => () => navigator.setCurrentPage(menuItems.indexOf(element));

  // update navigator position (internal state) to element that was recently clicked or focused
  menuItems.forEach((element) => {
    if (element instanceof BaseUI) {
      element.addLocalHook('focus', updateNavigatorPosition(element));
      element.addLocalHook('click', updateNavigatorPosition(element));
      element.addLocalHook('afterClose', updateNavigatorPosition(element));
    }
  });

  mainMenu.addLocalHook('afterSelectionChange', (selectedItem) => {
    if (!selectedItem.key.startsWith('filter_')) {
      navigator.clear();
    }
  });

  /**
   * Extends the menu and submenus with new keyboard shortcuts.
   *
   * @param {*} menu The menu (as main menu or submenu) instance.
   */
  function addKeyboardShortcuts(menu) {
    const mainMenuShortcutsCtrl = mainMenu.getKeyboardShortcutsCtrl();
    const currentMenuShortcutsCtrl = menu.getKeyboardShortcutsCtrl();

    navigator.clear();

    currentMenuShortcutsCtrl.addCustomShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      forwardToContext: mainMenuShortcutsCtrl.getContext(SHORTCUTS_MENU_CONTEXT),
      callback: () => {
        if (menu.isSubMenu()) {
          menu.close();
        }

        mainMenuShortcutsCtrl.listen(SHORTCUTS_MENU_CONTEXT);
      },
    }]);

    if (menu.isSubMenu()) {
      return;
    }

    mainMenuShortcutsCtrl.addCustomShortcuts([{
      keys: [['Tab'], ['Shift', 'Tab']],
      callback: (event) => {
        mainMenu.getNavigator().clear();

        if (event.shiftKey) {
          navigator.toPreviousItem();
        } else {
          navigator.toNextItem();
        }
      },
    }, {
      keys: [['Escape']],
      callback: () => {
        mainMenu.close();
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
  }

  mainMenu.addLocalHook('afterSubmenuOpen', addKeyboardShortcuts);
  mainMenu.addLocalHook('afterOpen', addKeyboardShortcuts);

  /**
   * Focuses the menu and switches its shortcut context to that one which controls
   * the focus navigation.
   */
  function listen() {
    mainMenu.focus();
    mainMenu.getKeyboardShortcutsCtrl().listen(SHORTCUTS_MENU_CONTEXT);
  }

  return {
    ...navigator,
    listen,
  };
}
