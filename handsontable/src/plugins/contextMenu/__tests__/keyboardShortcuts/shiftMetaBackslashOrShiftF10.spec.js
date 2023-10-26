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
    ['Shift', 'Control/Meta', '\\'],
    ['Shift', 'F10'],
  ], (keyboardShortcut) => {
    it('should open a menu after `updateSettings` call', () => {
      handsontable({
        contextMenu: true,
      });

      selectCell(1, 1);

      updateSettings({
        contextMenu: true,
      });

      const plugin = getPlugin('contextMenu');

      spyOn(plugin, 'open').and.callThrough();
      keyDownUp(keyboardShortcut);

      expect(plugin.open).toHaveBeenCalledTimes(1);
    });

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
