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
    it('should extend the cell selection up by the height of the table viewport', async() => {
      const height = 120;
      const pageSize = expectedVisibleRows(height, 0);
      const totalRows = 15;
      const startRow = 13;

      handsontable({
        width: 180,
        height,
        startRows: totalRows,
        startCols: 3,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
      });

      await selectCell(startRow, 1);

      // Each shift+pageup extends the selection upward by pageSize rows
      let topRow = Math.max(startRow - pageSize, 0);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRange()).toEqualCellRange([`highlight: ${startRow},1 from: ${startRow},1 to: ${topRow},1`]);

      topRow = Math.max(topRow - pageSize, 0);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRange()).toEqualCellRange([`highlight: ${startRow},1 from: ${startRow},1 to: ${topRow},1`]);

      topRow = Math.max(topRow - pageSize, 0);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRange()).toEqualCellRange([`highlight: ${startRow},1 from: ${startRow},1 to: ${topRow},1`]);

      topRow = Math.max(topRow - pageSize, 0);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRange()).toEqualCellRange([`highlight: ${startRow},1 from: ${startRow},1 to: ${topRow},1`]);
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

    it('should scroll the viewport repeatedly by the same number of pixels with ' +
      'keeping the initial selection viewport offset', async() => {
      const height = 252;

      handsontable({
        width: 180,
        height,
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

      // compute the offset between the selection anchor and the first visible row
      const rowOffset = 95 - tableView().getFirstFullyVisibleRow();

      await keyDownUp(['shift', 'pageup']);

      // the relative offset between the selection edge and first visible row should be preserved
      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + rowOffset);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + rowOffset);

      await keyDownUp(['shift', 'pageup']);

      expect(getSelectedRangeLast().to.row).toBe(tableView().getFirstFullyVisibleRow() + rowOffset);
    });

  });
});
