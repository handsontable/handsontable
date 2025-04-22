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

  describe('"Ctrl/Cmd + ArrowLeft"', () => {
    it('should move the cell selection to the most left cell in a row', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the most left cell in a row (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most left header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
    });
  });
});
