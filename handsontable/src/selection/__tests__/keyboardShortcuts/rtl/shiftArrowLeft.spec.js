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

  describe('"Shift + ArrowLeft"', () => {
    it('should extend the cell selection to the left cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,3']);
    });

    it('should extend the cells selection to the left when focus is moved within a range', () => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      selectCells([[1, 4, 3, 1]]);
      keyDownUp(['shift', 'tab']); // move cell focus right
      keyDownUp(['shift', 'tab']); // move cell focus right
      keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        |   : 0 : 0 : A :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,4 to: 3,2']);

      keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        | 0 : 0 : 0 : A :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);

      keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);
    });
  });
});
