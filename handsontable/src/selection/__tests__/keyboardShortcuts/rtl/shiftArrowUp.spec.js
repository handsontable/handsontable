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
      $('body').find(`#${id}`).remove();
    }
  });

  describe('"Shift + ArrowUp"', () => {
    it('should extend the cell selection up when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 1);
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   :   :   : 0 :   |
        |   :   :   : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 1,1']);
    });
  });
});
