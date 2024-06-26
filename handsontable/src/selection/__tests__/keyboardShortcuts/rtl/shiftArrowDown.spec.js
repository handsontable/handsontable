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

  describe('"Shift + ArrowDown"', () => {
    it('should extend the cell selection down when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 1);
      keyDownUp(['shift', 'arrowdown']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   : A :   |
        |   :   :   : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 3,1']);
    });
  });
});
