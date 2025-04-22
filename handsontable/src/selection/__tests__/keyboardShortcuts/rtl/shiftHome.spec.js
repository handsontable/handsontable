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
    it('should extend the cell selection to the left-most cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 3);
      keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
    });

    it('should extend the cell selection to the left-most cell of the current row starting from the focus position', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      selectCell(1, 2, 3, 4);
      keyDownUp('enter'); // Move focus down
      keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   :   : 0 : 0 : 0 |
        |   :   : A : 0 : 0 |
        |   :   : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,0']);
    });

    it('should extend the column header selection to the left-most column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(3);
      listen();
      keyDownUp(['shift', 'home']);

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

    it('should extend the cell selection to the left-most non-frozen cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      selectCell(1, 3);
      keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   |   :   |
        |   : A : 0 |   :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cell selection to the left-most non-frozen cell when left overlay is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 3,
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   : 0 | 0 : A :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,3']);
    });

    it('should extend the cell selection to the left-most non-frozen cell of the current row starting from the focus position', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
        fixedColumnsStart: 1,
      });

      selectCell(1, 2, 3, 4);
      keyDownUp('enter'); // Move focus down
      keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   |   |
        |   :   : 0 : 0 |   |
        |   :   : A : 0 |   |
        |   :   : 0 : 0 |   |
        |   :   :   :   |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,1']);
    });

    it('should extend the column header selection to the left-most non-frozen column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      selectColumns(3);
      listen();
      keyDownUp(['shift', 'home']);

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
