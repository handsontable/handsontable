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
    it('should extend the cell selection to the right cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cells selection to the right when focus is moved within a range', async() => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      await selectCells([[1, 1, 3, 4]]);
      await keyDownUp(['tab']); // move cell focus left
      await keyDownUp(['tab']); // move cell focus left
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);

      await keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);
    });

    it('should extend the cells selection to the right of the another active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[2, 2, 3, 2], [1, 3, 2, 3], [0, 4, 1, 4]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        |   : A : 1 :   :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 3,2',
        'highlight: 2,3 from: 1,3 to: 2,2',
        'highlight: 0,4 from: 0,4 to: 1,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        |   : 0 : 1 : 0 :   |
        |   :   : A : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 3,2 from: 2,2 to: 3,1',
        'highlight: 1,2 from: 1,3 to: 2,2',
        'highlight: 0,4 from: 0,4 to: 1,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 : 0 :   :   :   |
        | A : 1 : 0 :   :   |
        |   : 0 : 1 : 0 :   |
        |   :   : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,1 from: 2,2 to: 3,1',
        'highlight: 1,2 from: 1,3 to: 2,2',
        'highlight: 1,4 from: 0,4 to: 1,3',
      ]);
    });
  });
});
