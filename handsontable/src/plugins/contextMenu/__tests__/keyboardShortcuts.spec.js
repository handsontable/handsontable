describe('ContextMenu keyboard shortcut', () => {
  const id = 'testContainer';

  function generateRandomMenuItems(itemsCount = 200) {
    return Array.from(new Array(itemsCount)).map((_, i) => {
      return {
        name: `Test item ${i + 1}`
      };
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

  describe('"PageDown"', () => {
    it('should move the menu item selection to the last item that is visible in the browser viewport' +
       'when there is no initial selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(200),
      });

      contextMenu();
      keyDownUp('pagedown');

      expect(getPlugin('contextMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight + 2); // 2px as menu bottom border
    });

    it('should move the menu item selection to the last item when the menu fits within the browser viewport' +
       'and there is initial selection', () => {
      handsontable({
        contextMenu: generateRandomMenuItems(10),
      });

      contextMenu();
      getPlugin('contextMenu').menu.selectFirstCell();
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
      getPlugin('contextMenu').menu.selectFirstCell();
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
      getPlugin('contextMenu').menu.selectLastCell();
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
      getPlugin('contextMenu').menu.selectLastCell();

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
    ['shift', 'control/meta', '\\'],
    ['shift', 'F10'],
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
      scrollViewportTo(0, 0);

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
