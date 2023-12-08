describe('NestedHeaders navigation keyboard shortcuts', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container1 = $('<div id="testContainer1"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
    this.$container1.data('handsontable')?.destroy();
    this.$container1.remove();
  });

  describe('"Tab" with "Shift" + "Tab"', () => {
    it('should activate the table, allow traversing through the nested headers, and then leave the table', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(3, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        tabNavigation: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 4 }],
        ],
      });
      const hot1 = handsontable({
        data: createSpreadsheetData(3, 5),
        navigableHeaders: false,
        tabNavigation: true,
        nestedHeaders: [
          ['A', { label: 'B', colspan: 4 }],
        ],
      }, false, spec().$container1);

      triggerTabNavigationFromTop(); // emulates native browser Tab navigation

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      expect(hot1.getSelectedRange()).toBeUndefined();

      keyDownUp('tab');

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
      expect(hot1.getSelectedRange()).toBeUndefined();

      keyDownUp('tab');

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
      expect(hot1.getSelectedRange()).toBeUndefined();

      keyDownUp('tab');
      triggerTabNavigationFromTop(hot1); // emulates native browser Tab navigation

      expect(hot.getSelectedRange()).toBeUndefined();
      expect(hot1.getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);

      keyDownUp(['shift', 'tab']);
      triggerTabNavigationFromBottom(); // emulates native browser Tab navigation

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
      expect(hot1.getSelectedRange()).toBeUndefined();

      keyDownUp(['shift', 'tab']);

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
      expect(hot1.getSelectedRange()).toBeUndefined();

      keyDownUp(['shift', 'tab']);

      expect(hot.getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
      expect(hot1.getSelectedRange()).toBeUndefined();
    });
  });
});
