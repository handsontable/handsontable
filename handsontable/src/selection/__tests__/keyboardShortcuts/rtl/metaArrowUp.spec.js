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

  describe('"Ctrl/Cmd + ArrowUp"', () => {
    it('should move the cell selection to the first cell (first row) in a column', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(3, 3);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      expect(`
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   : # :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   : # :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   : # :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the first cell (first row) in a column (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(3, 3);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      expect(`
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   : # :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   : # :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   : # :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most top header in a column (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(3, -1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });
  });
});
