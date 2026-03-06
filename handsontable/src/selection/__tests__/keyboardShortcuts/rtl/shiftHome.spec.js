describe('Selection extending (RTL mode)', () => {
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

  describe('"Shift + Home"', () => {
    it('should extend the cell selection to the right-most cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
    });

    it('should extend the cell selection to the right-most cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   :   : 0 : 0 : 0 |
        |   :   : A : 0 : 0 |
        |   :   : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,0']);
    });

    it('should extend the cell selection to the right-most cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCells([[2, 3, 3, 3], [0, 1, 1, 1]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   : 0 : 0 : 0 : 0 |
        |   : A : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 2,3 to: 3,0']);
    });

    it('should extend the column header selection to the right-most column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

      expect(`
        |   : * : * : * : * ║   |
        |===:===:===:===:===:===|
        |   : A : 0 : 0 : 0 ║ - |
        |   : 0 : 0 : 0 : 0 ║ - |
        |   : 0 : 0 : 0 : 0 ║ - |
        |   : 0 : 0 : 0 : 0 ║ - |
        |   : 0 : 0 : 0 : 0 ║ - |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,0']);
    });

    it('should extend the cell selection to the right-most non-frozen cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   |   :   |
        |   : A : 0 |   :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cell selection to the right-most non-frozen cell when inline start overlay is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 3,
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   : 0 | 0 : A :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,3']);
    });

    it('should extend the cell selection to the right-most non-frozen cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
        fixedColumnsStart: 1,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   |   |
        |   :   : 0 : 0 |   |
        |   :   : A : 0 |   |
        |   :   : 0 : 0 |   |
        |   :   :   :   |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,1']);
    });

    it('should extend the column header selection to the right-most non-frozen column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

      expect(`
        |   : * : * |   :   ║   |
        |===:===:===:===:===:===|
        |   : A : 0 |   :   ║ - |
        |   : 0 : 0 |   :   ║ - |
        |   : 0 : 0 |   :   ║ - |
        |   : 0 : 0 |   :   ║ - |
        |   : 0 : 0 |   :   ║ - |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,2']);
    });
  });
});
