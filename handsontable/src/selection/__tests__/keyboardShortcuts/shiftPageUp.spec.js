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

  describe('"Shift + PageUp"', () => {
    it.forTheme('classic')('should extend the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 9,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 5,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 1,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 0,1']);
    });

    it.forTheme('main')('should extend the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 120, // 120/28 (cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 9,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 5,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 1,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 0,1']);
    });

    it.forTheme('horizon')('should extend the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 153, // 153/37 (cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 9,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 5,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 1,1']);

      await keyDownUp(['shift', 'pageup']);

      expect(`
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
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 0,1']);
    });

    it('should extend the cell selection up only for active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 8,
      });

      await selectCells([[4, 0, 4, 1], [3, 3, 3, 4], [2, 6, 2, 7]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer

      // eslint-disable-next-line handsontable/require-await
      keyDownUp(['shift', 'pageup']); // with await it triggers timeout error

      expect(`
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   :   :   |
        |   :   :   : 0 : 0 :   : 0 : 0 |
        |   :   :   : 0 : A :   :   :   |
        | 0 : 0 :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 4,0 from: 4,0 to: 4,1',
        'highlight: 3,4 from: 3,3 to: 0,4',
        'highlight: 2,6 from: 2,6 to: 2,7',
      ]);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'pageup']);

      expect(`
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : A :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 4,1 from: 4,0 to: 0,1',
        'highlight: 0,3 from: 3,3 to: 0,4',
        'highlight: 2,6 from: 2,6 to: 2,7',
      ]);

      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'pageup']);

      expect(`
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
        | 0 : 0 :   : 0 : 0 :   : 0 : 0 |
        | 0 : 0 :   : 0 : 0 :   : 0 : A |
        | 0 : 0 :   : 0 : 0 :   :   :   |
        | 0 : 0 :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 4,0 to: 0,1',
        'highlight: 0,3 from: 3,3 to: 0,4',
        'highlight: 2,7 from: 2,6 to: 0,7',
      ]);
    });

    it.forTheme('classic')('should scroll the viewport repeatedly by the same number of pixels with ' +
      'keeping the initial selection viewport offset', async() => {
      handsontable({
        width: 180,
        height: 200,
        startRows: 100,
        startCols: 3
      });

      await selectCell(95, 1);
      // scroll the viewport in that way the cell highlight is in the middle of the table viewport
      await scrollViewportTo({
        row: 99,
        col: 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);
    });

    it.forTheme('main')('should scroll the viewport repeatedly by the same number of pixels with keeping the initial ' +
      'selection viewport offset', async() => {
      handsontable({
        width: 180,
        height: 252,
        startRows: 100,
        startCols: 3
      });

      await selectCell(95, 1);
      // scroll the viewport in that way the cell highlight is in the middle of the table viewport
      await scrollViewportTo({
        row: 99,
        col: 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);
    });

    it.forTheme('horizon')('should scroll the viewport repeatedly by the same number of pixels with ' +
      'keeping the initial selection viewport offset', async() => {
      handsontable({
        width: 180,
        height: 322,
        startRows: 100,
        startCols: 3
      });

      await selectCell(95, 1);
      // scroll the viewport in that way the cell highlight is in the middle of the table viewport
      await scrollViewportTo({
        row: 99,
        col: 1,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + 3);
    });
  });
});
