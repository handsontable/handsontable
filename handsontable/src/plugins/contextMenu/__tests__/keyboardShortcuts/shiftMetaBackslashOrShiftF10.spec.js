describe('ContextMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  using('', [
    ['Shift', 'Control/Meta', 'Backslash'],
    ['Shift', 'F10'],
  ], (keyboardShortcut) => {
    it('should not throw an error when triggered on selection that points on the hidden records', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };
      handsontable({
        contextMenu: true,
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);

      await render();
      await selectCell(1, 1);

      await keyDownUp(keyboardShortcut);

      expect(spy.test.calls.count()).toBe(0);

      window.onerror = prevError;
    });

    it('should open a menu after `updateSettings` call', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCell(1, 1);

      await updateSettings({
        contextMenu: true,
      });

      const plugin = getPlugin('contextMenu');

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
    });

    it('should internally call `open()` method with correct cell coordinates', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCell(1, 1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(1, 1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct cell coordinates - active second selection layer', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCells([
        [0, 0, 2, 2],
        [2, 1, 2, 3],
        [1, 4, 3, 4],
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // select C3 of the second layer

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(2, 2).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct row header coordinates', async() => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(1, -1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct column header coordinates', async() => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(-1, 1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should internally call `open()` method with correct corner coordinates', async() => {
      handsontable({
        contextMenu: true,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);

      const plugin = getPlugin('contextMenu');
      const cellRect = getCell(-1, -1).getBoundingClientRect();

      spyOn(plugin, 'open').and.callThrough();
      await keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
    });

    it('should open the menu and select the first item by default', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCell(1, 1);
      await keyDownUp(keyboardShortcut);

      const firstItem = getPlugin('contextMenu').menu.hotMenu.getCell(0, 0);

      expect(document.activeElement).toBe(firstItem);
    });

    it('should scroll the viewport when the focused cell is outside the table and call the `open` method', async() => {
      handsontable({
        data: createSpreadsheetData(500, 50),
        width: 300,
        height: 300,
        contextMenu: true,
      });

      await selectCell(400, 40);
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      const plugin = getPlugin('contextMenu');

      spyOn(plugin, 'open').and.callThrough();

      await keyDownUp(keyboardShortcut);

      const cellRect = getCell(400, 40).getBoundingClientRect();

      expect(plugin.open).toHaveBeenCalledTimes(1);
      expect(plugin.open).toHaveBeenCalledWith({
        left: cellRect.left,
        top: cellRect.top + cellRect.height - 1,
      }, {
        left: cellRect.width,
        above: -cellRect.height,
      });
      expect(inlineStartOverlay().getScrollPosition())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(1766);
          main.toBe(1961);
          horizon.toBe(2284);
        });
      expect(topOverlay().getScrollPosition())
        .forThemes(({ classic, main, horizon }) => {
          classic.toBe(8939);
          main.toBe(11345);
          horizon.toBe(14553);
        });
    });

    it('should not close the menu after hitting the same shortcut many times', async() => {
      handsontable({
        contextMenu: true,
      });

      await selectCell(1, 1);

      await keyDownUp(keyboardShortcut);
      await keyDownUp(keyboardShortcut);
      await keyDownUp(keyboardShortcut);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');

      expect($contextMenu.length).toBe(1);
    });
  });
});
