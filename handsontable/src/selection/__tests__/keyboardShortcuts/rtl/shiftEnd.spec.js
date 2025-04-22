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
    it('should extend the cell selection to the right-most cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cell selection to the right-most cell of the current row starting from the focus position', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      selectCell(1, 2, 3, 4);
      keyDownUp('enter'); // Move focus down
      keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        | 0 : 0 : A :   :   |
        | 0 : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,4']);
    });

    it('should extend the column header selection to the right-most column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(2);
      listen();
      keyDownUp(['shift', 'end']);

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
