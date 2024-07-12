import HyperFormula from 'hyperformula';

describe('Formulas: Integration with other features', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Integration with alter', () => {
    it('should allow inserting rows and columns with the formula plugin enabled', () => {
      const hot = handsontable({
        data: [['foo', null], ['=A1', null]],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      alter('insert_row_above', 0, 1);
      alter('insert_row_above', 2, 1);
      alter('insert_row_above', hot.countRows(), 1);

      expect(hot.countRows()).toEqual(5);

      alter('insert_col_start', 0, 1);
      alter('insert_col_start', 2, 1);
      alter('insert_col_start', hot.countCols(), 1);

      expect(hot.countCols()).toEqual(5);
    });

    it('should work properly when indexes are reorganised and some rows/columns are inserted', () => {
      handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualRowMove: true,
        manualColumnMove: true,
      });

      getPlugin('manualRowMove').moveRows([4, 3, 2, 1, 0], 0);
      getPlugin('manualColumnMove').moveColumns([4, 3, 2, 1, 0], 0);
      render();

      alter('insert_col_start', 0, 1);
      alter('insert_row_above', 0, 1);
      alter('insert_row_below', 1, 1);

      expect(getData()).toEqual([
        [null, null, null, null, null, null],
        [null, 1001115, 1115, 115, 15, 5],
        [null, null, null, null, null, null],
        [null, 1001114, 1114, 114, 14, 4],
        [null, 1001113, 1113, 113, 13, 3],
        [null, 1001112, 1112, 112, 12, 2],
        [null, 1001111, 1111, 111, 11, 1],
      ]);
    });

    it('should work properly when indexes are reorganised and some rows/columns are removed', () => {
      handsontable({
        data: [
          [1, '=A1+10', '=B1+100', '=C1+1000', '=D1+1000000'],
          [2, '=A2+10', '=B2+100', '=C2+1000', '=D2+1000000'],
          [3, '=A3+10', '=B3+100', '=C3+1000', '=D3+1000000'],
          [4, '=A4+10', '=B4+100', '=C4+1000', '=D4+1000000'],
          [5, '=A5+10', '=B5+100', '=C5+1000', '=D5+1000000'],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        manualRowMove: true,
        manualColumnMove: true,
      });

      getPlugin('manualRowMove').moveRows([4, 3, 2, 1, 0], 0);
      getPlugin('manualColumnMove').moveColumns([4, 3, 2, 1, 0], 0);
      render();

      alter('remove_row', 2, 2);
      alter('remove_row', 2, 1);
      render();

      expect(getData()).toEqual([
        [1001115, 1115, 115, 15, 5],
        [1001114, 1114, 114, 14, 4],
      ]);
    });
  });

  describe('Integration with minSpareRows/minSpareCols', () => {
    it('should display the minSpareRows and minSpareCols properly', () => {
      const hot = handsontable({
        data: [[1, 'x'], ['=A1 + 1', 'y']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        minSpareRows: 3,
        minSpareCols: 3,
      });

      expect(hot.countRows()).toEqual(5);
      expect(hot.countCols()).toEqual(5);
      expect(hot.getData()).toEqual([
        [1, 'x', null, null, null],
        [2, 'y', null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null]
      ]);
    });
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

    it('should populate dates and formulas referencing to them properly', async() => {
      handsontable({
        data: [
          [null, null, null, null, null],
          [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
          [null, null, '=C2', '=D2', '=E2'],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        columns: [{}, {}, {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }, {
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }, {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
        fillHandle: true,
      });

      selectCells([[1, 2, 2, 4]]);

      spec().$container.find('.wtBorder.current.corner').simulate('mousedown');
      spec().$container.find('tr:last-child td:eq(2)').simulate('mouseover');
      spec().$container.find('tr:last-child td:eq(4)').simulate('mouseup');

      const formulasPlugin = getPlugin('formulas');

      await sleep(300);

      expect(getData()).toEqual([
        [null, null, null, null, null],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, null, null, null]
      ]);

      expect(getSourceData()).toEqual([
        [null, null, null, null, null],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C2', '=D2', '=E2'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C4', '=D4', '=E4'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C6', '=D6', '=E6'],
        [null, null, null, null, null]
      ]);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        [],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C2', '=D2', '=E2'],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C4', '=D4', '=E4'],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C6', '=D6', '=E6'],
      ]);

      expect(getCellMeta(3, 2).valid).toBe(false);
      expect(getCellMeta(3, 3).valid).toBe(true);
      expect(getCellMeta(3, 4).valid).toBe(false);

      expect(getCellMeta(4, 2).valid).toBe(false);
      expect(getCellMeta(4, 3).valid).toBe(true);
      expect(getCellMeta(4, 4).valid).toBe(false);

      expect(getCellMeta(5, 2).valid).toBe(false);
      expect(getCellMeta(5, 3).valid).toBe(true);
      expect(getCellMeta(5, 4).valid).toBe(false);

      expect(getCellMeta(6, 2).valid).toBe(false);
      expect(getCellMeta(6, 3).valid).toBe(true);
      expect(getCellMeta(6, 4).valid).toBe(false);
    });
  });

  describe('Integration with TrimRows and ColumnSorting plugins', () => {
    it('sorting dataset with one trimmed element', () => {
      const hot = handsontable({
        data: [
          ['$B$2', 1, '=$B$2'],
          ['$B$1', 100, '=$B$1'],
          ['$B$3', 10, '=$B$3'],
          ['$B$5', 5, '=$B$5'], // Trimmed row
          ['$B$1', 7, '=$B$1'],
          ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
        ],
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        formulas: {
          engine: HyperFormula
        },
        columnSorting: true,
        trimRows: [3],
      });

      hot.getPlugin('trimRows').untrimAll();
      hot.render();

      expect(getData()).toEqual([
        ['$B$2', 1, 100],
        ['$B$1', 100, 1],
        ['$B$3', 10, 10],
        ['$B$5', 5, 7], // Previously trimmed row
        ['$B$1', 7, 1],
        ['SUM($B$1:$B$3)', 3, 111],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Previously trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').trimRows([3]);
      hot.render();

      hot.getPlugin('columnSorting').sort({
        column: 1,
        sortOrder: 'asc'
      });

      expect(getData()).toEqual([
        ['$B$2', 1, 3],
        ['SUM($B$1:$B$3)', 3, 11],
        ['$B$1', 7, 1],
        // ['$B$5', 5, 10], // Trimmed row
        ['$B$3', 10, 7],
        ['$B$1', 100, 1],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').untrimAll();
      hot.render();

      expect(getData()).toEqual([
        ['$B$2', 1, 3],
        ['SUM($B$1:$B$3)', 3, 11],
        ['$B$1', 7, 1],
        ['$B$5', 5, 10], // Previously trimmed row
        ['$B$3', 10, 7],
        ['$B$1', 100, 1],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Previously trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').trimRows([3]);
      hot.render();

      hot.getPlugin('columnSorting').sort({
        column: 1,
        sortOrder: 'desc'
      });

      expect(getData()).toEqual([
        ['$B$1', 100, 100],
        ['$B$3', 10, 7],
        ['$B$1', 7, 100],
        // ['$B$5', 5, 3], // Trimmed row
        ['SUM($B$1:$B$3)', 3, 117],
        ['$B$2', 1, 10],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').untrimAll();
      hot.render();

      expect(getData()).toEqual([
        ['$B$1', 100, 100],
        ['$B$3', 10, 7],
        ['$B$1', 7, 100],
        ['$B$5', 5, 3], // Previously trimmed row
        ['SUM($B$1:$B$3)', 3, 117],
        ['$B$2', 1, 10],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Previously trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').trimRows([3]);
      hot.getPlugin('columnSorting').clearSort();
      hot.render();

      expect(hot.getData()).toEqual([
        ['$B$2', 1, 100],
        ['$B$1', 100, 1],
        ['$B$3', 10, 10],
        // ['$B$5', 5, 7], // Trimmed row
        ['$B$1', 7, 1],
        ['SUM($B$1:$B$3)', 3, 111],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);

      hot.getPlugin('trimRows').untrimAll();
      hot.render();

      expect(hot.getData()).toEqual([
        ['$B$2', 1, 100],
        ['$B$1', 100, 1],
        ['$B$3', 10, 10],
        ['$B$5', 5, 7], // Previously trimmed row
        ['$B$1', 7, 1],
        ['SUM($B$1:$B$3)', 3, 111],
      ]);

      expect(getSourceData()).toEqual([
        ['$B$2', 1, '=$B$2'],
        ['$B$1', 100, '=$B$1'],
        ['$B$3', 10, '=$B$3'],
        ['$B$5', 5, '=$B$5'], // Previously trimmed row
        ['$B$1', 7, '=$B$1'],
        ['SUM($B$1:$B$3)', 3, '=SUM($B$1:$B$3)'],
      ]);
    });
  });
});
