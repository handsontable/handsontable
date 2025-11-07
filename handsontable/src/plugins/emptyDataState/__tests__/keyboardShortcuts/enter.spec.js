describe('EmptyDataState keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Enter"', () => {
    it('should return the focus to the grid when "Reset filters" button is clicked', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        emptyDataState: true,
        filters: true,
        navigableHeaders: true,
        colHeaders: true,
        rowHeaders: true,
      });

      await selectCell(-1, 2);

      getPlugin('filters').addCondition(2, 'eq', ['John']); // filter all rows
      getPlugin('filters').filter();

      getEmptyDataStateButtonElement().focus();

      await simulateClick(getEmptyDataStateButtonElement());

      expect(getShortcutManager().getActiveContextName()).toBe('grid');
      expect(getFocusScopeManager().getActiveScopeId()).toBe('grid');
      expect(isListening()).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });
  });
});
