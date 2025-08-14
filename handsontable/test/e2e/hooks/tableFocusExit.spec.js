describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('tableFocusExit', () => {
    it('should be fired when the table is deactivated by TAB navigation (going to element above)', async() => {
      const tableFocusExit = jasmine.createSpy('tableFocusExit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit,
      });

      await selectCell(0, 0);
      await listen();

      await keyDownUp(['shift', 'tab']);

      expect(tableFocusExit).toHaveBeenCalledWith('top');
      expect(tableFocusExit).toHaveBeenCalledTimes(1);
    });

    it('should be fired when the table is deactivated by TAB navigation (going to element below)', async() => {
      const tableFocusExit = jasmine.createSpy('tableFocusExit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit,
      });

      await selectCell(5, 5);
      await listen();

      await keyDownUp('tab');

      expect(tableFocusExit).toHaveBeenCalledWith('bottom');
      expect(tableFocusExit).toHaveBeenCalledTimes(1);
    });

    it('should prevent table deactivation when hook returns false (going to element above)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit() {
          return false;
        },
      });

      await selectCell(0, 0);
      await listen();

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(true);
    });

    it('should prevent table deactivation when hook returns false (going to element below)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit() {
          return false;
        },
      });

      await selectCell(5, 5);
      await listen();

      await keyDownUp('tab');

      expect(isListening()).toBe(true);
    });

    it('should allow table deactivation when hook returns undefined (going to element above)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit() {
          return undefined;
        },
      });

      await selectCell(0, 0);
      await listen();

      await keyDownUp(['shift', 'tab']);

      expect(isListening()).toBe(false);
    });

    it('should allow table deactivation when hook returns undefined (going to element below)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit() {
          return undefined;
        },
      });

      await selectCell(5, 5);
      await listen();

      await keyDownUp('tab');

      expect(isListening()).toBe(false);
    });

    it('should be fired with correct direction based on Shift+Tab vs Tab', async() => {
      const tableFocusExit = jasmine.createSpy('tableFocusExit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        tableFocusExit,
      });

      await selectCell(0, 0);
      await listen();

      // Test Shift+Tab (going to element above)
      await keyDownUp(['shift', 'tab']);
      expect(tableFocusExit).toHaveBeenCalledWith('top');

      // Reset spy
      tableFocusExit.calls.reset();

      // Test Tab (going to element below)
      await selectCell(5, 5);
      await listen();
      await keyDownUp('tab');
      expect(tableFocusExit).toHaveBeenCalledWith('bottom');
    });
  });
});
