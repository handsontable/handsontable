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

  describe('"Ctrl/Cmd + A"', () => {
    it('should reset the current selection and select all cells without headers', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      await keyDownUp(['control/meta', 'a']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : A : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,-1 to: 4,4']);
    });

    it('should reset the current selection and select all cells keeping the focus position unchanged', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCells([[0, 0, 2, 2], [3, 3, 4, 4]]);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control/meta', 'a']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : A : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: -1,-1 to: 4,4']);
    });

    it('should do nothing when pressing the shortcut with a header being selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(0, 0);
      await keyDownUp(['ArrowLeft']);
      await keyDownUp(['control/meta', 'a']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      await selectCell(0, 0);
      await keyDownUp(['ArrowUp']);
      await keyDownUp(['control/meta', 'a']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should not throw an error when there is no selection', async() => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await listen();
      await keyDownUp(['control/meta', 'a']);

      expect(spy.test).not.toHaveBeenCalled();

      window.onerror = prevError;
    });
  });
});
