describe('UndoRedo', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe("core features", function () {
    describe("Array data", function () {
      describe("undo", function () {
        it('should undo single change', function () {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          expect(getDataAtCell(0, 0)).toBe('X1');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');
        });

        it('should undo single change on cell with validator', function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'X1');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('A1');
          });


        });

        it('should undo creation of a single row', function () {
          var HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows', function () {
          var HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows with minSpareRows', function () {
          var HOT = handsontable({
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

        it('should undo removal of single row', function () {
          var HOT = handsontable({
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

        it('should undo removal of multiple rows', function () {
          var HOT = handsontable({
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

        it('should undo creation of a single column (colHeaders: undefined)', function () {
          var HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 3)
          });

          expect(countCols()).toEqual(3);

          alter('insert_col');

          expect(countCols()).toEqual(4);

          HOT.undo();

          expect(countCols()).toEqual(3);
        });

        it('should undo creation of a single column (colHeaders: true)', function () {
          var HOT = handsontable({
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

        it('should undo creation of a single column (colHeaders: Array)', function () {
          var HOT = handsontable({
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

        it('should undo creation of multiple columns (colHeaders: undefined)', function () {
          var HOT = handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });

          expect(countCols()).toEqual(2);

          alter('insert_col', 1, 5);

          expect(countCols()).toEqual(7);

          HOT.undo();

          expect(countCols()).toEqual(2);
        });

        it('should undo creation of multiple columns (colHeaders: true)', function () {
          var HOT = handsontable({
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

        it('should undo creation of multiple columns (colHeaders: Array)', function () {
          var HOT = handsontable({
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

        it('should undo creation of multiple columns with minSpareCols', function () {
          var HOT = handsontable({
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

        it('should undo removal of single column (colHeaders: undefined)', function () {
          var HOT = handsontable({
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

        it('should undo removal of single column (colHeaders: true)', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
          expect(getColHeader()).toEqual(['A']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          expect(getColHeader()).toEqual(['A', 'B']);

        });

        it('should undo removal of single column (colHeaders: Array)', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
          expect(getColHeader()).toEqual(['Header1']);

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          expect(getColHeader()).toEqual(['Header1', 'Header2']);

        });


        it('should undo removal of multiple columns (colHeaders: undefined)', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 2)).toBeUndefined();
          expect(getDataAtCell(0, 3)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('D2');
          expect(getDataAtCell(1, 2)).toBeUndefined();
          expect(getDataAtCell(1, 3)).toBeUndefined();

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

        it('should undo removal of multiple columns (colHeaders: true)', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(0, 2)).toBeUndefined();
          expect(getDataAtCell(0, 3)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
          expect(getDataAtCell(1, 2)).toBeUndefined();
          expect(getDataAtCell(1, 3)).toBeUndefined();
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

        it('should undo removal of multiple columns (colHeaders: Array)', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 2)).toBeUndefined();
          expect(getDataAtCell(0, 3)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('D2');
          expect(getDataAtCell(1, 2)).toBeUndefined();
          expect(getDataAtCell(1, 3)).toBeUndefined();
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

        it("should undo multiple changes", function () {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          var HOT = getInstance();

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

        it("should undo multiple changes in cells with validators", function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          waitsFor(function () {
            return validatorSpy.calls.length == 4;
          }, 'validatorSpy call after modification', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validatorSpy call after first undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.undo();
          });


          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validatorSpy call after second undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validatorSpy call after third undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validatorSpy call after fourth undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.undo();
          });

          waits(100);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');
          });


        });

        it('should undo multiple row creations', function () {
          var HOT = handsontable({
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

        it('should undo multiple row removals', function () {
          var HOT = handsontable({
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

        it('should undo changes only for table where the change actually took place', function () {
          this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

          var hot1 = handsontable({
            data: [
              [1],
              [2],
              [3]
            ]
          });

          this.$container2.handsontable({
            data: [
              ['A'],
              ['B'],
              ['C']
            ]
          });

          var hot2 = this.$container2.handsontable('getInstance');

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
          this.$container2.remove();
        });
      });
      describe("redo", function () {
        it('should redo single change', function () {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'new value');

          expect(getDataAtCell(0, 0)).toBe('new value');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('A1');

          HOT.redo();
          expect(getDataAtCell(0, 0)).toBe('new value');
        });

        it('should redo single change in cell with validator', function () {
          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'new value');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after change', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('new value');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('A1');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after redo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('new value');
          });

        });

        it('should redo creation of a single row', function () {
          var HOT = handsontable({
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

        it('should redo creation of multiple rows', function () {
          var HOT = handsontable({
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

        it('should redo removal of single row', function () {
          var HOT = handsontable({
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

        it('should redo removal of multiple rows', function () {
          var HOT = handsontable({
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

        it('should redo creation of a single column', function () {
          var HOT = handsontable({
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

        it('should redo creation of multiple columns', function () {
          var HOT = handsontable({
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

        it('should redo removal of single column', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();

          HOT.undo();

          expect(countCols()).toEqual(2);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toEqual('B1');
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toEqual('B2');

          HOT.redo();

          expect(countCols()).toEqual(1);
          expect(getDataAtCell(0, 0)).toEqual('A1');
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
        });

        it('should redo removal of multiple columns', function () {
          var HOT = handsontable({
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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(0, 2)).toBeUndefined();
          expect(getDataAtCell(0, 3)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
          expect(getDataAtCell(1, 2)).toBeUndefined();
          expect(getDataAtCell(1, 3)).toBeUndefined();

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
          expect(getDataAtCell(0, 1)).toBeUndefined();
          expect(getDataAtCell(0, 2)).toBeUndefined();
          expect(getDataAtCell(0, 3)).toBeUndefined();
          expect(getDataAtCell(1, 0)).toEqual('A2');
          expect(getDataAtCell(1, 1)).toBeUndefined();
          expect(getDataAtCell(1, 2)).toBeUndefined();
          expect(getDataAtCell(1, 3)).toBeUndefined();
        });

        it("should redo multiple changes", function () {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2)
          });
          var HOT = getInstance();

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

        it("should redo multiple changes in cell with validator", function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(2, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtCell(0, 0, 'X1');
          setDataAtCell(1, 0, 'X2');
          setDataAtCell(0, 1, 'Y1');
          setDataAtCell(1, 1, 'Y2');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after change', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');

            validatorSpy.reset();
            HOT.undo();

          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 1st undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 2nd undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 3rd undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 4th undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('A1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 1st redo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('A2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 2nd redo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('B1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 3rd redo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('B2');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 4th redo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');
            validatorSpy.reset();
            HOT.redo();
          });

          waits(100);

          runs(function () {

            expect(validatorSpy).not.toHaveBeenCalled();

            expect(getDataAtCell(0, 0)).toBe('X1');
            expect(getDataAtCell(1, 0)).toBe('X2');
            expect(getDataAtCell(0, 1)).toBe('Y1');
            expect(getDataAtCell(1, 1)).toBe('Y2');
          });

        });

        it('should redo multiple row creations', function () {
          var HOT = handsontable({
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

        it('should undo multiple row removals', function () {
          var HOT = handsontable({
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

        it('should redo changes only for table where the change actually took place', function () {
          this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

          var hot1 = handsontable({
            data: [
              [1],
              [2],
              [3]
            ]
          });

          this.$container2.handsontable({
            data: [
              ['A'],
              ['B'],
              ['C']
            ]
          });

          var hot2 = this.$container2.handsontable('getInstance');

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
          this.$container2.remove();
        });
      });
    });

    describe("Object data", function () {

      function createObjectData() {
        return [
          {name: 'Timothy', surname: "Dalton"},
          {name: 'Sean', surname: "Connery"},
          {name: 'Roger', surname: "Moore"}
        ];
      }

      describe("undo", function () {
        it('should undo single change', function () {
          handsontable({
            data: createObjectData()
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('Timothy');
        });

        it('should undo single change in cell with validator', function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: createObjectData(),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after changes', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            return expect(getDataAtCell(0, 0)).toBe('Timothy');
          });

        });

        it('should undo creation of a single row', function () {
          var HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row');

          expect(countRows()).toEqual(3);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo creation of multiple rows', function () {
          var HOT = handsontable({
            data: createObjectData().slice(0, 2)
          });

          expect(countRows()).toEqual(2);

          alter('insert_row', 0, 5);

          expect(countRows()).toEqual(7);

          HOT.undo();

          expect(countRows()).toEqual(2);
        });

        it('should undo removal of single row', function () {
          var HOT = handsontable({
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

        it('should undo removal of multiple rows', function () {
          var HOT = handsontable({
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

        it("should undo multiple changes", function () {
          handsontable({
            data: createObjectData().slice(0, 2)
          });
          var HOT = getInstance();

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

        it("should undo multiple changes in cells with validators", function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: createObjectData().slice(0, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          waitsFor(function () {
            return validatorSpy.calls.length == 4;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');


            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);


          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');


            validatorSpy.reset();
            HOT.undo();
          });

          waits(100);

          runs(function () {
            expect(validatorSpy).not.toHaveBeenCalled();

            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');
          });

        });

        it('should undo multiple row creations', function () {
          var HOT = handsontable({
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

        it('should undo multiple row removals', function () {
          var HOT = handsontable({
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

      describe("redo", function () {
        it('should redo single change', function () {
          handsontable({
            data: createObjectData()
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');

          HOT.undo();
          expect(getDataAtCell(0, 0)).toBe('Timothy');

          HOT.redo();
          expect(getDataAtRowProp(0, 0)).toBe('Pearce');
        });

        it('should redo single change in cell with validator', function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: createObjectData(),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 0, 'Pearce');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after change', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtCell(0, 0)).toBe('Timothy');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 0)).toBe('Pearce');
          });


        });

        it('should redo creation of a single row', function () {
          var HOT = handsontable({
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

        it('should redo creation of multiple rows', function () {
          var HOT = handsontable({
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

        it('should redo removal of single row', function () {
          var HOT = handsontable({
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

        it('should redo removal of multiple rows', function () {
          var HOT = handsontable({
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

        it("should redo multiple changes", function () {
          handsontable({
            data: createObjectData().slice(0, 2)
          });
          var HOT = getInstance();

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

        it("should redo multiple changes in cells with validators", function () {

          var validatorSpy = jasmine.createSpy('validatorSpy').andCallFake(function (value, result) {
            result(true);
          });

          handsontable({
            data: createObjectData().slice(0, 2),
            validator: validatorSpy
          });
          var HOT = getInstance();

          setDataAtRowProp(0, 'name', 'Pierce');
          setDataAtRowProp(0, 'surname', 'Brosnan');
          setDataAtRowProp(1, 'name', 'Daniel');
          setDataAtRowProp(1, 'surname', 'Craig');

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after change', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 1st undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 2nd undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 3rd undo', 1000);

          runs(function () {
            validatorSpy.reset();
            HOT.undo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 4th undo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Timothy');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            validatorSpy.reset();
            HOT.redo();
          });


          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 1st redo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Dalton');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 2nd redo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Sean');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');


            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 3rd redo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Connery');

            validatorSpy.reset();
            HOT.redo();
          });

          waitsFor(function () {
            return validatorSpy.calls.length;
          }, 'validator spy call after 4th redo', 1000);

          runs(function () {
            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');

            validatorSpy.reset();
            HOT.redo();
          });

          waits(100);

          runs(function () {

            expect(validatorSpy).not.toHaveBeenCalled();

            expect(getDataAtRowProp(0, 'name')).toBe('Pierce');
            expect(getDataAtRowProp(0, 'surname')).toBe('Brosnan');
            expect(getDataAtRowProp(1, 'name')).toBe('Daniel');
            expect(getDataAtRowProp(1, 'surname')).toBe('Craig');
          });

        });

        it('should redo multiple row creations', function () {
          var HOT = handsontable({
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

        it('should undo multiple row removals', function () {
          var HOT = handsontable({
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
  });

  describe("plugin features", function () {

    describe("cell alignment", function () {

      it("should undo a sequence of aligning cells", function () {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        var topSection = new WalkontableCellRange(
            new WalkontableCellCoords(2, 8),
            new WalkontableCellCoords(0, 0),
            new WalkontableCellCoords(2, 8)
          ),
          bottomSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 8),
            new WalkontableCellCoords(6, 0),
            new WalkontableCellCoords(8, 8)
          ),
          leftSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 2),
            new WalkontableCellCoords(0, 0),
            new WalkontableCellCoords(8, 2)
          ),
          rightSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 8),
            new WalkontableCellCoords(0, 6),
            new WalkontableCellCoords(8, 8)
          );

        // top 3 rows center
        hot.contextMenu.align.call(hot, topSection, 'horizontal', 'htCenter');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        hot.contextMenu.align.call(hot, bottomSection, 'horizontal', 'htRight');

        // left 3 columns - middle
        hot.contextMenu.align.call(hot, leftSection, 'vertical', 'htMiddle');

        //middle 3 columns unchanged - top

        // right 3 columns - bottom
        hot.contextMenu.align.call(hot, rightSection, 'vertical', 'htBottom');

        var cellMeta = hot.getCellMeta(0, 0);
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
        var finish;
        for (var i = 0; i < 9; i++) {
          for (var j = 0; j < 9; j++) {
            cellMeta = hot.getCellMeta(i, j);
            finish = cellMeta.className === void 0 || cellMeta.className.trim() === '' || cellMeta.className.trim() === 'htLeft';
            expect(finish).toBe(true);
          }
        }

      });

      it("should redo a sequence of aligning cells", function () {
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(9, 9),
          contextMenu: true,
          colWidths: [50, 50, 50, 50, 50, 50, 50, 50, 50],
          rowHeights: [50, 50, 50, 50, 50, 50, 50, 50, 50]
        });

        var topSection = new WalkontableCellRange(
            new WalkontableCellCoords(2, 8),
            new WalkontableCellCoords(0, 0),
            new WalkontableCellCoords(2, 8)
          ),
          bottomSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 8),
            new WalkontableCellCoords(6, 0),
            new WalkontableCellCoords(8, 8)
          ),
          leftSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 2),
            new WalkontableCellCoords(0, 0),
            new WalkontableCellCoords(8, 2)
          ),
          rightSection = new WalkontableCellRange(
            new WalkontableCellCoords(8, 8),
            new WalkontableCellCoords(0, 6),
            new WalkontableCellCoords(8, 8)
          );

        // top 3 rows center
        hot.contextMenu.align.call(hot, topSection, 'horizontal', 'htCenter');

        // middle 3 rows unchanged - left

        // bottom 3 rows right
        hot.contextMenu.align.call(hot, bottomSection, 'horizontal', 'htRight');

        // left 3 columns - middle
        hot.contextMenu.align.call(hot, leftSection, 'vertical', 'htMiddle');

        //middle 3 columns unchanged - top

        // right 3 columns - bottom
        hot.contextMenu.align.call(hot, rightSection, 'vertical', 'htBottom');

        var cellMeta = hot.getCellMeta(0, 0);
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
        var finish;
        for (var i = 0; i < 9; i++) {
          for (var j = 0; j < 9; j++) {
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

    it("should exposed new methods when plugin is enabled", function () {
      var hot = handsontable({
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

    it("should remove exposed methods when plugin is disbaled", function () {
      var hot = handsontable({
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

    describe("Keyboard shortcuts", function () {
      it('should undo single change after hitting CTRL+Z', function () {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });
        var HOT = getInstance();

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

//        var keyboardEvent = $.Event('keydown', {ctrlKey: true, keyCode: 'Z'.charCodeAt(0)});
//        this.$container.trigger(keyboardEvent);
        this.$container.simulate('keydown', {ctrlKey: true, keyCode: 'Z'.charCodeAt(0)});
        expect(getDataAtCell(0, 0)).toBe('A1');
      });

      it('should redo single change after hitting CTRL+Y', function () {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });
        var HOT = getInstance();

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        HOT.undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

//        var keyboardEvent = $.Event('keydown', {ctrlKey: true, keyCode: 'Y'.charCodeAt(0)});
//        this.$container.trigger(keyboardEvent);
        this.$container.simulate('keydown', {ctrlKey: true, keyCode: 'Y'.charCodeAt(0)});

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

      it('should redo single change after hitting CTRL+SHIFT+Z', function () {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(2, 2)
        });
        var HOT = getInstance();

        selectCell(0, 0);
        setDataAtCell(0, 0, 'new value');

        expect(getDataAtCell(0, 0)).toBe('new value');

        HOT.undo();
        expect(getDataAtCell(0, 0)).toBe('A1');

//        var keyboardEvent = $.Event('keydown', {ctrlKey: true, shiftKey: true, keyCode: 'Z'.charCodeAt(0)});
//        this.$container.trigger(keyboardEvent);
        this.$container.simulate('keydown', {ctrlKey: true, shiftKey: true, keyCode: 'Z'.charCodeAt(0)});

        expect(getDataAtCell(0, 0)).toBe('new value');
      });

    });
  });

});
