describe('DropdownMenu keyboard shortcut', () => {
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

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }

  describe('"ArrowDown"', () => {
    it('should move the menu item selection to the first item when there was no selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the first item and scroll the viewport', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).toBe(25);
    });

    it('should move the menu item selection to the next item (skipping `disabled` items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the next item (skipping `disableSelection` items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disableSelection = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the next item (skipping separators)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.name = Handsontable.plugins.ContextMenu.SEPARATOR.name;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection to the next item (skipping hidden items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.hidden = () => true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should not move the selection when there is only one active menu item', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowdown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the first item in the menu, even when external input is focused (#6550)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      const input = document.createElement('input');

      document.body.appendChild(input);
      dropdownMenu();

      const menuHot = getPlugin('dropdownMenu').menu.hotMenu;

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
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
    });

    it('should move the menu item selection to the last item and scroll the viewport', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      await sleep(100);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the previous item (skipping `disableSelection` items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disableSelection = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the previous item (skipping `disabled` items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the next item (skipping separators)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.name = Handsontable.plugins.ContextMenu.SEPARATOR.name;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should move the menu item selection to the next item (skipping hidden items)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          if (i % 2) {
            item.hidden = () => true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 3');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 5');
    });

    it('should not move the selection when there is only one active menu item', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(5, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()).toBe(null);
    });

    it('should select the last item in the menu, even when external input is focused (#6550)', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      const input = document.createElement('input');

      document.body.appendChild(input);
      dropdownMenu();

      const menuHot = getPlugin('dropdownMenu').menu.hotMenu;

      expect(menuHot.getSelected()).toBeUndefined();

      input.focus();
      keyDownUp('arrowup');

      expect(menuHot.getSelected()).toEqual([[9, 0, 9, 0]]);

      document.body.removeChild(input);
    });
  });

  describe('"ArrowRight"', () => {
    it('should open subMenu and highlight the first item', async() => {
      handsontable({
        colHeaders: true,
        data: createSpreadsheetData(4, 4),
        dropdownMenu: ['alignment'],
        height: 100
      });

      dropdownMenu();
      keyDownUp('arrowdown');
      keyDownUp('arrowright');

      await sleep(300);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });

  describe('"Enter"', () => {
    it('should execute the selected menu action', () => {
      const itemAction = jasmine.createSpy('itemAction');
      const hot = handsontable({
        colHeaders: true,
        dropdownMenu: {
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

      dropdownMenu();

      const menuHot = hot.getPlugin('dropdownMenu').menu.hotMenu;

      keyDownUp('arrowdown');

      expect(menuHot.getSelected()).toEqual([[0, 0, 0, 0]]);

      expect(itemAction).not.toHaveBeenCalled();

      keyDownUp('enter');

      expect(itemAction).toHaveBeenCalled();
      expect($(hot.getPlugin('dropdownMenu').menu).is(':visible')).toBe(false);
    });
  });

  describe('"Escape"', () => {
    it('should close the menu', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      dropdownMenu();

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });

    it('should close the submenu and its parent', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      openDropdownSubmenuOption('Alignment');

      await sleep(300);

      keyDownUp('arrowdown');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(false);
      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });
  });

  using('', [
    ['Control/Meta', 'ArrowDown'],
    ['End'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the last item', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last active item', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 103');

      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 103');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()).toBe(null);
    });
  });

  using('', [
    ['Control/Meta', 'ArrowUp'],
    ['Home'],
  ], (keyboardShortcut) => {
    it('should move the menu item selection to the first item', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
      // check if the viewport is scrolled to the top
      expect(window.scrollY).toBe(25);
    });

    it('should move the menu item selection to the first active item', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          if (i !== 100 && i !== 101 && i !== 102) {
            item.disabled = true;
          }

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');

      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 101');
    });

    it('should not select the menu when all items are disabled', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200, (i, item) => {
          item.disabled = true;

          return item;
        }),
      });

      dropdownMenu();
      keyDownUp(keyboardShortcut);

      expect(getPlugin('dropdownMenu').menu.getSelectedItem()).toBe(null);
    });
  });

  describe('"PageDown"', () => {
    it('should move the menu item selection to the last item that is visible in the browser viewport ' +
       'when there is no initial selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      keyDownUp('pagedown');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
      // check if the viewport is scrolled to the bottom
      expect(document.documentElement.scrollHeight)
        .toBe(window.scrollY + document.documentElement.clientHeight);
    });

    it('should move the menu item selection to the last item when the menu fits within the browser viewport ' +
       'and there is initial selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(10),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.navigator.selectFirst();
      keyDownUp('pagedown');

      const hotMenu = getPlugin('dropdownMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[9, 0, 9, 0]]);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 10');
    });

    it('should move the menu item selection down by the count of visible items in the browser viewport', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.navigator.selectFirst();
      keyDownUp('pagedown');

      let firstVisibleRow = 0;

      {
        // create rows calculator that allows gather information about what rows are already
        // visible in the browser viewport. The -2 argument means that the calculator takes into
        // account rows that are partially visible.
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);

        firstVisibleRow = (endRow - 1);
      }

      keyDownUp('pagedown');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(startRow).toBe(firstVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${endRow}`);
      }
    });
  });

  describe('"PageUp"', () => {
    it('should move the menu item selection to the first item that is visible in the browser viewport' +
       'when there is no initial selection', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      window.scrollTo(0, 1000);

      await sleep(100);

      keyDownUp('pageup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
      expect(window.scrollY).toBe(25);
    });

    it('should move the menu item selection to the first item when the menu fits within the browser viewport' +
       'and there is initial selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(10),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.navigator.selectLast();
      keyDownUp('pageup');

      const hotMenu = getPlugin('dropdownMenu').menu.hotMenu;

      expect(hotMenu.getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 1');
    });

    it('should move the menu item selection up by the count of visible items in the browser viewport', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomMenuItems(200),
      });

      dropdownMenu();
      getPlugin('dropdownMenu').menu.navigator.selectLast();

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
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);

        lastVisibleRow = startRow;
      }

      keyDownUp('pageup');

      {
        const {
          startRow,
          endRow,
        } = getPlugin('dropdownMenu').menu.hotMenu.view._wt.wtViewport.createRowsCalculator(-2);

        expect(endRow).toBe(lastVisibleRow);
        expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe(`Test item ${startRow + 1}`);
      }
    });
  });

  describe('"Shift" + "Enter"', () => {
    it('should not be possible to open the dropdown menu (navigableHeaders off)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCell(0, 1);
      keyDownUp(['shift', 'enter']);

      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');

      expect($dropdownMenu.length).toBe(0);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should be possible to open the dropdown menu in the correct position', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'enter']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu on the left position when on the right there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      const lastColumn = countCols() - 1;

      selectCell(-1, lastColumn);
      keyDownUp(['shift', 'enter']);

      const cell = getCell(-1, lastColumn, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const menuWidth = $dropdownMenu.outerWidth();
      const cellOffset = $(cell).offset();
      const cellWidth = $(cell).outerWidth();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + cellWidth);
      expect(getSelectedRange()).toEqualCellRange([
        `highlight: -1,${lastColumn} from: -1,${lastColumn} to: 3,${lastColumn}`
      ]);
    });

    it('should not highlight first item of the menu after open it', async() => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'enter']);

      await sleep(100);

      expect(getPlugin('dropdownMenu').menu.hotMenu.getSelected()).toBeUndefined();
    });

    it('should not be possible to close already opened the dropdown menu', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'enter']);
      keyDownUp(['shift', 'enter']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu from the focused column when a range of the columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectColumns(1, 4, -1);
      listen();
      keyDownUp(['shift', 'enter']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu only by triggering the action only from the lowest column header', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCell(-1, -1); // corner
      keyDownUp(['shift', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      }

      selectCell(1, -1); // row header
      keyDownUp(['shift', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      }

      selectCell(-3, 1); // the first (top) column header
      keyDownUp(['shift', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
      }

      selectCell(-2, 1); // the second column header
      keyDownUp(['shift', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      }

      selectCell(-1, 1); // the third (bottom) column header
      keyDownUp(['shift', 'enter']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(1);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
      }
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'enter']);

      expect(getActiveEditor()).toBeUndefined();
    });

    describe('cooperation with nested headers', () => {
      it('should be possible to open the dropdown menu in the correct position when the cells in-between nested headers is selected', () => {
        handsontable({
          data: createSpreadsheetData(3, 8),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          dropdownMenu: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
        });

        selectCell(-1, 2);
        keyDownUp(['shift', 'enter']);

        const cell = getCell(-1, 1, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const cellOffset = $(cell).offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,1 to: 2,3']);
      });
    });
  });

  describe('"Shift" + "Alt/Option" + "ArrowDown"', () => {
    it('should be possible to open the dropdown menu in the correct position triggered from the single cell', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu on the left position when on the right there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      const lastColumn = countCols() - 1;

      selectCell(-1, lastColumn);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, lastColumn, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const menuWidth = $dropdownMenu.outerWidth();
      const cellOffset = $(cell).offset();
      const cellWidth = $(cell).outerWidth();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + cellWidth);
      expect(getSelectedRange()).toEqualCellRange([
        `highlight: -1,${lastColumn} from: -1,${lastColumn} to: 3,${lastColumn}`
      ]);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of the cells', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 4, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,4 to: 2,4']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of non-contiguous selection', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0], [2, 3, 2, 2]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 3, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 2,3']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the single cell (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of the cells (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 4, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: 2,4']);
    });

    it('should be possible to open the dropdown menu in the correct position triggered from the range of non-contiguous selection (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectCells([[2, 4, 0, 0], [2, 3, 2, 2]]);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 3, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 2,3']);
    });

    it('should be possible to open the dropdown menu from the focused column when a range of the columns are selected', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true
      });

      selectColumns(1, 4, -1);
      listen();
      keyDownUp(['shift', 'alt', 'arrowdown']);

      const cell = getCell(-1, 1, true);
      const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
      const menuOffset = $dropdownMenu.offset();
      const cellOffset = $(cell).offset();

      expect($dropdownMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
    });

    it('should be possible to open the dropdown menu only by triggering the action only from the lowest column header', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCell(-1, -1); // corner
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      }

      selectCell(1, -1); // row header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      }

      selectCell(-3, 1); // the first (top) column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
      }

      selectCell(-2, 1); // the second column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      }

      selectCell(-1, 1); // the third (bottom) column header
      keyDownUp(['shift', 'alt', 'arrowdown']);

      {
        expect($(document.body).find('.htDropdownMenu:visible').length).toBe(1);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
      }
    });

    it('should not trigger the editor to be opened', () => {
      handsontable({
        data: createSpreadsheetData(3, 8),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        dropdownMenu: true,
      });

      selectCell(-1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      expect(getActiveEditor()).toBeUndefined();

      selectCell(1, 1);
      keyDownUp(['shift', 'alt', 'arrowdown']);

      // the editor is created and prepared after cell selection but should be still not opened
      expect(getActiveEditor().isOpened()).toBe(false);
    });

    describe('cooperation with nested headers', () => {
      it('should be possible to open the dropdown menu in the correct position when the cells in-between nested headers is selected', () => {
        handsontable({
          data: createSpreadsheetData(3, 8),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          dropdownMenu: true,
          nestedHeaders: [
            ['A', { label: 'B', colspan: 3 }, 'E', 'F', { label: 'G', colspan: 2 }, 'I', 'J'],
          ],
        });

        selectCell(1, 3);
        keyDownUp(['shift', 'alt', 'arrowdown']);

        const cell = getCell(-1, 1, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const cellOffset = $(cell).offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,1 to: 2,3']);
      });
    });
  });
});
