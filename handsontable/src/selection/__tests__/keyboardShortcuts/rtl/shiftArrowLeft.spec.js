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
    it('should extend the cell selection to the left cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,3']);
    });

    it('should extend the cells selection to the left when focus is moved within a range', async() => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      await selectCells([[1, 4, 3, 1]]);
      await keyDownUp(['shift', 'tab']); // move cell focus right
      await keyDownUp(['shift', 'tab']); // move cell focus right
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        |   : 0 : 0 : A :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,4 to: 3,2']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        | 0 : 0 : 0 : A :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);
    });

    it('should extend the cells selection to the left of the another active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[0, 0, 1, 0], [1, 1, 2, 1], [2, 2, 3, 2]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   : 0 |
        |   :   : 0 : 0 : 0 |
        |   :   : 1 : A :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,0',
        'highlight: 2,1 from: 1,1 to: 2,2',
        'highlight: 2,2 from: 2,2 to: 3,2',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   : 0 : 0 |
        |   :   : 0 : 1 : A |
        |   :   : 1 : 0 :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,0 from: 0,0 to: 1,1',
        'highlight: 1,1 from: 1,1 to: 2,2',
        'highlight: 2,2 from: 2,2 to: 3,2',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   : 0 : 0 |
        |   :   : 0 : 1 : 0 |
        |   : 0 : 1 : 0 :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 1,1 from: 1,1 to: 2,2',
        'highlight: 3,2 from: 2,2 to: 3,3',
      ]);
    });
  });
});
