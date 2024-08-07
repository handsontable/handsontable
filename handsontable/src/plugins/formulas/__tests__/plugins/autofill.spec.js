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

  describe('Integration with Autofill', () => {
    it('should allow dragging the fill handle outside of the table, adding new rows and performing autofill', async() => {
      const hot = handsontable({
        data: [
          ['test', 2, '=UPPER($A$1)', 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6],
          [1, 2, 3, 4, 5, 6]
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        fillHandle: true
      });

      selectCell(0, 2);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      expect(hot.countRows()).toBe(4);

      await sleep(300);
      expect(hot.countRows()).toBe(5);

      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');

      await sleep(300);
      expect(hot.countRows()).toBe(6);

      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseup');

      await sleep(300);

      expect(hot.getData()).toEqual([
        ['test', 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [1, 2, 'TEST', 4, 5, 6],
        [null, null, 'TEST', null, null, null],
        [null, null, null, null, null, null]
      ]);

      expect(hot.getSourceData()).toEqual([
        ['test', 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [1, 2, '=UPPER($A$1)', 4, 5, 6],
        [null, null, '=UPPER($A$1)', null, null, null],
        [null, null, null, null, null, null]
      ]);
    });

    it('should cooperate properly with trimmed rows (populating not trimmed elements)', async() => {
      const hot = handsontable({
        data: [
          ['=B1+10', 1, 2, 3, 4, 5, 6],
          ['=B2+20', 7, 8, 9, 0, 1, 2],
          ['=B3+30', 3, 4, 5, 6, 7, 8],
          ['=B4+40', 9, 0, 1, 2, 3, 4],
          ['=B5+50', 5, 6, 7, 8, 9, 0],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        trimRows: [0, 1],
        fillHandle: true
      });

      selectRows(0);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tr:last-child td:eq(0)').simulate('mouseover');

      await sleep(300);

      spec().$container.find('tr:last-child td:eq(0)').simulate('mouseup');

      expect(hot.getData()).toEqual([
        [33, 3, 4, 5, 6, 7, 8],
        [33, 3, 4, 5, 6, 7, 8],
        [33, 3, 4, 5, 6, 7, 8],
        [null, null, null, null, null, null, null],
      ]);
    });

    xit('should cooperate properly with trimmed rows (populating two elements placed next to trimmed element)', async() => {
      const hot = handsontable({
        data: [
          ['=B1+10', 1, 2, 3, 4, 5, 6],
          ['=B2+20', 7, 8, 9, 0, 1, 2],
          ['=B3+30', 3, 4, 5, 6, 7, 8],
          ['=B4+40', 9, 0, 1, 2, 3, 4],
          ['=B5+50', 5, 6, 7, 8, 9, 0],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        trimRows: [1],
        fillHandle: true
      });

      selectRows(0, 1);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tr:last-child td:eq(0)').simulate('mouseover');

      await sleep(300);

      spec().$container.find('tr:last-child td:eq(0)').simulate('mouseup');

      expect(hot.getData()).toEqual([
        [11, 1, 2, 3, 4, 5, 6],
        [33, 3, 4, 5, 6, 7, 8],
        [11, 1, 2, 3, 4, 5, 6],
        [33, 3, 4, 5, 6, 7, 8],
        [null, null, null, null, null, null, null],
      ]);
    });
  });
});
