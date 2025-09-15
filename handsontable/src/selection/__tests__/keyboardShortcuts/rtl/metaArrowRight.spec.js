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
    it('should move the cell selection to the most right cell in a row', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(1, 3);
      await keyDownUp(['control/meta', 'arrowright']);

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

      await selectCells([[3, 3, 1, 1]]);
      await keyDownUp(['control/meta', 'arrowright']);

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

      await selectRows(2);
      await keyDownUp(['control/meta', 'arrowright']);

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

    it('should move the cell selection to the most right cell in a row (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(1, 3);
      await keyDownUp(['control/meta', 'arrowright']);

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

      await selectCells([[3, 3, 1, 1]]);
      await keyDownUp(['control/meta', 'arrowright']);

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

      await selectRows(2);
      await keyDownUp(['control/meta', 'arrowright']);

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

    it('should move the cell selection to the most right cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 2, 1, 2], [3, 2, 4, 2]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control/meta', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   : # |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });

    it('should move the header selection to the most right column header in a row (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 3);
      await keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });
  });
});
