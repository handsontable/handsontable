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

  describe('"Ctrl/Cmd + ArrowRight"', () => {
    it('should move the cell selection to the most right cell in a row', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the most right cell in a row (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most right column header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });
  });
});
