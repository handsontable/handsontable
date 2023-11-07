describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyFocusOnTabNavigation', () => {
    it('should be fired once the table is activated by TAB navigation (focus comes from the element above)', () => {
      const modifyFocusOnTabNavigation = jasmine.createSpy('modifyFocusOnTabNavigation');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyFocusOnTabNavigation,
      });

      triggerTabNavigationFromTop();

      expect(modifyFocusOnTabNavigation).toHaveBeenCalledWith('from_above', cellCoords(0, 0));
      expect(modifyFocusOnTabNavigation).toHaveBeenCalledTimes(1);
    });

    it('should be possible to change the focus selection after TAB navigation (focus comes from the element above)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyFocusOnTabNavigation(dir, coords) {
          coords.row = 2;
          coords.col = 3;
        },
      });

      triggerTabNavigationFromTop();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 2,3 to: 2,3']);
    });

    it('should be possible to change the focus selection to headers after TAB navigation (focus comes from the element above)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        modifyFocusOnTabNavigation(dir, coords) {
          coords.row = -1;
          coords.col = 1;
        },
      });

      triggerTabNavigationFromTop();

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should be fired once the table is activated by TAB navigation (focus comes from the element below)', () => {
      const modifyFocusOnTabNavigation = jasmine.createSpy('modifyFocusOnTabNavigation');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyFocusOnTabNavigation,
      });

      triggerTabNavigationFromBottom();

      expect(modifyFocusOnTabNavigation).toHaveBeenCalledWith('from_below', cellCoords(4, 4));
      expect(modifyFocusOnTabNavigation).toHaveBeenCalledTimes(1);
    });

    it('should be possible to change the focus selection after TAB navigation (focus comes from the element below)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyFocusOnTabNavigation(dir, coords) {
          coords.row = 3;
          coords.col = 2;
        },
      });

      triggerTabNavigationFromBottom();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 3,2']);
    });

    it('should be possible to change the focus selection to headers after TAB navigation (focus comes from the element below)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        modifyFocusOnTabNavigation(dir, coords) {
          coords.row = 1;
          coords.col = -1;
        },
      });

      triggerTabNavigationFromTop();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
    });
  });
});
