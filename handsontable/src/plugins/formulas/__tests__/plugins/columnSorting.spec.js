import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('columnSorting', () => {
    describe('DEV-1713: formula in fixed bottom row', () => {
      it('should keep `=SUM(C1:C4)` computing correctly after sorting column C descending', async() => {
        handsontable({
          data: [
            ['Apple', 'Q1', 10],
            ['Banana', 'Q2', 20],
            ['Cherry', 'Q3', 30],
            ['Date', 'Q4', 40],
            ['Total', '', '=SUM(C1:C4)'],
          ],
          colHeaders: ['A', 'B', 'C'],
          fixedRowsBottom: 1,
          columnSorting: true,
          formulas: {
            engine: HyperFormula,
          },
        });

        // sanity: footer computes before any sort
        expect(getDataAtCell(4, 2)).toBe(100);

        getPlugin('columnSorting').sort({ column: 2, sortOrder: 'desc' });

        // footer still pinned and still computing
        expect(getDataAtCell(4, 0)).toBe('Total');
        expect(getDataAtCell(4, 2)).toBe(100);

        // data rows sorted desc
        expect(getDataAtCol(2).slice(0, 4)).toEqual([40, 30, 20, 10]);
      });
    });
  });
});
