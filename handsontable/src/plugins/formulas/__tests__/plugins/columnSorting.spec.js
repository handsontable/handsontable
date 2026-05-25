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

  describe('multiColumnSorting', () => {
    describe('DEV-1713: multiple formulas in fixed bottom row', () => {
      it('should keep multiple footer formulas computing after multi-column sort', async() => {
        handsontable({
          data: [
            ['North', 'Apple', 10, 12, 14, 18],
            ['South', 'Banana', 20, 22, 24, 28],
            ['East', 'Cherry', 30, 32, 34, 38],
            ['West', 'Date', 40, 42, 44, 48],
            ['North', 'Elder', 15, 17, 19, 23],
            ['South', 'Fig', 25, 27, 29, 33],
            ['Total', '', '=SUM(C1:C6)', '=SUM(D1:D6)', '=SUM(E1:E6)', '=AVERAGE(F1:F6)'],
          ],
          colHeaders: ['Region', 'Product', 'Q1', 'Q2', 'Q3', 'Q4'],
          fixedRowsBottom: 1,
          multiColumnSorting: true,
          formulas: {
            engine: HyperFormula,
          },
        });

        // sanity: footer formulas compute before sort
        expect(getDataAtCell(6, 2)).toBe(140);
        expect(getDataAtCell(6, 3)).toBe(152);
        expect(getDataAtCell(6, 4)).toBe(164);
        expect(getDataAtCell(6, 5)).toBeCloseTo(31.3333333, 6);

        getPlugin('multiColumnSorting').sort([
          { column: 0, sortOrder: 'asc' },
          { column: 5, sortOrder: 'desc' },
        ]);

        // footer label and all four formulas still pinned and still computing
        expect(getDataAtCell(6, 0)).toBe('Total');
        expect(getDataAtCell(6, 2)).toBe(140);
        expect(getDataAtCell(6, 3)).toBe(152);
        expect(getDataAtCell(6, 4)).toBe(164);
        expect(getDataAtCell(6, 5)).toBeCloseTo(31.3333333, 6);

        // data rows: Region asc, then Q4 desc within each region
        expect(getDataAtCol(0).slice(0, 6)).toEqual(['East', 'North', 'North', 'South', 'South', 'West']);
        expect(getDataAtCol(5).slice(0, 6)).toEqual([38, 23, 18, 33, 28, 48]);
      });
    });
  });
});
