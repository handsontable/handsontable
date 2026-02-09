/**
 * Creates a keyboard shortcuts list with default keyboards binds.
 *
 * @param {Menu} menu The main menu instance.
 * @returns {KeyboardShortcut[]}
 */
export function createDefaultShortcutsList(menu: Record<string, unknown>) {
  const hot = menu.hot as Record<string, Record<string, Function> & Function>;
  const hotMenu = menu.hotMenu as Record<string, Record<string, Function> & Function>;

  return [{
    keys: [['Control/Meta', 'A']],
    forwardToContext: hot.getShortcutManager().getContext('grid'),
    callback: () => (menu.close as Function)(true)
  }, {
    keys: [['Tab'], ['Shift', 'Tab']],
    callback: (event: Event, keys: string[]) => {
      const settings = hot.getSettings();
      const tabMoves = typeof settings.tabMoves === 'function'
        ? settings.tabMoves(event)
        : settings.tabMoves;

      if (keys.includes('shift')) {
        hot.selection.transformStart(-tabMoves.row, -tabMoves.col);
      } else {
        hot.selection.transformStart(tabMoves.row, tabMoves.col);
      }

      (menu.close as Function)(true);
    },
  }, {
    keys: [['Escape']],
    callback: () => (menu.close as Function)(),
  }, {
    keys: [['ArrowDown']],
    callback: () => (menu.getNavigator as Function)().toNextItem(),
  }, {
    keys: [['ArrowUp']],
    callback: () => (menu.getNavigator as Function)().toPreviousItem(),
  }, {
    keys: [[hot.isRtl() ? 'ArrowLeft' : 'ArrowRight']],
    callback: () => {
      const selection = hotMenu.getSelectedActive();

      if (selection) {
        const subMenu = (menu.openSubMenu as Function)(selection[0]);

        if (subMenu) {
          subMenu.getNavigator().toFirstItem();
        }
      }
    }
  }, {
    keys: [[hot.isRtl() ? 'ArrowRight' : 'ArrowLeft']],
    callback: () => {
      const selection = hotMenu.getSelectedActive();

      if (selection && (menu.isSubMenu as Function)()) {
        (menu.close as Function)();

        if ((menu.isSubMenu as Function)()) {
          (menu.parentMenu as Record<string, Record<string, Function>>).hotMenu.listen();
        }
      }
    },
  }, {
    keys: [['Control/Meta', 'ArrowUp'], ['Home']],
    callback: () => (menu.getNavigator as Function)().toFirstItem(),
  }, {
    keys: [['Control/Meta', 'ArrowDown'], ['End']],
    callback: () => (menu.getNavigator as Function)().toLastItem(),
  }, {
    keys: [['Enter'], ['Space']],
    callback: (event: Event) => {
      const selection = hotMenu.getSelectedActive();

      if (!selection) {
        return;
      }

      if (hotMenu.getSourceDataAtRow(selection[0]).submenu) {
        (menu.openSubMenu as Function)(selection[0]).getNavigator().toFirstItem();
      } else {
        (menu.executeCommand as Function)(event);
        (menu.close as Function)(true);
      }
    }
  }, {
    keys: [['PageUp']],
    callback: () => {
      const selection = hotMenu.getSelectedActive();

      if (selection) {
        hotMenu.selection.transformStart(-hotMenu.countVisibleRows(), 0);
      } else {
        (menu.getNavigator as Function)().toFirstItem();
      }
    },
  }, {
    keys: [['PageDown']],
    callback: () => {
      const selection = hotMenu.getSelectedActive();

      if (selection) {
        hotMenu.selection.transformStart(hotMenu.countVisibleRows(), 0);
      } else {
        (menu.getNavigator as Function)().toLastItem();
      }
    },
  }];
}
