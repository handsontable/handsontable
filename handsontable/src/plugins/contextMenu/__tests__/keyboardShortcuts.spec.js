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
});
