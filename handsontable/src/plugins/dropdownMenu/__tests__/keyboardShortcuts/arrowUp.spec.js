describe('DropdownMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"ArrowUp"', () => {
    it('should move the menu item selection to the last item when there was no selection', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
      });

      dropdownMenu();

      keyDownUp('arrowup');

      expect(getPlugin('dropdownMenu').menu.getSelectedItem().name).toBe('Test item 200');
    });

    it('should move the menu item selection to the last item and scroll the viewport', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(200),
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
        dropdownMenu: generateRandomDropdownMenuItems(5, (i, item) => {
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
        dropdownMenu: generateRandomDropdownMenuItems(5, (i, item) => {
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
        dropdownMenu: generateRandomDropdownMenuItems(5, (i, item) => {
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
        dropdownMenu: generateRandomDropdownMenuItems(5, (i, item) => {
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
        dropdownMenu: generateRandomDropdownMenuItems(200, (i, item) => {
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
        dropdownMenu: generateRandomDropdownMenuItems(5, (i, item) => {
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
});
