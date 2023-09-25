describe('ContextMenu keyboard shortcut', () => {
  const id = 'testContainer';

  function generateRandomMenuItems(itemsCount = 200, mapFunction = (i, item) => item) {
    return Array.from(new Array(itemsCount)).map((_, i) => {
      return mapFunction(i, {
        name: `Test item ${i + 1}`
      });
    });
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"ArrowDown"', () => {
    it('should move the menu item selection to the first item when there was no selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the first item and scroll the viewport', async() => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).toBe(1);
    });

    it('should move the menu item selection to the next item (skipping disabled items)', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the next item (skipping separators)', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.name = Handsontable.plugins.ContextMenu.SEPARATOR.name;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should not move the selection when there is only one active menu item', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the first item in the menu, even when external input is focused (#6550)', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const input = document.createElement('input');

      document.body.appendChild(input);
      contextMenu();

      const menuHot = getPlugin('contextMenu').menu.hotMenu;

      expect(menuHot.getSelected()).toBeUndefined();

      input.focus();
      keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      document.body.removeChild(input);
    });
  });

  describe('"ArrowUp"', () => {
    it('should move the menu item selection to the last item when there was no selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
    });

    it('should move the menu item selection to the last item and scroll the viewport', async() => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      keyDownUp('arrowup');

      await sleep(100);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the previous item (skipping disabled items)', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the next item (skipping separators)', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.name = Handsontable.plugins.ContextMenu.SEPARATOR.name;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should not move the selection when there is only one active menu item', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(5, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      contextMenu();
      keyDownUp('arrowup');

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the last item in the menu, even when external input is focused (#6550)', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      const input = document.createElement('input');

      document.body.appendChild(input);
      contextMenu();

      const menuHot = getPlugin('contextMenu').menu.hotMenu;

      expect(menuHot.getSelected()).toBeUndefined();

      input.focus();
      keyDownUp('arrowup');

      expect(menuHot.getSelected()).toEqual([[17, 0, 17, 0]]);

      document.body.removeChild(input);
    });
  });

  describe('"ArrowRight"', () => {
    it('should open subMenu and highlight the first item', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['alignment'],
        height: 100
      });

      contextMenu();
      keyDownUp('arrowdown');
      keyDownUp('arrowright');

      await sleep(300);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });

  describe('"Enter"', () => {
    it('should execute the selected menu action', () => {
      const itemAction = jasmine.createSpy('itemAction');
      const hot = handsontable({
        contextMenu: {
          items: {
            item1: {
              name: 'Item1',
              callback: itemAction
            },
            item2: 'Item2'
          }
        },
        height: 100
      });

      contextMenu();

      const menuHot = hot.getPlugin('contextMenu').menu.hotMenu;

      keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      expect(itemAction).not.toHaveBeenCalled();

      keyDownUp('enter');

      expect(itemAction).toHaveBeenCalled();
      expect($(hot.getPlugin('contextMenu').menu).is(':visible')).toBe(false);
    });
  });

  describe('"Escape"', () => {
    it('should close the menu', () => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should close the submenu and its parent', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      openContextSubmenuOption('Alignment');

      await sleep(300);

      keyDownUp('arrowdown');

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(false);
      expect($('.htContextMenu').is(':visible')).toBe(false);
    });
  });

  using('', [
    ['Control/Meta', 'ArrowDown'],
    ['End'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the last item', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last active item', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 103');

      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 103');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });
  });

  using('', [
    ['Control/Meta', 'ArrowUp'],
    ['Home'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the first item', async() => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
      // check if the viewport is scrolled to the top
      expect(window.scrollY).toBe(1);
    });

    it('should move the menu item selection to the first active item', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      contextMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('contextMenu').menu.getSelectedItem()).toBe(null);
    });
  });

  describe('"PageDown"', () => {
    it('should move the menu item selection to the last item that is visible in the browser viewport ' +
       'when there is no initial selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      keyDownUp('pagedown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last item when the menu fits within the browser viewport ' +
       'and there is initial selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(10),
      });

      contextMenu();
      getPlugin('contextMenu').menu.navigator.selectFirst();
      keyDownUp('pagedown');

      const hotMenu = getPlugin('contextMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[9, 0, 9, 0]]);
      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 10');
    });

    it('should move the menu item selection down by the count of visible items in the browser viewport', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      getPlugin('contextMenu').menu.navigator.selectFirst();
      keyDownUp('pagedown');

      let firstVisibleRow = 0;

      {
        // create rows calculator that allows gather information about what rows are already
        // visible in the browser viewport. The -2 argument means that the calculator takes into
        // account rows that are partially visible.
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);
      }
    });
  });

  describe('"PageUp"', () => {
    it('should move the menu item selection to the first item that is visible in the browser viewport' +
       'when there is no initial selection', async() => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp('pageup');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).toBe(1);
    });

    it('should move the menu item selection to the first item when the menu fits within the browser viewport' +
       'and there is initial selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(10),
      });

      contextMenu();
      getPlugin('contextMenu').menu.navigator.selectLast();
      keyDownUp('pageup');

      const hotMenu = getPlugin('contextMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection up by the count of visible items in the browser viewport', async() => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      getPlugin('contextMenu').menu.navigator.selectLast();

      window.scrollTo(0, document.documentElement.scrollHeight);

      await sleep(100);

      keyDownUp('pageup');

      let lastVisibleRow = 199;

      {
        // create rows calculator that allows gather information about what rows are already
        // visible in the browser viewport. The -2 argument means that the calculator takes into
        // account rows that are partially visible.
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('contextMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);
      }
    });
  });

  using('', [
    ['Shift', 'Control/Meta', '\\'],
    ['Shift', 'F10'],
  ], (keyboardShortcut) => {
    it('should internally call `open()` method with correct cell coordinates', () => {
      handsontable({
        contextMenu: true,
      });

      selectCell(1, 1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(1, 1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct row header coordinates', () => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(1, -1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct column header coordinates', () => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(-1, 1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct corner coordinates', () => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(-1, -1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should scroll the viewport when the focused cell is outside the table and call the `open` method', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(500, 50),
        width: 300,
        height: 300,
        contextMenu: true,
      });

      selectCell(400, 40);
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await sleep(10);

      const plugin = getPlugin('contextMenu');

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      await sleep(10);

      const cellRect = getCell(400, 40).getBoundingClientRect();

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
      expect(hot.view._wt.wtOverlays.inlineStartOverlay.getScrollPosition()).toBe(1766);
      expect(hot.view._wt.wtOverlays.topOverlay.getScrollPosition()).toBe(8939);
    });

    it('should not close the menu after hitting the same shortcut many times', () => {
      handsontable({
        contextMenu: true,
      });

      selectCell(1, 1);

      keyDownUp(keyboardShortcut);
      keyDownUp(keyboardShortcut);
      keyDownUp(keyboardShortcut);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');

      expect($contextMenu.length).toBe(1);
    });
  });
});
