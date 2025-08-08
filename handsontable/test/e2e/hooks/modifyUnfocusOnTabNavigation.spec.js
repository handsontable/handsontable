describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyUnfocusOnTabNavigation', () => {
    it('should be fired when the table is deactivated by TAB navigation (going to element above)', async() => {
      const modifyUnfocusOnTabNavigation = jasmine.createSpy('modifyUnfocusOnTabNavigation');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation,
      });

      await selectCell(0, 0);
      await listen();

      triggerTabNavigationToAbove();

      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledWith('to_above');
      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledTimes(1);
    });

    it('should be fired when the table is deactivated by TAB navigation (going to element below)', async() => {
      const modifyUnfocusOnTabNavigation = jasmine.createSpy('modifyUnfocusOnTabNavigation');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation,
      });

      await selectCell(5, 5);
      await listen();

      triggerTabNavigationToBelow();

      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledWith('to_below');
      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledTimes(1);
    });

    it('should prevent table deactivation when hook returns false (going to element above)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation() {
          return false;
        },
      });

      await selectCell(0, 0);
      await listen();

      triggerTabNavigationToAbove();

      expect(isListening()).toBe(true);
    });

    it('should prevent table deactivation when hook returns false (going to element below)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation() {
          return false;
        },
      });

      await selectCell(5, 5);
      await listen();

      triggerTabNavigationToBelow();

      expect(isListening()).toBe(true);
    });

    it('should allow table deactivation when hook returns undefined (going to element above)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation() {
          return undefined;
        },
      });

      await selectCell(0, 0);
      await listen();

      triggerTabNavigationToAbove();

      expect(isListening()).toBe(false);
    });

    it('should allow table deactivation when hook returns undefined (going to element below)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation() {
          return undefined;
        },
      });

      await selectCell(5, 5);
      await listen();

      triggerTabNavigationToBelow();

      expect(isListening()).toBe(false);
    });

    it('should be fired with correct direction based on Shift+Tab vs Tab', async() => {
      const modifyUnfocusOnTabNavigation = jasmine.createSpy('modifyUnfocusOnTabNavigation');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyUnfocusOnTabNavigation,
      });

      await selectCell(0, 0);
      await listen();

      // Test Shift+Tab (going to element above)
      triggerTabNavigationToAbove();
      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledWith('to_above');

      // Reset spy
      modifyUnfocusOnTabNavigation.calls.reset();

      // Test Tab (going to element below)
      await selectCell(5, 5);
      await listen();
      triggerTabNavigationToBelow();
      expect(modifyUnfocusOnTabNavigation).toHaveBeenCalledWith('to_below');
    });
  });
});
