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

    describe('`insert_col_end` action', () => {
      it('should insert column on the right of the last column when there is missing the `index` argument', async() => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        await alter('insert_col_end');

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null],
          ['b1', 'b2', 'b3', null],
          ['c1', 'c2', 'c3', null],
        ]);

        await alter('insert_col_end', null, 3);

        expect(countCols()).toBe(7);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null, null, null, null],
          ['b1', 'b2', 'b3', null, null, null, null],
          ['c1', 'c2', 'c3', null, null, null, null],
        ]);
      });

      it('should insert column on the right of the last column when the index exceeds the data range', async() => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        await alter('insert_col_end', 3);

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null],
          ['b1', 'b2', 'b3', null],
          ['c1', 'c2', 'c3', null],
        ]);

        await alter('insert_col_end', 100);

        expect(countCols()).toBe(5);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null, null],
          ['b1', 'b2', 'b3', null, null],
          ['c1', 'c2', 'c3', null, null],
        ]);

        await alter('insert_col_end', 100, 3);

        expect(countCols()).toBe(8);
        expect(getData()).toEqual([
          ['a1', 'a2', 'a3', null, null, null, null, null],
          ['b1', 'b2', 'b3', null, null, null, null, null],
          ['c1', 'c2', 'c3', null, null, null, null, null],
        ]);
      });

      it('should insert one column on the left of the given index (the `amount` argument is not provided)', async() => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        await alter('insert_col_end', 1);

        expect(countCols()).toBe(4);
        expect(getData()).toEqual([
          ['a1', 'a2', null, 'a3'],
          ['b1', 'b2', null, 'b3'],
          ['c1', 'c2', null, 'c3'],
        ]);
      });

      it('should insert 3 columns on the left of the given index', async() => {
        handsontable({
          data: [
            ['a1', 'a2', 'a3'],
            ['b1', 'b2', 'b3'],
            ['c1', 'c2', 'c3'],
          ]
        });

        await alter('insert_col_end', 1, 3);

        expect(countCols()).toBe(6);
        expect(getData()).toEqual([
          ['a1', 'a2', null, null, null, 'a3'],
          ['b1', 'b2', null, null, null, 'b3'],
          ['c1', 'c2', null, null, null, 'c3'],
        ]);
      });

      it('should not create column if removing has been canceled by `beforeCreateCol` hook handler', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          beforeCreateCol: () => false
        });

        expect(countCols()).toBe(5);

        await alter('insert_col_end');

        expect(countCols()).toBe(5);

        await alter('insert_col_end', 1, 10);

        expect(countCols()).toBe(5);
      });

      it('should not create/shift cell meta objects if creating has been canceled by `beforeCreateCol` hook handler', async() => {
        handsontable({
          beforeCreateCol: () => false,
        });

        await setCellMeta(0, 2, '_test', 'foo');

        await alter('insert_col_end', 1, 1);

        expect(getCellMeta(0, 0)._test).toBeUndefined();
        expect(getCellMeta(0, 1)._test).toBeUndefined();
        expect(getCellMeta(0, 2)._test).toBe('foo');
        expect(getCellMeta(0, 3)._test).toBeUndefined();
      });

      it('should add new column with cells type defined by cell meta options', async() => {
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

        await alter('insert_col_end');

        // a new column
        expect(getCellMeta(0, 3).type).toBe('text');
        expect(getDataAtCell(0, 3)).toBe(null);

        // the first column
        expect(getCellMeta(0, 0).type).toBe('numeric');
        expect(getDataAtCell(0, 0)).toBe(0);
      });

      it('should insert not more columns than maxCols', async() => {
        handsontable({
          startCols: 5,
          maxCols: 7
        });

        await alter('insert_col_end', 1);
        await alter('insert_col_end', 1);
        await alter('insert_col_end', 1);

        expect(countCols()).toBe(7);
      });

      it('should not insert more columns than maxCols (when `amount` parameter is used)', async() => {
        handsontable({
          data: createSpreadsheetData(3, 5),
          maxCols: 10
        });

        await alter('insert_col_end', 1, 10);

        expect(countCols()).toBe(10);
      });

      it('should fire `beforeCreateCol` and `afterCreateCol` hooks', async() => {
        const beforeCreateCol = jasmine.createSpy('beforeCreateCol');
        const afterCreateCol = jasmine.createSpy('afterCreateCol');

        handsontable({
          data: createSpreadsheetData(8, 8),
          beforeCreateCol,
          afterCreateCol,
        });

        await alter('insert_col_end');

        expect(beforeCreateCol).toHaveBeenCalledTimes(1);
        expect(beforeCreateCol).toHaveBeenCalledWith(8, 1);
        expect(afterCreateCol).toHaveBeenCalledTimes(1);
        expect(afterCreateCol).toHaveBeenCalledWith(8, 1);

        await alter('insert_col_end', 3, 2, 'customSource');

        expect(beforeCreateCol).toHaveBeenCalledTimes(2);
        expect(beforeCreateCol).toHaveBeenCalledWith(3, 2, 'customSource');
        expect(afterCreateCol).toHaveBeenCalledTimes(2);
        expect(afterCreateCol).toHaveBeenCalledWith(4, 2, 'customSource');
      });

      it('should correctly shift cell meta object when they are defined in the `beforeCreateCol` hook', async() => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          beforeCreateCol(index, amount) {
            for (let i = index; i < index + amount; i++) {
              this.setCellMeta(0, i, 'className', 'red-background');
            }
          },
        });

        await setCellMeta(0, 0, 'className', 'green-background');
        await setCellMeta(0, 1, 'className', 'green-background');
        await alter('insert_col_end', 1, 3);

        expect(getCellMeta(0, 0).className).toBe('green-background');
        expect(getCellMeta(0, 1).className).toBe('red-background');
        expect(getCellMeta(0, 2).className).toBeUndefined();
        expect(getCellMeta(0, 3).className).toBeUndefined();
        expect(getCellMeta(0, 4).className).toBeUndefined();
        expect(getCellMeta(0, 5).className).toBe('red-background');
        expect(getCellMeta(0, 6).className).toBe('red-background');
        expect(getCellMeta(0, 7).className).toBeUndefined();
        expect(getCellMeta(0, 8).className).toBeUndefined();
      });

      it('should correctly shift cell meta object when they are defined in the `afterCreateCol` hook', async() => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          afterCreateCol(index, amount) {
            for (let i = index; i < index + amount; i++) {
              this.setCellMeta(0, i, 'className', 'red-background');
            }
          },
        });

        await setCellMeta(0, 0, 'className', 'green-background');
        await setCellMeta(0, 1, 'className', 'green-background');
        await alter('insert_col_end', 1, 3);

        expect(getCellMeta(0, 0).className).toBe('green-background');
        expect(getCellMeta(0, 1).className).toBe('green-background');
        expect(getCellMeta(0, 2).className).toBe('red-background');
        expect(getCellMeta(0, 3).className).toBe('red-background');
        expect(getCellMeta(0, 4).className).toBe('red-background');
        expect(getCellMeta(0, 5).className).toBeUndefined();
        expect(getCellMeta(0, 6).className).toBeUndefined();
        expect(getCellMeta(0, 7).className).toBeUndefined();
        expect(getCellMeta(0, 8).className).toBeUndefined();
      });

      it('should shift right only the last selection layer when the column is inserted on the left of that selection', async() => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          rowHeaders: true,
          colHeaders: true,
        });

        await selectCells([
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

        await alter('insert_col_end', 2, 2);

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

      it('should not shift right the selection layers when the column is inserted on the right of that selection', async() => {
        handsontable({
          data: createSpreadsheetData(8, 8),
          rowHeaders: true,
          colHeaders: true,
        });

        await selectCells([
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

        await alter('insert_col_end', 3, 2);

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

      it('should shift right the selected column when the new column is inserted on the left of that selection', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        await selectColumns(2, 3);

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

        await alter('insert_col_end', 1, 1);

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

      it('should not shift right the selected column when the new column is inserted on the right of that selection', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        await selectColumns(2, 3);

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

        await alter('insert_col_end', 2, 1);

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

      it('should keep the whole table selected when the new column is added', async() => {
        handsontable({
          data: createSpreadsheetData(3, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        await selectAll();

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

        await alter('insert_col_end', 0); // add to the beginning of the table

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

        await alter('insert_col_end', 100); // add to the end of the table

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

      it('should not create column header together with the column, if headers were NOT specified explicitly', async() => {
        handsontable({
          startCols: 3,
          startRows: 2,
          colHeaders: true
        });

        expect(getColHeader()).toEqual(['A', 'B', 'C']);
        expect(countCols()).toBe(3);

        await alter('insert_col_end', 1);

        expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);
        expect(countCols()).toBe(4);
      });

      it('should create column header together with the column, if headers were specified explicitly', async() => {
        handsontable({
          startCols: 3,
          startRows: 2,
          colHeaders: ['Header0', 'Header1', 'Header2']
        });

        expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);
        expect(countCols()).toBe(3);

        await alter('insert_col_end', 1);

        expect(getColHeader()).toEqual(['Header0', 'Header1', 'C', 'Header2']);
        expect(countCols()).toBe(4);
      });

      it('should insert column at proper position when there were some column sequence changes', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5)
        });

        columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

        await alter('insert_col_end', 1, 1);

        // index sequence after: [5, 3, 4, 2, 1, 0]

        expect(getDataAtRow(0)).toEqual(['E1', 'D1', null, 'C1', 'B1', 'A1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', null, 'E1']);

        await alter('insert_col_end', 0, 1);

        expect(getDataAtRow(0)).toEqual(['E1', null, 'D1', null, 'C1', 'B1', 'A1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', null, 'E1', null]);

        await alter('insert_col_end', 6, 1);

        expect(getDataAtRow(0)).toEqual(['E1', null, 'D1', null, 'C1', 'B1', 'A1', null]);
        expect(getSourceDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', null, 'E1', null]);
      });

      it('should insert column at proper position when column index sequence is shifted', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5)
        });

        columnIndexMapper().setIndexesSequence([4, 0, 1, 2, 3]);

        await alter('insert_col_end', 1, 1);

        expect(getDataAtRow(0)).toEqual(['E1', 'A1', null, 'B1', 'C1', 'D1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1']);

        await alter('insert_col_end', 0, 1);

        expect(getDataAtRow(0)).toEqual(['E1', null, 'A1', null, 'B1', 'C1', 'D1']);
        expect(getSourceDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1', null]);

        await alter('insert_col_end', 6, 1);

        expect(getDataAtRow(0)).toEqual(['E1', null, 'A1', null, 'B1', 'C1', 'D1', null]);
        expect(getSourceDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', null, 'E1', null]);
      });

      it('should not copy column filters from the source column to the new one', async() => {
        handsontable({
          data: createSpreadsheetData(2, 2),
          filters: true,
        });

        await getPlugin('filters').addCondition(1, 'by_value', [['B1']]);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);

        await alter('insert_col_end', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([0, 1, 2]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)).toEqual([]);
      });

      it('should keep the column filters when the index sequence is reversed', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['D1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['A1']]);

        // getConditions works by physical index
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);

        await alter('insert_col_end', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([5, 3, 4, 2, 1, 0]);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['D1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
      });

      it('should keep the column filters when the index sequence is shifted', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          filters: true
        });

        columnIndexMapper().setIndexesSequence([4, 0, 1, 2, 3]);

        // addCondition works by visual index
        await getPlugin('filters').addCondition(0, 'by_value', [['E1']]);
        await getPlugin('filters').addCondition(1, 'by_value', [['A1']]);
        await getPlugin('filters').addCondition(2, 'by_value', [['B1']]);
        await getPlugin('filters').addCondition(3, 'by_value', [['C1']]);
        await getPlugin('filters').addCondition(4, 'by_value', [['D1']]);

        // getConditions works by physical index
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['D1']]);

        await alter('insert_col_end', 1);

        expect(columnIndexMapper().getIndexesSequence()).toEqual([5, 0, 1, 2, 3, 4]);
        expect(getPlugin('filters').conditionCollection.getConditions(5)[0].args).toEqual([['E1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(0)[0].args).toEqual([['A1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(1)).toEqual([]);
        expect(getPlugin('filters').conditionCollection.getConditions(2)[0].args).toEqual([['B1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(3)[0].args).toEqual([['C1']]);
        expect(getPlugin('filters').conditionCollection.getConditions(4)[0].args).toEqual([['D1']]);
      });
    });
  });
});
