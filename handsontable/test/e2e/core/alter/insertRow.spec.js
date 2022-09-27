describe('Core.alter', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  const arrayOfNestedObjects = function() {
    return [
      { id: 1,
        name: {
          first: 'Ted',
          last: 'Right'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' },
      { id: 2,
        name: {
          first: 'Frank',
          last: 'Honest'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' },
      { id: 3,
        name: {
          first: 'Joan',
          last: 'Well'
        },
        address: 'Street Name',
        zip: '80410',
        city: 'City Name' }
    ];
  };

  // `insert_row` is an alias for `insert_row_above` action
  describe('`insert_row` action', () => {
    it('should insert row below the last row when there is missing the `index` argument', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
        ]
      });

      alter('insert_row'); // without arguments works like `insert_row_below`

      expect(countRows()).toBe(4);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
        [null, null, null],
      ]);

      alter('insert_row', null, 3);

      expect(countRows()).toBe(7);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('should insert row below the last row when the index exceeds the data range', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
        ]
      });

      alter('insert_row', 3);

      expect(countRows()).toBe(4);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
        [null, null, null],
      ]);

      alter('insert_row', 100);

      expect(countRows()).toBe(5);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
        [null, null, null],
        [null, null, null],
      ]);

      alter('insert_row', 100, 3);

      expect(countRows()).toBe(8);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ]);
    });

    it('should insert one row above the given index (the `amount` argument is not provided)', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
        ]
      });

      alter('insert_row', 1);

      expect(countRows()).toBe(4);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        [null, null, null],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
      ]);
    });

    it('should insert 3 rows above the given index', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
        ]
      });

      alter('insert_row', 1, 3);

      expect(countRows()).toBe(6);
      expect(getData()).toEqual([
        ['a1', 'a2', 'a3'],
        [null, null, null],
        [null, null, null],
        [null, null, null],
        ['b1', 'b2', 'b3'],
        ['c1', 'c2', 'c3'],
      ]);
    });

    it('should not create row if removing has been canceled by `beforeCreateRow` hook handler', () => {
      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeCreateRow: () => false
      });

      expect(countRows()).toBe(3);

      alter('insert_row');

      expect(countRows()).toBe(3);

      alter('insert_row', 1, 10);

      expect(countRows()).toBe(3);
    });

    it('should not create/shift cell meta objects if creating has been canceled by `beforeCreateRow` hook handler', () => {
      handsontable({
        beforeCreateRow: () => false,
      });

      setCellMeta(2, 0, '_test', 'foo');

      alter('insert_row', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(1, 0)._test).toBeUndefined();
      expect(getCellMeta(2, 0)._test).toBe('foo');
      expect(getCellMeta(3, 0)._test).toBeUndefined();
    });

    it('should not mess cell meta objects after calling the action without parameters (#3581, #3989, #2114)', () => {
      const greenRenderer = function(instance, td, ...args) {
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, ...args]);
        td.style.backgroundColor = 'green';
      };

      handsontable({
        data: [
          [0, 'a', true],
          [1, 'b', false],
          [2, 'c', true],
          [3, 'd', true]
        ],
        cell: [
          { row: 0, col: 0, renderer: greenRenderer, type: 'text', readOnly: true }
        ],
        columns: [
          { type: 'numeric' },
          { type: 'text' },
          { type: 'checkbox' }
        ]
      });

      alter('insert_row'); // without arguments works like `insert_row_below`

      expect(getCellMeta(0, 0).renderer).toBe(greenRenderer);
      expect(getCellMeta(0, 0).readOnly).toBe(true);

      expect(getCellMeta(4, 0).renderer).not.toBe(greenRenderer);
      expect(getCellMeta(4, 0).readOnly).toBe(false);
    });

    it('should add new row with cells type defined by cell meta options', () => {
      handsontable({
        data: [
          [0, 'a', true],
          [1, 'b', false],
          [2, 'c', true],
          [3, 'd', true]
        ],
        cell: [
          { row: 0, col: 0, type: 'text' }
        ],
        columns: [
          { type: 'numeric' },
          { type: 'text' },
          { type: 'checkbox' }
        ]
      });

      alter('insert_row'); // without arguments works like `insert_row_below`

      // a new row
      expect(getCellMeta(4, 0).type).toBe('numeric');
      expect(getDataAtCell(4, 0)).toBe(null);

      expect(getCellMeta(4, 2).type).toBe('checkbox');
      expect(getDataAtCell(4, 2)).toBe(null);
    });

    it('should insert not more rows than maxRows', () => {
      handsontable({
        startRows: 5,
        maxRows: 7
      });
      alter('insert_row', 1);
      alter('insert_row', 1);
      alter('insert_row', 1);

      expect(countRows()).toBe(7);
    });

    it('should not insert more rows than maxRows (when `amount` parameter is used)', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ],
        maxRows: 10
      });
      alter('insert_row', 1, 10);

      expect(countRows()).toBe(10);
    });

    it('should fire `beforeCreateRow` and `afterCreateRow` hooks', () => {
      const beforeCreateRow = jasmine.createSpy('beforeCreateRow');
      const afterCreateRow = jasmine.createSpy('afterCreateRow');

      handsontable({
        data: createSpreadsheetData(8, 8),
        beforeCreateRow,
        afterCreateRow,
      });
      alter('insert_row'); // without arguments works like `insert_row_below`

      expect(beforeCreateRow).toHaveBeenCalledTimes(1);
      expect(beforeCreateRow).toHaveBeenCalledWith(8, 1);
      expect(afterCreateRow).toHaveBeenCalledTimes(1);
      expect(afterCreateRow).toHaveBeenCalledWith(8, 1);

      alter('insert_row', 3, 2, 'customSource');

      expect(beforeCreateRow).toHaveBeenCalledTimes(2);
      expect(beforeCreateRow).toHaveBeenCalledWith(3, 2, 'customSource');
      expect(afterCreateRow).toHaveBeenCalledTimes(2);
      expect(afterCreateRow).toHaveBeenCalledWith(3, 2, 'customSource');
    });

    it('should shift down only the last selection layer when it selects the cells below the inserted row', () => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
      });

      selectCells([
        [6, 5, 7, 6],
        [1, 5, 4, 7],
        [5, 1, 7, 3],
      ]);
      expect(`
        |   ║   : - : - : - :   : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   : A : 0 : 0 :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   : 0 : 0 :   |
        | - ║   : 0 : 0 : 0 :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      alter('insert_row', 5, 2);

      expect(`
        |   ║   : - : - : - :   : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : 0 : 0 :   |
        | - ║   : A : 0 : 0 :   : 0 : 0 :   |
        | - ║   : 0 : 0 : 0 :   :   :   :   |
        | - ║   : 0 : 0 : 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not shift the selection layers when they selects the cells above the inserted row', () => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
      });

      selectCells([
        [1, 5, 4, 7],
        [5, 1, 5, 4],
      ]);
      keyUp('control/meta');
      expect(`
        |   ║   : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   : A : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      alter('insert_row', 6, 2);

      expect(`
        |   ║   : - : - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   :   :   :   :   : 0 : 0 : 0 |
        | - ║   : A : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should insert row at proper position when there were some row sequence changes', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5)
      });

      hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

      alter('insert_row', 1, 1);

      expect(getDataAtCol(0)).toEqual(['A5', null, 'A4', 'A3', 'A2', 'A1']);
      expect(getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', null, 'A4', 'A5']);

      alter('insert_row', 0, 1);

      expect(getDataAtCol(0)).toEqual([null, 'A5', null, 'A4', 'A3', 'A2', 'A1']);
      expect(getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', null, 'A4', null, 'A5']);

      alter('insert_row', 7, 1);

      expect(getDataAtCol(0)).toEqual([null, 'A5', null, 'A4', 'A3', 'A2', 'A1', null]);
      expect(getSourceDataAtCol(0)).toEqual(['A1', 'A2', 'A3', null, 'A4', null, 'A5', null]);
    });

    it('should not throw an exception while adding lot of rows', () => {
      handsontable({
        data: createSpreadsheetData(5, 5)
      });

      expect(() => {
        alter('insert_row', 0, 100000);
      }).not.toThrowError();
    });
  });
});
