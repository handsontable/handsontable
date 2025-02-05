describe('Selection extending', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Shift + PageDown"', () => {
    it.forTheme('classic')('should extend the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 5,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 9,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 13,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 14,1']);
    });

    it.forTheme('main')('should extend the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 120, // 120/28 (cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 5,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 9,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 13,1']);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 14,1']);
    });

    it('should scroll the viewport repeatedly by the same number of pixels with keeping the initial ' +
       'selection viewport offset', async() => {
      const hot = handsontable({
        width: 180,
        height: 200,
        startRows: 100,
        startCols: 3
      });

      // select and scroll the viewport in that way the cell highlight is in the middle of the table viewport
      selectCell(4, 1);

      await sleep(20);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);

      await sleep(20);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);
    });
  });
});
