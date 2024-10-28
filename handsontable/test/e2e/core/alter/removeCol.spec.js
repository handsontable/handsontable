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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  describe('`remove_col` action', () => {
    describe('for multiple items at once', () => {
      it('should remove columns when index groups are passed in ascending order', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 15),
        });
        // [[columnVisualIndex, amountColumnsToRemove] ...]
        alter('remove_col', [[1, 3], [5, 1], [7, 3], [11, 2]]);
        // It remove columns as follow:
        //     1--------3      5-1     7--------3      11---2
        // A1, B1, C1, D1, E1, F1, G1, H1, I1, J1, K1, L1, M1, N1, O1
        //
        // Result: A1, E1, G1, K1, N1, O1

        expect(getDataAtRow(0)).toEqual(['A1', 'E1', 'G1', 'K1', 'N1', 'O1']);
        expect(getData()[0].length).toBe(6);
      });

      it('should remove columns when index groups are passed in descending order', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 15),
        });
        // [[columnVisualIndex, amountColumnsToRemove] ...]
        alter('remove_col', [[11, 2], [7, 3], [5, 1], [1, 3]]);
        // It remove columns as follow:
        //     1--------3      5-1     7--------3      11---2
        // A1, B1, C1, D1, E1, F1, G1, H1, I1, J1, K1, L1, M1, N1, O1
        //
        // Result: A1, E1, G1, K1, N1, O1

        expect(getDataAtRow(0)).toEqual(['A1', 'E1', 'G1', 'K1', 'N1', 'O1']);
        expect(getData()[0].length).toBe(6);
      });

      it('should remove columns when index groups are passed as intersecting values', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 15),
        });
        // [[columnVisualIndex, amountColumnsToRemove] ...]
        alter('remove_col', [[1, 3], [4, 2], [5, 5], [11, 1]]);
        // It remove columns as follow:
        //     1--------------------------------9     11-1
        // A1, B1, C1, D1, E1, F1, G1, H1, I1, J1, K1, L1, M1, N1, O1
        //
        // Result: A1, K1, M1, N1, O1

        expect(getDataAtRow(0)).toEqual(['A1', 'K1', 'M1', 'N1', 'O1']);
        expect(getData()[0].length).toBe(5);
      });

      it('should remove columns when index groups are passed as intersecting values (the second scenario)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 15),
        });
        // [[columnVisualIndex, amountColumnsToRemove] ...]
        alter('remove_col', [[1, 3], [2, 1], [5, 2]]);
        // It remove columns as follow:
        //     1--------3      5----2
        // A1, B1, C1, D1, E1, F1, G1, H1, I1, J1, K1, L1, M1, N1, O1
        //
        // Result: A1, E1, H1

        expect(getDataAtRow(0)).toEqual(['A1', 'E1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1']);
        expect(getData()[0].length).toBe(10);
      });

      it('should remove columns when index groups are passed as intersecting values (placed randomly)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 15),
        });
        // [[columnVisualIndex, amountColumnsToRemove] ...]
        alter('remove_col', [[4, 2], [11, 1], [5, 5], [1, 3]]);
        // It remove columns as follow:
        //     1--------------------------------9     11-1
        // A1, B1, C1, D1, E1, F1, G1, H1, I1, J1, K1, L1, M1, N1, O1
        //
        // Result: A1, K1, M1, N1, O1

        expect(getDataAtRow(0)).toEqual(['A1', 'K1', 'M1', 'N1', 'O1']);
        expect(getData()[0].length).toBe(5);
      });

      it('should not display rows when every column have been removed (row header enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true
        });

        alter('remove_col', 0, 5);

        expect(countRows()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should not display rows when every column have been removed (column header enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          colHeaders: true
        });

        alter('remove_col', 0, 5);

        expect(countRows()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should not display rows when every column have been removed (both headers enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true
        });

        alter('remove_col', 0, 5);

        expect(countRows()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(1);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(1); // Corner visible.
      });

      it('should remove all rows if removing all columns', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
        });

        alter('remove_col', 0, 10);

        expect(countCols()).toBe(0);
        expect(countRows()).toBe(0);
      });
    });

    it('should not remove column if amount is zero', () => {
      handsontable({
        data: arrayOfArrays(),
      });
      const countedColumns = countCols();

      alter('remove_col', 1, 0);

      expect(countCols()).toBe(countedColumns);
    });

    it('should remove one column if amount parameter is empty', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('remove_col', 1);

      expect(countCols()).toEqual(7);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c');
    });

    it('should remove as many columns as given in the amount parameter', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('remove_col', 1, 3);

      expect(countCols()).toEqual(5);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e');
    });

    it('should not remove more columns that exist', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('remove_col', 6, 3);

      expect(countCols()).toEqual(6);
      expect(spec().$container.find('tr:eq(1) td:last').html()).toEqual('f');
    });

    it('should remove one column from end if no parameters are given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('remove_col');

      expect(countCols()).toEqual(7);
      expect(spec().$container.find('tr:eq(1) td:last').html()).toEqual('g');
    });

    it('should remove amount of columns from end if index parameter is not given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('remove_col', null, 3);

      expect(countCols()).toEqual(5);
      expect(spec().$container.find('tr:eq(1) td:last').html()).toEqual('e');
    });

    it('should fire beforeRemoveCol event before removing col', () => {
      const onBeforeRemoveCol = jasmine.createSpy('onBeforeRemoveCol');

      handsontable({
        beforeRemoveCol: onBeforeRemoveCol
      });
      alter('remove_col');

      expect(onBeforeRemoveCol).toHaveBeenCalledWith(countCols(), 1, [4]);
    });

    it('should not remove column if removing has been canceled by beforeRemoveCol event handler', () => {
      const onBeforeRemoveCol = jasmine.createSpy('onBeforeRemoveCol');

      onBeforeRemoveCol.and.callFake(() => false);

      handsontable({
        beforeRemoveCol: onBeforeRemoveCol
      });

      expect(countCols()).toEqual(5);

      alter('remove_col');

      expect(countCols()).toEqual(5);
    });

    it('should not remove cell meta objects if removing has been canceled by beforeRemoveCol event handler', () => {
      handsontable({
        beforeRemoveCol: () => false,
      });

      setCellMeta(0, 2, '_test', 'foo');

      alter('remove_col', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(0, 1)._test).toBeUndefined();
      expect(getCellMeta(0, 2)._test).toBe('foo');
      expect(getCellMeta(0, 3)._test).toBeUndefined();
      expect(getCellMeta(0, 4)._test).toBeUndefined();
    });

    it('should fire callback on remove col', () => {
      let outputBefore;
      let outputAfter;

      handsontable({
        minRows: 5,
        data: arrayOfArrays(),
        beforeRemoveCol(index, amount, removedCols, source) {
          outputBefore = [index, amount, removedCols, source];
        },
        afterRemoveCol(index, amount, removedCols, source) {
          outputAfter = [index, amount, removedCols, source];
        }
      });
      alter('remove_col', 1, 2, 'customSource');

      expect(outputBefore).toEqual([1, 2, [1, 2], 'customSource']);
      expect(outputAfter).toEqual([1, 2, [1, 2], 'customSource']);
    });

    it('should remove column\'s properties', () => {
      handsontable({
        startCols: 3,
        startRows: 1
      });

      getCellMeta(0, 0).someValue = [0, 0];
      getCellMeta(0, 1).someValue = [0, 1];
      getCellMeta(0, 2).someValue = [0, 2];

      alter('remove_col', 0);

      expect(getCellMeta(0, 0).someValue).toEqual([0, 1]);
      expect(getCellMeta(0, 1).someValue).toEqual([0, 2]);
    });

    it('should remove column when not all rows are visible in the viewport', () => {
      spec().$container.css({
        height: '100',
        overflow: 'auto'
      });

      handsontable({
        startCols: 3,
        startRows: 20
      });

      expect(getHtCore().find('tbody tr').length).toBeLessThan(20);
      expect(countCols()).toEqual(3);

      alter('remove_col', 0);

      expect(countCols()).toEqual(2);
    });

    it('should not remove column header together with the column, if headers were NOT specified explicitly', () => {

      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: true
      });

      expect(getColHeader()).toEqual(['A', 'B', 'C']);

      expect(countCols()).toEqual(3);

      alter('remove_col', 1);

      expect(countCols()).toEqual(2);

      expect(getColHeader()).toEqual(['A', 'B']);

    });

    it('should remove column header together with the column, if headers were specified explicitly', () => {
      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: ['Header0', 'Header1', 'Header2']
      });

      expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);

      expect(countCols()).toEqual(3);

      alter('remove_col', 1);

      expect(countCols()).toEqual(2);

      expect(getColHeader()).toEqual(['Header0', 'Header2']);
    });

    it('should decrement the number of fixed columns, if a fix column is removed', () => {
      const hot = handsontable({
        startCols: 1,
        startRows: 3,
        fixedColumnsStart: 4
      });

      alter('remove_col', 1, 1);
      expect(hot.getSettings().fixedColumnsStart).toEqual(3);
      alter('remove_col', 1, 2);
      expect(hot.getSettings().fixedColumnsStart).toEqual(1);
    });

    it('should shift the cell meta according to the new column layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('remove_col', 1, 1);

      expect(getCellMeta(1, 1).className).toEqual('test');
    });

    it('should shift the cell meta according to the new columns (>1) layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('remove_col', 0, 2);

      expect(getCellMeta(1, 0).className).toEqual('test');
    });
  });
});
