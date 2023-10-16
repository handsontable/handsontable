/**
 * Creates a keyboard shortcuts list with default keyboards binds.
 *
 * @param {Menu} menu The main menu instance.
 * @returns {KeyboardShortcut[]}
 */
export function createDefaultShortcutsList(menu) {
  return [{
    keys: [['Tab'], ['Shift', 'Tab'], ['Control/Meta', 'A']],
    forwardToContext: menu.hot.getShortcutManager().getContext('grid'),
    callback: () => menu.close(true),
  }, {
    keys: [['Escape']],
    callback: () => menu.close(),
  }, {
    keys: [['ArrowDown']],
    callback: () => menu.getNavigator().toNextItem(),
  }, {
    keys: [['ArrowUp']],
    callback: () => menu.getNavigator().toPreviousItem(),
  }, {
    keys: [['ArrowRight']],
    callback: () => {
      const selection = menu.hotMenu.getSelectedLast();

      if (selection) {
        const subMenu = menu.openSubMenu(selection[0]);

        if (subMenu) {
          subMenu.getNavigator().toFirstItem();
        }
      }
    }
  }, {
    keys: [['ArrowLeft']],
    callback: () => {
      const selection = menu.hotMenu.getSelectedLast();

      if (selection && menu.isSubMenu()) {
        menu.close();

        if (menu.isSubMenu()) {
          menu.parentMenu.hotMenu.listen();
        }
      }
    },
  }, {
    keys: [['Control/Meta', 'ArrowUp'], ['Home']],
    callback: () => menu.getNavigator().toFirstItem(),
  }, {
    keys: [['Control/Meta', 'ArrowDown'], ['End']],
    callback: () => menu.getNavigator().toLastItem(),
  }, {
    keys: [['Enter'], ['Space']],
    callback: (event) => {
      const selection = menu.hotMenu.getSelectedLast();

      if (!selection) {
        return;
      }

      if (menu.hotMenu.getSourceDataAtRow(selection[0]).submenu) {
        menu.openSubMenu(selection[0]).getNavigator().toFirstItem();
      } else {
        menu.executeCommand(event);
        menu.close(true);
      }
    }
  }, {
    keys: [['PageUp']],
    callback: () => {
      const selection = menu.hotMenu.getSelectedLast();

      if (selection) {
        menu.hotMenu.selection.transformStart(-menu.hotMenu.countVisibleRows(), 0);
      } else {
        menu.getNavigator().toFirstItem();
      }
    },
  }, {
    keys: [['PageDown']],
    callback: () => {
      const selection = menu.hotMenu.getSelectedLast();

      if (selection) {
        menu.hotMenu.selection.transformStart(menu.hotMenu.countVisibleRows(), 0);
      } else {
        menu.getNavigator().toLastItem();
      }
    },
  }];
}
