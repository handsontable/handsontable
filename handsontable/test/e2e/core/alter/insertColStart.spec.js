describe('Core.alter', () => {
  using('configuration object', [{ htmlDir: 'ltr' }, { htmlDir: 'rtl' }], ({ htmlDir }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('`insert_col_start` action', () => {
      it('should insert column on the left of the first column when there is missing the `index` argument', () => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        alter('insert_col_start');

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          [null, 'a1', 'a2', 'a3'],
          [null, 'b1', 'b2', 'b3'],
          [null, 'c1', 'c2', 'c3'],
        ]);

        alter('insert_col_start', null, 3);

        expect(countCols()).toBe(7);
        expect(getData()).toEqual([
          [null, null, null, null, 'a1', 'a2', 'a3'],
          [null, null, null, null, 'b1', 'b2', 'b3'],
          [null, null, null, null, 'c1', 'c2', 'c3'],
        ]);
      });

      it('should insert column on the right of the last column when the index exceeds the data range', () => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        alter('insert_col_start', 3);

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null],
          ['b1', 'b2', 'b3', null],
          ['c1', 'c2', 'c3', null],
        ]);

        alter('insert_col_start', 100);

        expect(countCols()).toBe(5);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null, null],
          ['b1', 'b2', 'b3', null, null],
          ['c1', 'c2', 'c3', null, null],
        ]);

        alter('insert_col_start', 100, 3);

        expect(countCols()).toBe(8);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null, null, null, null, null],
          ['b1', 'b2', 'b3', null, null, null, null, null],
          ['c1', 'c2', 'c3', null, null, null, null, null],
        ]);
      });

      it('should insert one column on the left of the given index (the `amount` argument is not provided)', () => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        alter('insert_col_start', 1);

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          ['a1', null, 'a2', 'a3'],
          ['b1', null, 'b2', 'b3'],
          ['c1', null, 'c2', 'c3'],
        ]);
      });

      it('should insert 3 columns on the left of the given index', () => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        alter('insert_col_start', 1, 3);

        expect(countCols()).toBe(6);
        expect(getData()).toEqual([
          ['a1', null, null, null, 'a2', 'a3'],
          ['b1', null, null, null, 'b2', 'b3'],
          ['c1', null, null, null, 'c2', 'c3'],
        ]);
      });

      it('should not create column if removing has been canceled by `beforeCreateCol` hook handler', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          beforeCreateCol: () => false
        });

        expect(countCols()).toBe(5);

        alter('insert_col_start');

        expect(countCols()).toBe(5);

        alter('insert_col_start', 1, 10);

        expect(countCols()).toBe(5);
      });

      it('should not create/shift cell meta objects if creating has been canceled by `beforeCreateCol` hook handler', () => {
        handsontable({
          beforeCreateCol: () => false,
        });

        setCellMeta(0, 2, '_test', 'foo');

        alter('insert_col_start', 1, 1);

        expect(getCellMeta(0, 0)._test).toBeUndefined();
        expect(getCellMeta(0, 1)._test).toBeUndefined();
        expect(getCellMeta(0, 2)._test).toBe('foo');
        expect(getCellMeta(0, 3)._test).toBeUndefined();
      });

      it('should add new column with cells type defined by cell meta options', () => {
        handsontable({
          data: [
            [0, 'a', true],
            [1, 'b', false],
            [2, 'c', true],
            [3, 'd', true]
          ],
          cell: [
            { row: 0, col: 0, type: 'numeric' }
          ],
        });

        alter('insert_col_start');

        // a new column
        expect(getCellMeta(0, 0).type).toBe('text');
        expect(getDataAtCell(0, 0)).toBe(null);

        // the second column that is pushed to the right by alter action
        expect(getCellMeta(0, 1).type).toBe('numeric');
        expect(getDataAtCell(0, 1)).toBe(0);
      });

      it('should insert not more columns than maxCols', () => {
        handsontable({
          startCols: 5,
          maxCols: 7
        });

        alter('insert_col_start', 1);
        alter('insert_col_start', 1);
        alter('insert_col_start', 1);

        expect(countCols()).toBe(7);
      });

      it('should not insert more columns than maxCols (when `amount` parameter is used)', () => {
        handsontable({
          data: createSpreadsheetData(3, 5),
          maxCols: 10
        });

        alter('insert_col_start', 1, 10);

        expect(countCols()).toBe(10);
      });

      it('should fire `beforeCreateCol` and `afterCreateCol` hooks', () => {
        const beforeCreateCol = jasmine.createSpy('beforeCreateCol');
        const afterCreateCol = jasmine.createSpy('afterCreateCol');

        handsontable({
          data: createSpreadsheetData(8, 8),
          beforeCreateCol,
          afterCreateCol,
        });

        alter('insert_col_start');

        expect(beforeCreateCol).toHaveBeenCalledTimes(1);
        expect(beforeCreateCol).toHaveBeenCalledWith(0, 1);
        expect(afterCreateCol).toHaveBeenCalledTimes(1);
        expect(afterCreateCol).toHaveBeenCalledWith(0, 1);

        alter('insert_col_start', 3, 2, 'customSource');

        expect(beforeCreateCol).toHaveBeenCalledTimes(2);
        expect(beforeCreateCol).toHaveBeenCalledWith(3, 2, 'customSource');
        expect(afterCreateCol).toHaveBeenCalledTimes(2);
        expect(afterCreateCol).toHaveBeenCalledWith(3, 2, 'customSource');
      });

      it('should correctly shift cell meta object when they are defined in the `beforeCreateCol` hook', () => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          beforeCreateCol(index, amount) {
            for (let i = index; i < index + amount; i++) {
              this.setCellMeta(0, i, 'className', 'red-background');
            }
          },
        });

        setCellMeta(0, 0, 'className', 'green-background');
        setCellMeta(0, 1, 'className', 'green-background');
        alter('insert_col_start', 1, 3);

        expect(getCellMeta(0, 0).className).toBe('green-background');
        expect(getCellMeta(0, 1).className).toBeUndefined();
        expect(getCellMeta(0, 2).className).toBeUndefined();
        expect(getCellMeta(0, 3).className).toBeUndefined();
        expect(getCellMeta(0, 4).className).toBe('red-background');
        expect(getCellMeta(0, 5).className).toBe('red-background');
        expect(getCellMeta(0, 6).className).toBe('red-background');
        expect(getCellMeta(0, 7).className).toBeUndefined();
        expect(getCellMeta(0, 8).className).toBeUndefined();
      });

      it('should correctly shift cell meta object when they are defined in the `afterCreateCol` hook', () => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          afterCreateCol(index, amount) {
            for (let i = index; i < index + amount; i++) {
              this.setCellMeta(0, i, 'className', 'red-background');
            }
          },
        });

        setCellMeta(0, 0, 'className', 'green-background');
        setCellMeta(0, 1, 'className', 'green-background');
        alter('insert_col_start', 1, 3);

        expect(getCellMeta(0, 0).className).toBe('green-background');
        expect(getCellMeta(0, 1).className).toBe('red-background');
        expect(getCellMeta(0, 2).className).toBe('red-background');
        expect(getCellMeta(0, 3).className).toBe('red-background');
        expect(getCellMeta(0, 4).className).toBe('green-background');
        expect(getCellMeta(0, 5).className).toBeUndefined();
        expect(getCellMeta(0, 6).className).toBeUndefined();
        expect(getCellMeta(0, 7).className).toBeUndefined();
        expect(getCellMeta(0, 8).className).toBeUndefined();
      });

      it('should shift right only the last selection layer when the column is inserted on the left of that selection', () => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          rowHeaders: true,
          colHeaders: true,
        });

        selectCells([
          [1, 1, 3, 2],
          [1, 4, 1, 4],
          [5, 3, 6, 4],
        ]);

        if (htmlDir === 'rtl') {
          expect(`
            |   :   :   : - : - : - : - :   ║   |
            |===:===:===:===:===:===:===:===:===|
            |   :   :   :   :   :   :   :   ║   |
            |   :   :   : 0 :   : 0 : 0 :   ║ - |
            |   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   :   ║   |
            |   :   :   : 0 : A :   :   :   ║ - |
            |   :   :   : 0 : 0 :   :   :   ║ - |
            |   :   :   :   :   :   :   :   ║   |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   : - : - : - : - :   :   :   |
            |===:===:===:===:===:===:===:===:===|
            |   ║   :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   : 0 :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   |
            |   ║   :   :   :   :   :   :   :   |
            | - ║   :   :   : A : 0 :   :   :   |
            | - ║   :   :   : 0 : 0 :   :   :   |
            |   ║   :   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 3, 2);

        if (htmlDir === 'rtl') {
          expect(`
            |   :   :   : - : - : - :   : - : - :   ║   |
            |===:===:===:===:===:===:===:===:===:===:===|
            |   :   :   :   :   :   :   :   :   :   ║   |
            |   :   :   :   :   : 0 :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   :   :   :   ║   |
            |   :   :   : 0 : A :   :   :   :   :   ║ - |
            |   :   :   : 0 : 0 :   :   :   :   :   ║ - |
            |   :   :   :   :   :   :   :   :   :   ║   |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   : - : - :   : - : - : - :   :   :   |
            |===:===:===:===:===:===:===:===:===:===:===|
            |   ║   :   :   :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   : 0 :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   :   :   |
            |   ║   :   :   :   :   :   :   :   :   :   |
            | - ║   :   :   :   :   : A : 0 :   :   :   |
            | - ║   :   :   :   :   : 0 : 0 :   :   :   |
            |   ║   :   :   :   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        }
      });

      it('should not shift right the selection layers when the column is inserted on the right of that selection', () => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          rowHeaders: true,
          colHeaders: true,
        });

        selectCells([
          [1, 1, 3, 2],
          [1, 4, 1, 4],
          [5, 3, 6, 4],
        ]);

        if (htmlDir === 'rtl') {
          expect(`
            |   :   :   : - : - : - : - :   ║   |
            |===:===:===:===:===:===:===:===:===|
            |   :   :   :   :   :   :   :   ║   |
            |   :   :   : 0 :   : 0 : 0 :   ║ - |
            |   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   :   ║   |
            |   :   :   : 0 : A :   :   :   ║ - |
            |   :   :   : 0 : 0 :   :   :   ║ - |
            |   :   :   :   :   :   :   :   ║   |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   : - : - : - : - :   :   :   |
            |===:===:===:===:===:===:===:===:===|
            |   ║   :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   : 0 :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   |
            |   ║   :   :   :   :   :   :   :   |
            | - ║   :   :   : A : 0 :   :   :   |
            | - ║   :   :   : 0 : 0 :   :   :   |
            |   ║   :   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 4, 2);

        if (htmlDir === 'rtl') {
          expect(`
            |   :   :   :   :   : - : - : - : - :   ║   |
            |===:===:===:===:===:===:===:===:===:===:===|
            |   :   :   :   :   :   :   :   :   :   ║   |
            |   :   :   :   :   : 0 :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   : 0 : 0 :   ║ - |
            |   :   :   :   :   :   :   :   :   :   ║   |
            |   :   :   :   :   : 0 : A :   :   :   ║ - |
            |   :   :   :   :   : 0 : 0 :   :   :   ║ - |
            |   :   :   :   :   :   :   :   :   :   ║   |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   : - : - : - : - :   :   :   :   :   |
            |===:===:===:===:===:===:===:===:===:===:===|
            |   ║   :   :   :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   : 0 :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   :   :   |
            | - ║   : 0 : 0 :   :   :   :   :   :   :   |
            |   ║   :   :   :   :   :   :   :   :   :   |
            | - ║   :   :   : A : 0 :   :   :   :   :   |
            | - ║   :   :   : 0 : 0 :   :   :   :   :   |
            |   ║   :   :   :   :   :   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        }
      });

      it('should shift right the selected column when the new column is inserted on the left of that selection', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        selectColumns(2, 3);

        if (htmlDir === 'rtl') {
          expect(`
            |   : * : * :   :   ║   |
            |===:===:===:===:===:===|
            |   : 0 : A :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   :   : * : * :   |
            |===:===:===:===:===:===|
            | - ║   :   : A : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 2, 1);

        if (htmlDir === 'rtl') {
          expect(`
            |   : * : * :   :   :   ║   |
            |===:===:===:===:===:===:===|
            |   : 0 : A :   :   :   ║ - |
            |   : 0 : 0 :   :   :   ║ - |
            |   : 0 : 0 :   :   :   ║ - |
            |   : 0 : 0 :   :   :   ║ - |
            |   : 0 : 0 :   :   :   ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   :   :   : * : * :   |
            |===:===:===:===:===:===:===|
            | - ║   :   :   : A : 0 :   |
            | - ║   :   :   : 0 : 0 :   |
            | - ║   :   :   : 0 : 0 :   |
            | - ║   :   :   : 0 : 0 :   |
            | - ║   :   :   : 0 : 0 :   |
          `).toBeMatchToSelectionPattern();
        }
      });

      it('should not shift right the selected column when the new column is inserted on the right of that selection', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        selectColumns(2, 3);

        if (htmlDir === 'rtl') {
          expect(`
            |   : * : * :   :   ║   |
            |===:===:===:===:===:===|
            |   : 0 : A :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
            |   : 0 : 0 :   :   ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   :   : * : * :   |
            |===:===:===:===:===:===|
            | - ║   :   : A : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
            | - ║   :   : 0 : 0 :   |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 3, 1);

        if (htmlDir === 'rtl') {
          expect(`
            |   :   : * : * :   :   ║   |
            |===:===:===:===:===:===:===|
            |   :   : 0 : A :   :   ║ - |
            |   :   : 0 : 0 :   :   ║ - |
            |   :   : 0 : 0 :   :   ║ - |
            |   :   : 0 : 0 :   :   ║ - |
            |   :   : 0 : 0 :   :   ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║   :   : * : * :   :   |
            |===:===:===:===:===:===:===|
            | - ║   :   : A : 0 :   :   |
            | - ║   :   : 0 : 0 :   :   |
            | - ║   :   : 0 : 0 :   :   |
            | - ║   :   : 0 : 0 :   :   |
            | - ║   :   : 0 : 0 :   :   |
          `).toBeMatchToSelectionPattern();
        }
      });

      it('should keep the whole table selected when the new column is added', () => {
        handsontable({
          data: createSpreadsheetData(3, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        selectAll();

        if (htmlDir === 'rtl') {
          expect(`
            | * : * : * : * : * ║ * |
            |===:===:===:===:===:===|
            | 0 : 0 : 0 : 0 : A ║ * |
            | 0 : 0 : 0 : 0 : 0 ║ * |
            | 0 : 0 : 0 : 0 : 0 ║ * |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            | * ║ * : * : * : * : * |
            |===:===:===:===:===:===|
            | * ║ A : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
            | * ║ 0 : 0 : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 0); // add to the beginning of the table

        if (htmlDir === 'rtl') {
          expect(`
            | - : - : - : - : - : - ║   |
            |===:===:===:===:===:===:===|
            | 0 : 0 : 0 : 0 : 0 : A ║ - |
            | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
            | 0 : 0 : 0 : 0 : 0 : 0 ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║ - : - : - : - : - : - |
            |===:===:===:===:===:===:===|
            | - ║ A : 0 : 0 : 0 : 0 : 0 |
            | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
            | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        }

        alter('insert_col_start', 100); // add to the end of the table

        if (htmlDir === 'rtl') {
          expect(`
            | - : - : - : - : - : - : - ║   |
            |===:===:===:===:===:===:===:===|
            | 0 : 0 : 0 : 0 : 0 : 0 : A ║ - |
            | 0 : 0 : 0 : 0 : 0 : 0 : 0 ║ - |
            | 0 : 0 : 0 : 0 : 0 : 0 : 0 ║ - |
          `).toBeMatchToSelectionPattern();
        } else {
          expect(`
            |   ║ - : - : - : - : - : - : - |
            |===:===:===:===:===:===:===:===|
            | - ║ A : 0 : 0 : 0 : 0 : 0 : 0 |
            | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
            | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
          `).toBeMatchToSelectionPattern();
        }
      });

      it('should not create column header together with the column, if headers were NOT specified explicitly', () => {
        handsontable({
          startCols: 3,
          startRows: 2,
          colHeaders: true
        });

        expect(getColHeader()).toEqual(['A', 'B', 'C']);
        expect(countCols()).toBe(3);

        alter('insert_col_start', 1);

        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);
        expect(countCols()).toBe(4);
      });

      it('should create column header together with the column, if headers were specified explicitly', () => {
        handsontable({
          startCols: 3,
          startRows: 2,
          colHeaders: ['Header0', 'Header1', 'Header2']
        });

        expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);
        expect(countCols()).toBe(3);

        alter('insert_col_start', 1);

        expect(getColHeader()).toEqual(['Header0', 'B', 'Header1', 'Header2']);
        expect(countCols()).toBe(4);
      });

      it('should insert column at proper position when there were some column sequence changes', () => {
        const hot = handsontable({
          data: createSpreadsheetData(5, 5)
        });

        hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

        alter('insert_col_start', 1, 1);

        expect(getDataAtRow(0)).toEqual(['E1', null, 'D1', 'C1', 'B1', 'A1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', 'E1']);

        alter('insert_col_start', 0, 1);

        expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1']);

        alter('insert_col_start', 7, 1);

        expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1', null]);
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1', null]);
      });
    });
  });
});
