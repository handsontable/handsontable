describe('Selection navigation (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Ctrl/Cmd + ArrowDown"', () => {
    it('should move the cell selection to the last cell (last row) in a column', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
      expect(`
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   : # :   ║ - |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 4,3']);
      expect(`
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   : # :   :   :   ║ - |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   : # :   :   ║ - |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most bottom header in a column (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,-1 from: 4,-1 to: 4,-1']);
    });
  });
});
