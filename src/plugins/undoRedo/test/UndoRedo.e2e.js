describe('UndoRedo', () => {
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

  describe('core features', () => {
    describe('Array data', () => {
      describe('undo', () => {
        it('should undo single change', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          expect(getDataAtCell(0, 0)).toBe('X1');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');
        });

        it('should undo single change on cell with validator', (done) => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'X1');

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('A1');
            done();
          }, 400);
        });

        it('should undo creation of a single row', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows with minSpareRows', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 1),
            minSpareRows: 2
          });

          expect(getData()).toEqual([['A1'], ['A2'], [null], [null]]);

          setDataAtCell(2, 0, 'A3');
          setDataAtCell(4, 0, 'A4');

          expect(getData()).toEqual([['A1'], ['A2'], ['A3'], [null], ['A4'], [null], [null]]);

          HOT.undo();
          HOT.undo();

          expect(getData()).toEqual([['A1'], ['A2'], [null], [null]]);
        });

        it('should undo removal of single row', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(3, 2)
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          alter('remove_row', 1);

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A3');
          expect(getDataAtCell(1, 1)).toEqual('B3');

          HOT.undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
        });

        it('should undo removal of multiple rows', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(4, 2)
          });

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          alter('remove_row', 1, 2);

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A4');
          expect(getDataAtCell(1, 1)).toEqual('B4');

          HOT.undo();

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');
        });

        it('should undo removal of single row after column sorting', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(3, 2),
            colHeaders: true,
            columnSorting: true
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          getPlugin('ColumnSorting').sort({ column: 0, sortOrder: 'desc' });

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A3');
          expect(getDataAtCell(0, 1)).toEqual('B3');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A1');
          expect(getDataAtCell(2, 1)).toEqual('B1');

          alter('remove_row', 0);

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A2');
          expect(getDataAtCell(0, 1)).toEqual('B2');
          expect(getDataAtCell(1, 0)).toEqual('A1');
          expect(getDataAtCell(1, 1)).toEqual('B1');

          undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A3');
          expect(getDataAtCell(0, 1)).toEqual('B3');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A1');
          expect(getDataAtCell(2, 1)).toEqual('B1');
        });

        it('should undo creation of a single column (colHeaders: undefined)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3)
          });

          expect(countCols()).toEqual(3);

          alter('insert_col');

          expect(countCols()).toEqual(4);

          HOT.undo();

          expect(countCols()).toEqual(3);
        });

        it('should undo creation of a single column (colHeaders: true)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3),
            colHeaders: true
          });

          expect(countCols()).toEqual(3);
          expect(getColHeader()).toEqual(['A', 'B', 'C']);

          alter('insert_col');

          expect(countCols()).toEqual(4);
          expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

          HOT.undo();

          expect(countCols()).toEqual(3);
          expect(getColHeader()).toEqual(['A', 'B', 'C']);
        });

        it('should undo creation of a single column (colHeaders: Array)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3),
            colHeaders: ['Header1', 'Header2', 'Header3']
          });

          expect(countCols()).toEqual(3);
          expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3']);

          alter('insert_col', 1);

          expect(countCols()).toEqual(4);
          expect(getColHeader()).toEqual(['Header1', 'B', 'Header2', 'Header3']);

          HOT.undo();

          expect(countCols()).toEqual(3);
          expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3']);
        });

        it('should undo creation of multiple columns (colHeaders: undefined)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countCols()).toEqual(2);

          alter('insert_col', 1, 5);

          expect(countCols()).toEqual(7);

          HOT.undo();

          expect(countCols()).toEqual(2);
        });

        it('should undo creation of multiple columns (colHeaders: true)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            colHeaders: true
          });

          expect(countCols()).toEqual(2);
          expect(getColHeader()).toEqual(['A', 'B']);

          alter('insert_col', 1, 5);

          expect(countCols()).toEqual(7);
          expect(getColHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getColHeader()).toEqual(['A', 'B']);
        });

        it('should undo creation of multiple columns (colHeaders: Array)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            colHeaders: ['Header1', 'Header2']
          });

          expect(countCols()).toEqual(2);
          expect(getColHeader()).toEqual(['Header1', 'Header2']);

          alter('insert_col', 1, 5);

          expect(countCols()).toEqual(7);
          expect(getColHeader()).toEqual(['Header1', 'B', 'C', 'D', 'E', 'F', 'Header2']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getColHeader()).toEqual(['Header1', 'Header2']);
        });

        it('should undo creation of multiple columns with minSpareCols', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(1, 1),
            minSpareCols: 2
          });

          expect(getData()).toEqual([['A1', null, null]]);

          setDataAtCell(0, 1, 'B1');
          setDataAtCell(0, 3, 'C1');

          expect(getData()).toEqual([['A1', 'B1', null, 'C1', null, null]]);

          HOT.undo();
          HOT.undo();

          expect(getData()).toEqual([['A1', null, null]]);
        });

        it('should undo removal of single column (colHeaders: undefined)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3)
          });

          expect(countCols()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');

          alter('remove_col', 1);

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('C2');

          HOT.undo();

          expect(countCols()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
        });

        it('should undo removal of single column (colHeaders: true)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            colHeaders: true
          });

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getColHeader()).toEqual(['A', 'B']);

          alter('remove_col');

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
          expect(getColHeader()).toEqual(['A']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          expect(getColHeader()).toEqual(['A', 'B']);
        });

        it('should undo removal of single column (colHeaders: Array)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            colHeaders: ['Header1', 'Header2']
          });

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getColHeader()).toEqual(['Header1', 'Header2']);

          alter('remove_col');

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
          expect(getColHeader()).toEqual(['Header1']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          expect(getColHeader()).toEqual(['Header1', 'Header2']);
        });

        it('should undo removal of multiple columns (colHeaders: undefined)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 4)
          });

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');

          alter('remove_col', 1, 2);

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('D1');
          expect(getDataAtCell(0, 2)).toBeNull();
          expect(getDataAtCell(0, 3)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('D2');
          expect(getDataAtCell(1, 2)).toBeNull();
          expect(getDataAtCell(1, 3)).toBeNull();

          HOT.undo();

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');
        });

        it('should undo removal of multiple columns (colHeaders: true)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 4),
            colHeaders: true
          });

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');
          expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

          alter('remove_col', 1, 3);

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(0, 2)).toBeNull();
          expect(getDataAtCell(0, 3)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
          expect(getDataAtCell(1, 2)).toBeNull();
          expect(getDataAtCell(1, 3)).toBeNull();
          expect(getColHeader()).toEqual(['A']);

          HOT.undo();

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');
          expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);
        });

        it('should undo removal of multiple columns (colHeaders: Array)', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 4),
            colHeaders: ['Header1', 'Header2', 'Header3', 'Header4']
          });

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');
          expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3', 'Header4']);

          alter('remove_col', 1, 2);

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('D1');
          expect(getDataAtCell(0, 2)).toBeNull();
          expect(getDataAtCell(0, 3)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('D2');
          expect(getDataAtCell(1, 2)).toBeNull();
          expect(getDataAtCell(1, 3)).toBeNull();
          expect(getColHeader()).toEqual(['Header1', 'Header4']);

          HOT.undo();

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');
          expect(getColHeader()).toEqual(['Header1', 'Header2', 'Header3', 'Header4']);
        });

        it('should undo removal of multiple columns (with a used manualColumnMove)', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 7),
            manualColumnMove: [3, 2, 0, 6, 1, 5, 4]
          });

          expect(countCols()).toEqual(7);
          expect(getDataAtRow(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);

          alter('remove_col', 1, 3);

          expect(countCols()).toEqual(4);
          expect(getDataAtRow(0)).toEqual(['D1', 'B1', 'F1', 'E1']);

          // HOT.undo();
          //
          // expect(countCols()).toEqual(7);
          // expect(getDataAtRow(0)).toEqual(['D1', 'C1', 'A1', 'G1', 'B1', 'F1', 'E1']);
        });

        it('should undo multiple changes', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('Y2');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('A2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');
          expect(getDataAtCell(1, 0)).toBe('A2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');
          expect(getDataAtCell(1, 0)).toBe('A2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');
        });

        it('should undo multiple changes in cells with validators', (done) => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.undo();
          }, 400);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.undo();
          }, 600);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.undo();
          }, 800);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.undo();
          }, 1000);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');
            done();
          }, 1200);
        });

        it('should undo multiple row creations', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');
          alter('insert_row');
          alter('insert_row');
          alter('insert_row');

          expect(countRows()).toEqual(6);

          HOT.undo();
          expect(countRows()).toEqual(5);

          HOT.undo();
          expect(countRows()).toEqual(4);

          HOT.undo();
          expect(countRows()).toEqual(3);

          HOT.undo();
          expect(countRows()).toEqual(2);

          HOT.undo();
          expect(countRows()).toEqual(2);
        });

        it('should undo multiple row removals', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(4, 2)
          });

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          alter('remove_row');
          alter('remove_row');
          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');

          HOT.undo();
          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          HOT.undo();
          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          HOT.undo();
          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          HOT.undo();
          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');
        });

        it('should undo changes only for table where the change actually took place', () => {
          spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

          const hot1 = handsontable({
            data: [
              [1],
              [2],
              [3]
            ]
          });

          spec().$container2.handsontable({
            data: [
              ['A'],
              ['B'],
              ['C']
            ]
          });

          const hot2 = spec().$container2.handsontable('getInstance');

          hot1.setDataAtCell(0, 0, 4);
          expect(hot1.getDataAtCell(0, 0)).toEqual(4);
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');

          hot2.undo();
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');
          expect(hot1.getDataAtCell(0, 0)).toEqual(4);

          hot1.undo();
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');
          expect(hot1.getDataAtCell(0, 0)).toEqual(1);

          hot2.destroy();
          spec().$container2.remove();
        });

        it('should return the right amount after undo removal of single column', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3)
          });

          const afterCreateColCallback = jasmine.createSpy('afterCreateColCallback');
          HOT.addHook('afterCreateCol', afterCreateColCallback);

          expect(countCols()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');

          alter('remove_col', 1);

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('C2');

          HOT.undo();

          expect(afterCreateColCallback).toHaveBeenCalledWith(1, 1, 'UndoRedo.undo', void 0, void 0, void 0);

          expect(countCols()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
        });

        it('should work with functional data source', () => {
          const HOT = handsontable({
            data: [
              model({ id: 1, name: 'Ted Right', address: '' }),
              model({ id: 2, name: 'Frank Honest', address: '' }),
              model({ id: 3, name: 'Joan Well', address: '' })
            ],
            dataSchema: model,
            startRows: 5,
            startCols: 3,
            colHeaders: ['ID', 'Name', 'Address'],
            columns: [
              { data: property('id') },
              { data: property('name') },
              { data: property('address') }
            ],
            minSpareRows: 1
          });

          function model(opts) {
            const _pub = {};
            const _priv = $.extend({
              id: undefined,
              name: undefined,
              address: undefined
            }, opts);

            _pub.attr = function(attr, val) {
              if (typeof val === 'undefined') {
                return _priv[attr];
              }
              _priv[attr] = val;

              return _pub;
            };

            return _pub;
          }

          function property(attr) {
            return function(row, value) {
              return row.attr(attr, value);
            };
          }

          expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
          setDataAtCell(1, 1, 'Something Else');
          expect(getDataAtCell(1, 1)).toEqual('Something Else');

          HOT.undo();
          expect(getDataAtCell(1, 1)).toEqual('Frank Honest');
        });
      });
      describe('redo', () => {
        it('should redo single change', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'new value');

          expect(getDataAtCell(0, 0)).toBe('new value');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('new value');
        });

        it('should redo single change in cell with validator', (done) => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'new value');

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('new value');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('A1');

            HOT.redo();
          }, 400);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('new value');
            done();
          }, 600);
        });

        it('should redo creation of a single row', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();

          expect(countRows()).toEqual(3);
        });

        it('should redo creation of multiple rows', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();

          expect(countRows()).toEqual(7);
        });

        it('should redo removal of single row', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(3, 2)
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          alter('remove_row', 1);

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A3');
          expect(getDataAtCell(1, 1)).toEqual('B3');

          HOT.undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          HOT.redo();

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A3');
          expect(getDataAtCell(1, 1)).toEqual('B3');
        });

        it('should redo removal of multiple rows', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(4, 2)
          });

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          alter('remove_row', 1, 2);

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A4');
          expect(getDataAtCell(1, 1)).toEqual('B4');

          HOT.undo();

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          HOT.redo();

          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A4');
          expect(getDataAtCell(1, 1)).toEqual('B4');
        });

        it('should redo creation of a single column', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countCols()).toEqual(2);

          alter('insert_col');

          expect(countCols()).toEqual(3);

          HOT.undo();

          expect(countCols()).toEqual(2);

          HOT.redo();

          expect(countCols()).toEqual(3);
        });

        it('should redo creation of multiple columns', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countCols()).toEqual(2);

          alter('insert_col', 1, 5);

          expect(countCols()).toEqual(7);

          HOT.undo();

          expect(countCols()).toEqual(2);

          HOT.redo();

          expect(countCols()).toEqual(7);
        });

        it('should redo removal of single column', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          alter('remove_col');

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          HOT.redo();

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
        });

        it('should redo removal of multiple columns', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 4)
          });

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');

          alter('remove_col', 1, 3);

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(0, 2)).toBeNull();
          expect(getDataAtCell(0, 3)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
          expect(getDataAtCell(1, 2)).toBeNull();
          expect(getDataAtCell(1, 3)).toBeNull();

          HOT.undo();

          expect(countCols()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(0, 2)).toEqual('C1');
          expect(getDataAtCell(0, 3)).toEqual('D1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(1, 2)).toEqual('C2');
          expect(getDataAtCell(1, 3)).toEqual('D2');

          HOT.redo();

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeNull();
          expect(getDataAtCell(0, 2)).toBeNull();
          expect(getDataAtCell(0, 3)).toBeNull();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeNull();
          expect(getDataAtCell(1, 2)).toBeNull();
          expect(getDataAtCell(1, 3)).toBeNull();
        });

        it('should redo multiple changes', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          const HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('Y2');

          HOT.undo();
          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(getDataAtCell(0, 0)).toBe('A1');
          expect(getDataAtCell(1, 0)).toBe('A2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('A2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('B1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('B2');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('Y2');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('X1');
          expect(getDataAtCell(1, 0)).toBe('X2');
          expect(getDataAtCell(0, 1)).toBe('Y1');
          expect(getDataAtCell(1, 1)).toBe('Y2');
        });

        it('should redo multiple changes in cell with validator', (done) => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
          });

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            HOT.undo();
          }, 400);

          setTimeout(() => {
            HOT.undo();
          }, 600);

          setTimeout(() => {
            HOT.undo();
          }, 800);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.redo();
          }, 1000);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.redo();
          }, 1200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.redo();
          }, 1400);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            HOT.redo();
          }, 1600);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');

            HOT.redo();
          }, 1800);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');
            done();
          }, 2000);
        });

        it('should redo multiple row creations', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');
          alter('insert_row');
          alter('insert_row');
          alter('insert_row');

          expect(countRows()).toEqual(6);

          HOT.undo();
          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();
          expect(countRows()).toEqual(3);

          HOT.redo();
          expect(countRows()).toEqual(4);

          HOT.redo();
          expect(countRows()).toEqual(5);

          HOT.redo();
          expect(countRows()).toEqual(6);

          HOT.redo();
          expect(countRows()).toEqual(6);
        });

        it('should undo multiple row removals', () => {
          const HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(4, 2)
          });

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          alter('remove_row');
          alter('remove_row');
          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');

          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(countRows()).toEqual(4);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');
          expect(getDataAtCell(3, 0)).toEqual('A4');
          expect(getDataAtCell(3, 1)).toEqual('B4');

          HOT.redo();
          expect(countRows()).toEqual(3);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');
          expect(getDataAtCell(2, 0)).toEqual('A3');
          expect(getDataAtCell(2, 1)).toEqual('B3');

          HOT.redo();
          expect(countRows()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          HOT.redo();
          expect(countRows()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');

          HOT.redo();
          expect(countRows()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
        });

        it('should redo changes only for table where the change actually took place', () => {
          spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

          const hot1 = handsontable({
            data: [
              [1],
              [2],
              [3]
            ]
          });

          spec().$container2.handsontable({
            data: [
              ['A'],
              ['B'],
              ['C']
            ]
          });

          const hot2 = spec().$container2.handsontable('getInstance');

          hot1.setDataAtCell(0, 0, 4);
          expect(hot1.getDataAtCell(0, 0)).toEqual(4);
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');

          hot1.undo();
          expect(hot1.getDataAtCell(0, 0)).toEqual(1);
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');

          hot2.redo();
          expect(hot1.getDataAtCell(0, 0)).toEqual(1);
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');

          hot1.redo();
          expect(hot1.getDataAtCell(0, 0)).toEqual(4);
          expect(hot2.getDataAtCell(0, 0)).toEqual('A');

          hot2.destroy();
          spec().$container2.remove();
        });
      });
    });

    describe('Object data', () => {

      function createObjectData() {
        return [
          { name: 'Timothy', surname: 'Dalton' },
          { name: 'Sean', surname: 'Connery' },
          { name: 'Roger', surname: 'Moore' }
        ];
      }

      describe('undo', () => {
        it('should undo single change', () => {
          handsontable({
            data: createObjectData()
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('Timothy');
        });

        it('should undo single change in cell with validator', (done) => {
          handsontable({
            data: createObjectData(),
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');

          setTimeout(() => {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('Timothy');
            done();
          }, 400);
        });

        it('should undo creation of a single row', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo removal of single row', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();

          HOT.undo();

          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
        });

        it('should undo removal of multiple rows', () => {
          const HOT = handsontable({
            data: createObjectData()
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          alter('remove_row', 1, 2);

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();
          expect(getDataAtRowProp(2, 'name')).toBeNull();
          expect(getDataAtRowProp(2, 'surname')).toBeNull();

          HOT.undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');
        });

        it('should undo multiple changes', () => {
          handsontable({
            data: createObjectData().slice(0, 2)
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

          HOT.undo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.undo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.undo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.undo();
          expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.undo();
          expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');
        });

        it('should undo multiple changes in cells with validators', (done) => {
          handsontable({
            data: createObjectData().slice(0, 2),
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.undo();
          }, 400);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.undo();
          }, 600);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.undo();
          }, 800);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.undo();
          }, 1000);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');
            done();
          }, 1200);
        });

        it('should undo multiple row creations', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');
          alter('insert_row');
          alter('insert_row');
          alter('insert_row');

          expect(countRows()).toEqual(6);

          HOT.undo();
          expect(countRows()).toEqual(5);

          HOT.undo();
          expect(countRows()).toEqual(4);

          HOT.undo();
          expect(countRows()).toEqual(3);

          HOT.undo();
          expect(countRows()).toEqual(2);

          HOT.undo();
          expect(countRows()).toEqual(2);

        });

        it('should undo multiple row removals', () => {
          const HOT = handsontable({
            data: createObjectData()
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          alter('remove_row');
          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

          HOT.undo();
          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

          HOT.undo();
          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          HOT.undo();
          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

        });
      });

      describe('redo', () => {
        it('should redo single change', () => {
          handsontable({
            data: createObjectData()
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('Timothy');

          HOT.redo();
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');
        });

        it('should redo single change in cell with validator', (done) => {
          handsontable({
            data: createObjectData(),
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');

          setTimeout(() => {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            expect(getDataAtCell(0, 0)).toBe('Timothy');

            HOT.redo();
          }, 400);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');
            done();
          }, 600);
        });

        it('should redo creation of a single row', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();

          expect(countRows()).toEqual(3);
        });

        it('should redo creation of multiple rows', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();

          expect(countRows()).toEqual(7);
        });

        it('should redo removal of single row', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();

          HOT.undo();

          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

          HOT.redo();

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();
        });

        it('should redo removal of multiple rows', () => {
          const HOT = handsontable({
            data: createObjectData()
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          alter('remove_row', 1, 2);

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();
          expect(getDataAtRowProp(2, 'name')).toBeNull();
          expect(getDataAtRowProp(2, 'surname')).toBeNull();

          HOT.undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          HOT.redo();

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBeNull();
          expect(getDataAtRowProp(1, 'surname')).toBeNull();
          expect(getDataAtRowProp(2, 'name')).toBeNull();
          expect(getDataAtRowProp(2, 'surname')).toBeNull();
        });

        it('should redo multiple changes', () => {
          handsontable({
            data: createObjectData().slice(0, 2)
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

          HOT.undo();
          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.redo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.redo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Sean');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.redo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

          HOT.redo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

          HOT.redo();
          expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
          expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
          expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
          expect(getDataAtRowProp(1, 'surname')).toBe('Craig');
        });

        it('should redo multiple changes in cells with validators', (done) => {
          handsontable({
            data: createObjectData().slice(0, 2),
          });
          const HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            HOT.undo();
          }, 200);

          setTimeout(() => {
            HOT.undo();
          }, 400);

          setTimeout(() => {
            HOT.undo();
          }, 600);

          setTimeout(() => {
            HOT.undo();
          }, 800);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.redo();
          }, 1000);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.redo();
          }, 1200);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.redo();
          }, 1400);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            HOT.redo();
          }, 1600);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            HOT.redo();
          }, 1800);

          setTimeout(() => {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');
            done();
          }, 2000);
        });

        it('should redo multiple row creations', () => {
          const HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');
          alter('insert_row');
          alter('insert_row');
          alter('insert_row');

          expect(countRows()).toEqual(6);

          HOT.undo();
          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(countRows()).toEqual(2);

          HOT.redo();
          expect(countRows()).toEqual(3);

          HOT.redo();
          expect(countRows()).toEqual(4);

          HOT.redo();
          expect(countRows()).toEqual(5);

          HOT.redo();
          expect(countRows()).toEqual(6);

          HOT.redo();
          expect(countRows()).toEqual(6);
        });

        it('should undo multiple row removals', () => {
          const HOT = handsontable({
            data: createObjectData()
          });

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          alter('remove_row');
          alter('remove_row');

          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

          HOT.undo();
          HOT.undo();
          HOT.undo();

          expect(countRows()).toEqual(3);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');
          expect(getDataAtRowProp(2, 'name')).toEqual('Roger');
          expect(getDataAtRowProp(2, 'surname')).toEqual('Moore');

          HOT.redo();
          expect(countRows()).toEqual(2);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
          expect(getDataAtRowProp(1, 'name')).toEqual('Sean');
          expect(getDataAtRowProp(1, 'surname')).toEqual('Connery');

          HOT.redo();
          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');

          HOT.redo();
          expect(countRows()).toEqual(1);
          expect(getDataAtRowProp(0, 'name')).toEqual('Timothy');
          expect(getDataAtRowProp(0, 'surname')).toEqual('Dalton');
        });
      });
    });

    it('should save the undo action only if a new value is different than the previous one', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2)
      });

      expect(getDataAtCell(0, 0)).toBe('A1');
      setDataAtCell(0, 0, 'A1');

      expect(hot.undoRedo.isUndoAvailable()).toBe(false);

      setDataAtCell(0, 0, 'A');
      expect(hot.undoRedo.isUndoAvailable()).toBe(true);
    });

    it('should not save the undo action if old and new values are not string, number or boolean', () => {
      const hot = handsontable({
        data: [
          [{ key1: 'abc' }]
        ]
      });

      expect(hot.undoRedo.isUndoAvailable()).toBe(false);
      expect(getDataAtCell(0, 0)).toEqual({ key1: 'abc' });
      setDataAtCell(0, 0, { key1: 'abc' });

      expect(hot.undoRedo.isUndoAvailable()).toBe(true);
    });
  });

  describe('plugin features', () => {
    describe('cell alignment', () => {
      it('should undo a sequence of aligning cells', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        // top 3 rows center
        selectCell(0, 0, 2, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:center');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        selectCell(6, 0, 8, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:right');

        // left 3 columns - middle
        selectCell(0, 0, 8, 2);
        hot.getPlugin('contextMenu').executeCommand('alignment:middle');

        // middle 3 columns unchanged - top

        // right 3 columns - bottom
        selectCell(0, 6, 8, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:bottom');

        let cellMeta = hot.getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        hot.undo();
        cellMeta = hot.getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        cellMeta = hot.getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        cellMeta = hot.getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        hot.undo();

        cellMeta = hot.getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = hot.getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = hot.getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        hot.undo();

        cellMeta = hot.getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toEqual(-1);

        cellMeta = hot.getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);

        cellMeta = hot.getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toEqual(-1);
        expect(cellMeta.className.indexOf('htBottom')).toEqual(-1);

        hot.undo();

        // check if all cells are either non-adjusted or adjusted to the left (as default)
        let finish;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            cellMeta = hot.getCellMeta(i, j);
            finish = cellMeta.className === void 0 || cellMeta.className.trim() === '' || cellMeta.className.trim() === 'htLeft';
            expect(finish).toBe(true);
          }
        }
      });

      it('should redo a sequence of aligning cells', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        // top 3 rows center
        selectCell(0, 0, 2, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:center');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        selectCell(6, 0, 8, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:right');

        // left 3 columns - middle
        selectCell(0, 0, 8, 2);
        hot.getPlugin('contextMenu').executeCommand('alignment:middle');

        // middle 3 columns unchanged - top

        // right 3 columns - bottom
        selectCell(0, 6, 8, 8);
        hot.getPlugin('contextMenu').executeCommand('alignment:bottom');

        let cellMeta = hot.getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(0, 7);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        cellMeta = hot.getCellMeta(7, 7);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);

        hot.undo();
        hot.undo();
        hot.undo();
        hot.undo();

        // check if all cells are either non-adjusted or adjusted to the left (as default)
        let finish;
        for (let i = 0; i < 9; i++) {
          for (let j = 0; j < 9; j++) {
            cellMeta = hot.getCellMeta(i, j);
            finish = cellMeta.className === void 0 || cellMeta.className.trim() === '' || cellMeta.className.trim() === 'htLeft';
            expect(finish).toBe(true);
          }
        }

        hot.redo();
        cellMeta = hot.getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(1, 5);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(2, 8);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);

        hot.redo();
        cellMeta = hot.getCellMeta(6, 0);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(7, 5);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(8, 8);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        hot.redo();
        cellMeta = hot.getCellMeta(0, 0);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(5, 1);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(8, 2);
        expect(cellMeta.className.indexOf('htMiddle')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);

        hot.redo();
        cellMeta = hot.getCellMeta(0, 6);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htCenter')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(5, 7);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        cellMeta = hot.getCellMeta(8, 8);
        expect(cellMeta.className.indexOf('htBottom')).toBeGreaterThan(-1);
        expect(cellMeta.className.indexOf('htRight')).toBeGreaterThan(-1);
      });
    });

    it('should exposed new methods when plugin is enabled', () => {
      const hot = handsontable({
        undo: false
      });

      expect(hot.undo).toBeUndefined();
      expect(hot.redo).toBeUndefined();
      expect(hot.isUndoAvailable).toBeUndefined();
      expect(hot.isRedoAvailable).toBeUndefined();
      expect(hot.clearUndo).toBeUndefined();

      updateSettings({
        undo: true
      });

      expect(typeof hot.undo).toEqual('function');
      expect(typeof hot.redo).toEqual('function');
      expect(typeof hot.isUndoAvailable).toEqual('function');
      expect(typeof hot.isRedoAvailable).toEqual('function');
      expect(typeof hot.clearUndo).toEqual('function');
    });

    it('should remove exposed methods when plugin is disbaled', () => {
      const hot = handsontable({
        undo: true
      });

      expect(typeof hot.undo).toEqual('function');
      expect(typeof hot.redo).toEqual('function');
      expect(typeof hot.isUndoAvailable).toEqual('function');
      expect(typeof hot.isRedoAvailable).toEqual('function');
      expect(typeof hot.clearUndo).toEqual('function');

      updateSettings({
        undo: false
      });

      expect(hot.undo).toBeUndefined();
      expect(hot.redo).toBeUndefined();
      expect(hot.isUndoAvailable).toBeUndefined();
      expect(hot.isRedoAvailable).toBeUndefined();
      expect(hot.clearUndo).toBeUndefined();
    });

    describe('Keyboard shortcuts', () => {
      it('should undo single change after hitting CTRL+Z', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        keyDown('ctrl+z');
        expect(getDataAtCell(0, 0)).toBe('A1');
      });

      it('should redo single change after hitting CTRL+Y', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });
        const HOT = getInstance();

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        HOT.undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

        keyDown('ctrl+y');

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should redo single change after hitting CTRL+SHIFT+Z', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });
        const HOT = getInstance();

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        HOT.undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

        keyDown('ctrl+shift+z');

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should be possible to block keyboard shortcuts', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2),
          beforeKeyDown: (e) => {
            const ctrlDown = (e.ctrlKey || e.metaKey) && !e.altKey;

            if (ctrlDown && (e.keyCode === 90 || (e.shiftKey && e.keyCode === 90))) {
              Handsontable.dom.stopImmediatePropagation(e);
            }
          }
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        keyDown('ctrl+z');
        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should not undo changes in the other cells if editor is open', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2),
        });

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        selectCell(1, 0);
        keyDownUp('enter');
        keyDown('ctrl+z');
        expect(getDataAtCell(0, 0)).toBe('new value');
      });
    });
  });

  describe('Hooks', () => {
    it('should fire a `beforeUndo` hook after the undo process begins', (done) => {
      const beforeUndoSpy = jasmine.createSpy('beforeUndo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeUndo', beforeUndoSpy);
      hot.addHook('beforeUndo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
      }, 10);

      setTimeout(() => {
        expect(beforeUndoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });

    it('should fire a `beforeRedo` hook before the redo process begins', (done) => {
      const beforeRedoSpy = jasmine.createSpy('beforeRedo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeRedo', beforeRedoSpy);
      hot.addHook('beforeRedo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
        hot.redo();
      }, 10);

      setTimeout(() => {
        expect(beforeRedoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });

    it('should fire a `afterRedo` hook after the redo process begins', (done) => {
      const afterRedoSpy = jasmine.createSpy('afterRedo');
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 2),
      });
      let hookData = null;

      hot.addHook('beforeRedo', afterRedoSpy);
      hot.addHook('beforeRedo', (data) => {
        hookData = data;
      });

      alter('remove_row', 1);

      setTimeout(() => {
        hot.undo();
        hot.redo();
      }, 10);

      setTimeout(() => {
        expect(afterRedoSpy.calls.count()).toEqual(1);
        expect(hookData).not.toBe(null);
        expect(hookData.actionType).toEqual('remove_row');
        expect(hookData.data).toEqual([['A2', 'B2']]);
        done();
      }, 100);
    });
  });

  describe('selection', () => {
    it('should keep saved selection state ater undo and redo data change', () => {
      handsontable();

      selectCell(0, 0);
      setDataAtCell(0, 0, 'test');
      selectCell(0, 1);
      setDataAtCell(0, 1, 'test2');

      selectCell(0, 2);
      undo();
      undo();

      expect(getSelectedLast()).toEqual([0, 0, 0, 0]);

      redo();
      redo();

      expect(getSelectedLast()).toEqual([0, 1, 0, 1]);
    });

    it('should keep saved selection state ater undoing non-contignous selected cells', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
      });

      selectCells([[0, 0, 1, 1], [1, 2, 2, 3]]);
      emptySelectedCells();

      selectCell(4, 0);
      undo();

      expect(getSelected().length).toBe(2);
      expect(getSelected()[0]).toEqual([0, 0, 1, 1]);
      expect(getSelected()[1]).toEqual([1, 2, 2, 3]);
    });
  });
});
