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

  describe('"Shift + End"', () => {
    it('should extend the cell selection to the left-most cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cell selection to the left-most cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        | 0 : 0 : A :   :   |
        | 0 : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,4']);
    });

    it('should extend the cell selection to the left-most cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCells([[2, 1, 3, 1], [0, 3, 1, 3]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 2,1 to: 3,4']);
    });

    it('should extend the column header selection to the left-most column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(2);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        | * : * : * :   :   ║   |
        |===:===:===:===:===:===|
        | 0 : 0 : A :   :   ║ - |
        | 0 : 0 : 0 :   :   ║ - |
        | 0 : 0 : 0 :   :   ║ - |
        | 0 : 0 : 0 :   :   ║ - |
        | 0 : 0 : 0 :   :   ║ - |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,4']);
    });
  });
});
