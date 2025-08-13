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
    it('should move the cell selection to the most left cell in a row', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

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

      await selectCells([[3, 1, 1, 3]]);
      await keyDownUp(['control/meta', 'arrowleft']);

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

      await selectRows(2);
      await keyDownUp(['control/meta', 'arrowleft']);

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

    it('should move the cell selection to the most left cell in a row (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

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

      await selectCells([[3, 1, 1, 3]]);
      await keyDownUp(['control/meta', 'arrowleft']);

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

      await selectRows(2);
      await keyDownUp(['control/meta', 'arrowleft']);

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

    it('should move the cell selection to the most left cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 2, 1, 2], [3, 2, 4, 2]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | # :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
    });

    it('should move the header selection to the most left header in a row (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
    });
  });
});
