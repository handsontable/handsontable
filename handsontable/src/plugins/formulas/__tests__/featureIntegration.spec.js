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
    it('should allow inserting rows and columns with the formula plugin enabled', async() => {
      handsontable({
        data: [['foo', null], ['=A1', null]],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
      });

      await alter('insert_row_above', 0, 1);
      await alter('insert_row_above', 2, 1);
      await alter('insert_row_above', countRows(), 1);

      expect(countRows()).toEqual(5);

      await alter('insert_col_start', 0, 1);
      await alter('insert_col_start', 2, 1);
      await alter('insert_col_start', countCols(), 1);

      expect(countCols()).toEqual(5);
    });

    it('should work properly when indexes are reorganised and some rows/columns are inserted', async() => {
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
      await render();

      await alter('insert_col_start', 0, 1);
      await alter('insert_row_above', 0, 1);
      await alter('insert_row_below', 1, 1);

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

    it('should work properly when indexes are reorganised and some rows/columns are removed', async() => {
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

      await render();

      await alter('remove_row', 2, 2);
      await alter('remove_row', 2, 1);

      await render();

      expect(getData()).toEqual([
        [1001115, 1115, 115, 15, 5],
        [1001114, 1114, 114, 14, 4],
      ]);
    });
  });

  describe('Integration with minSpareRows/minSpareCols', () => {
    it('should display the minSpareRows and minSpareCols properly', async() => {
      handsontable({
        data: [[1, 'x'], ['=A1 + 1', 'y']],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        minSpareRows: 3,
        minSpareCols: 3,
      });

      expect(countRows()).toEqual(5);
      expect(countCols()).toEqual(5);
      expect(getData()).toEqual([
        [1, 'x', null, null, null],
        [2, 'y', null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null]
      ]);
    });
  });

  describe('Integration with TrimRows and ColumnSorting plugins', () => {
    it('sorting dataset with one trimmed element', async() => {
      handsontable({
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

      getPlugin('trimRows').untrimAll();

      await render();

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

      getPlugin('trimRows').trimRows([3]);

      await render();

      getPlugin('columnSorting').sort({
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

      getPlugin('trimRows').untrimAll();

      await render();

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

      getPlugin('trimRows').trimRows([3]);

      await render();

      getPlugin('columnSorting').sort({
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

      getPlugin('trimRows').untrimAll();

      await render();

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

      getPlugin('trimRows').trimRows([3]);
      getPlugin('columnSorting').clearSort();

      await render();

      expect(getData()).toEqual([
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

      getPlugin('trimRows').untrimAll();

      await render();

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
    });
  });

  describe('Integration with the Autocomplete cell type with object-based key/value source', () => {
    it('should utilize the visible values of the object-based, key/value autocomplete cells in the formulas engine', async() => {
      const errorSpy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;
      const airportKVData = [
        { key: 'LAX', value: 'Los Angeles International Airport' },
        { key: 'JFK', value: 'John F. Kennedy International Airport' },
        { key: 'ORD', value: 'Chicago O\'Hare International Airport' },
        { key: 'LHR', value: 'London Heathrow Airport' },
      ];
      const nestedAirportObjectKVData = [
        {
          key: 'LAX',
          value: { key: 'LAX', value: 'Los Angeles International Airport' },
          formulas: '=CONCATENATE(B1, B2)',
        },
        {
          key: 'JFK',
          value: { key: 'JFK', value: 'John F. Kennedy International Airport' },
          formulas: null,
        },
      ];

      window.onerror = errorSpy.test;

      handsontable({
        data: nestedAirportObjectKVData,
        rowHeaders: true,
        colHeaders: true,
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        columns: [
          {
            data: 'key',
          },
          {
            data: 'value',
            type: 'autocomplete',
            source: airportKVData,
          },
          {
            data: 'formulas',
            type: 'text',
          }],
      });

      expect(getDataAtCell(0, 2)).toEqual('Los Angeles International AirportJohn F. Kennedy International Airport');
      expect(errorSpy.test).not.toHaveBeenCalled();

      window.onerror = prevError;
    });
  });
});
