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

  describe('"Shift + ArrowRight"', () => {
    it('should extend the cell selection to the right cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 3);
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cells selection to the right when focus is moved within a range', () => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      selectCells([[1, 1, 3, 4]]);
      keyDownUp(['tab']); // move cell focus left
      keyDownUp(['tab']); // move cell focus left
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,1 to: 3,3']);

      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);
    });
  });
});
