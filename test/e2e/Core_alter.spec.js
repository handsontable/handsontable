describe('Core_alter', () => {
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

  const arrayOfArrays = function() {
    return [
      ['', 'Kia', 'Nissan', 'Toyota', 'Honda'],
      ['2008', 10, 11, 12, 13],
      ['2009', 20, 11, 14, 13],
      ['2010', 30, 15, 12, 13]
    ];
  };

  describe('remove row', () => {
    describe('multiple items at once', () => {
      it('should remove rows when index groups are passed in ascending order', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        alter('remove_row', [[1, 3], [5, 1], [7, 3], [11, 2]]);
        // It remove rows as follow:
        //     1--------3      5-1     7---------3       11-----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A7, A11, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A7', 'A11', 'A14', 'A15']);
        expect(getData().length).toBe(6);
      });

      it('should remove rows when index groups are passed in descending order', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        alter('remove_row', [[11, 2], [7, 3], [5, 1], [1, 3]]);
        // It remove rows as follow:
        //     1--------3      5-1     7---------3       11-----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A7, A11, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A7', 'A11', 'A14', 'A15']);
        expect(getData().length).toBe(6);
      });

      it('should remove rows when index groups are passed as intersecting values', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        alter('remove_row', [[1, 3], [4, 2], [5, 5], [11, 1]]);
        // It remove rows as follow:
        //     1---------------------------------9       11-1
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A11, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A11', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(5);
      });

      it('should remove rows when index groups are passed as intersecting values (the second scenario)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        alter('remove_row', [[1, 3], [2, 1], [5, 2]]);
        // It remove columns as follow:
        //     1--------3      5----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A8, A9, A10, A11, A12, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(10);
      });

      it('should remove rows when index groups are passed as intersecting values (placed randomly)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        alter('remove_row', [[4, 2], [11, 1], [5, 5], [1, 3]]);
        // It remove rows as follow:
        //     1---------------------------------9       11-1
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A11, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A11', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(5);
      });

      it('should not display columns when every row have been removed (row header enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should not display columns when every row have been removed (column header enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          colHeaders: true
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should not display columns when every row have been removed (both headers enabled)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(1);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(1); // Corner visible.
      });

      it('should not display columns when every row have been removed and just `columns` property is defined', () => {
        handsontable({
          data: arrayOfNestedObjects(),
          columns: [
            { data: 'id' },
            { data: 'name.first' }
          ]
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(2);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed and `columns` property is defined with `title` for column header', () => {
        handsontable({
          data: arrayOfNestedObjects(),
          columns: [
            { data: 'id', title: 'ID' },
            { data: 'name.first', title: 'First name' }
          ]
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(2);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(2);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed and `dataSchema` property is defined and column headers are defined', () => {
        handsontable({
          data: arrayOfNestedObjects(),
          dataSchema: {
            id: null,
            name: { first: null, last: null }
          },
          colHeaders: true
        });

        alter('remove_row', 0, 5);

        expect(countCols()).toBe(3);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(3);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });
    });

    it('should remove row', () => {
      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ]
      });
      alter('remove_row', 1);

      expect(getDataAtCell(1, 1)).toEqual('Joan'); // Joan should be moved up
      expect(getData().length).toEqual(5); // new row should be added by keepEmptyRows
    });

    it('should not remove row if amount is zero', () => {
      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
      });
      const countedRows = countRows();

      alter('remove_row', 1, 0);

      expect(countRows()).toBe(countedRows);
    });

    it('should fire beforeRemoveRow event before removing row', () => {
      const onBeforeRemoveRow = jasmine.createSpy('onBeforeRemoveRow');

      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeRemoveRow: onBeforeRemoveRow,
      });
      alter('remove_row', 2, 1, 'customSource');

      expect(onBeforeRemoveRow).toHaveBeenCalledWith(countRows(), 1, [2], 'customSource');
    });

    it('should not remove row if removing has been canceled by beforeRemoveRow event handler', () => {
      const onBeforeRemoveRow = jasmine.createSpy('onBeforeRemoveRow');

      onBeforeRemoveRow.and.callFake(() => false);

      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeRemoveRow: onBeforeRemoveRow
      });

      expect(countRows()).toEqual(3);

      alter('remove_row');

      expect(countRows()).toEqual(3);
    });

    it('should not remove cell meta objects if removing has been canceled by beforeRemoveRow event handler', () => {
      handsontable({
        beforeRemoveRow: () => false,
      });

      setCellMeta(2, 0, '_test', 'foo');

      alter('remove_row', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(1, 0)._test).toBeUndefined();
      expect(getCellMeta(2, 0)._test).toBe('foo');
      expect(getCellMeta(3, 0)._test).toBeUndefined();
      expect(getCellMeta(4, 0)._test).toBeUndefined();
    });

    it('should not remove rows below minRows', () => {
      handsontable({
        startRows: 5,
        minRows: 4
      });
      alter('remove_row', 1);
      alter('remove_row', 1);
      alter('remove_row', 1);

      expect(countRows()).toEqual(4);
    });

    it('should not remove cols below minCols', () => {
      handsontable({
        startCols: 5,
        minCols: 4
      });
      alter('remove_col', 1);
      alter('remove_col', 1);
      alter('remove_col', 1);

      expect(countCols()).toEqual(4);
    });

    it('should remove one row if amount parameter is empty', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('remove_row', 1);

      expect(countRows()).toEqual(4);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c2');
    });

    it('should remove as many rows as given in the amount parameter', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('remove_row', 1, 3);

      expect(countRows()).toEqual(2);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e2');
    });

    it('should not remove more rows that exist', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('remove_row', 1, 10);

      expect(countRows()).toEqual(1);
      expect(getHtCore().find('tr:last td:last').html()).toEqual('a3');
    });

    it('should remove one row from end if no parameters are given', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('remove_row');

      expect(countRows()).toEqual(4);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('d1');
    });

    it('should remove amount of rows from end if index parameter is not given', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('remove_row', null, 3);

      expect(countRows()).toEqual(2);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('b1');
    });

    it('should remove rows from table with fixedRows', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3']
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      alter('remove_row', 1);

      expect(countRows()).toEqual(1);

    });

    it('should remove all rows from table with fixedRows', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3']
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      alter('remove_row', 1);
      alter('remove_row', 1);

      expect(countRows()).toEqual(0);

    });

    it('should remove row\'s cellProperties', () => {
      handsontable({
        startCols: 1,
        startRows: 3
      });

      getCellMeta(0, 0).someValue = [0, 0];
      getCellMeta(1, 0).someValue = [1, 0];
      getCellMeta(2, 0).someValue = [2, 0];

      alter('remove_row', 0);

      expect(getCellMeta(0, 0).someValue).toEqual([1, 0]);
      expect(getCellMeta(1, 0).someValue).toEqual([2, 0]);
    });

    it('should fire callback on remove row', () => {
      let outputBefore;
      let outputAfter;

      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeRemoveRow(index, amount, removedRows, source) {
          outputBefore = [index, amount, removedRows, source];
        },
        afterRemoveRow(index, amount, removedRows, source) {
          outputAfter = [index, amount, removedRows, source];
        }
      });
      alter('remove_row', 1, 2, 'customSource');

      expect(outputBefore).toEqual([1, 2, [1, 2], 'customSource']);
      expect(outputAfter).toEqual([1, 2, [1, 2], 'customSource']);
    });

    it('should decrement the number of fixed rows, if a fix row is removed', () => {
      const hot = handsontable({
        startCols: 1,
        startRows: 3,
        fixedRowsTop: 4
      });

      alter('remove_row', 1, 1);
      expect(hot.getSettings().fixedRowsTop).toEqual(3);
      alter('remove_row', 1, 2);
      expect(hot.getSettings().fixedRowsTop).toEqual(1);
    });

    it('should shift the cell meta according to the new row layout', () => {
      handsontable({
        startCols: 3,
        startRows: 4
      });

      setCellMeta(2, 1, 'className', 'test');
      alter('remove_row', 1, 1);

      expect(getCellMeta(1, 1).className).toEqual('test');
    });

    it('should shift the cell meta according to the new rows (>1) layout', () => {
      handsontable({
        startCols: 3,
        startRows: 4
      });

      setCellMeta(2, 1, 'className', 'test');
      alter('remove_row', 0, 2);

      expect(getCellMeta(0, 1).className).toEqual('test');
    });

    it('should cooperate with the `beforeRemoveRow` changing list of the removed rows properly', () => {
      const afterRemoveRow = jasmine.createSpy('afterRemoveRow');
      let hookArgumentsBefore;
      let hookArgumentsAfter;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 5),
        beforeRemoveRow(index, amount, physicalRows) {
          hookArgumentsBefore = [index, amount, [...physicalRows]];

          physicalRows.length = 0;
          physicalRows.push(0, 1, 2, 3);

          hookArgumentsAfter = [index, amount, [...physicalRows]];
        },
        afterRemoveRow
      });

      alter('remove_row', 5, 2);

      expect(getData()).toEqual([
        ['A5', 'B5', 'C5', 'D5', 'E5'],
        ['A6', 'B6', 'C6', 'D6', 'E6'],
        ['A7', 'B7', 'C7', 'D7', 'E7'],
        ['A8', 'B8', 'C8', 'D8', 'E8'],
        ['A9', 'B9', 'C9', 'D9', 'E9'],
        ['A10', 'B10', 'C10', 'D10', 'E10'],
      ]);
      expect(hookArgumentsBefore).toEqual([5, 2, [5, 6]]);
      expect(hookArgumentsAfter).toEqual([5, 2, [0, 1, 2, 3]]);
      expect(afterRemoveRow).toHaveBeenCalledWith(5, 4, [0, 1, 2, 3]);
    });
  });

  describe('remove column', () => {
    describe('multiple items at once', () => {
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
        fixedColumnsLeft: 4
      });

      alter('remove_col', 1, 1);
      expect(hot.getSettings().fixedColumnsLeft).toEqual(3);
      alter('remove_col', 1, 2);
      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
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

  describe('insert row', () => {
    it('should insert row at given index', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('insert_row', 1);

      expect(countRows()).toEqual(6);
      expect(spec().$container.find('tr:eq(2) td:eq(0)').html()).toEqual('b1');
    });

    it('should fire the beforeCreateRow hook before creating a row', () => {
      const onBeforeCreateRow = jasmine.createSpy('beforeCreateRow');

      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeCreateRow: onBeforeCreateRow,
      });
      alter('insert_row', 2, 1, 'customSource');

      expect(onBeforeCreateRow).toHaveBeenCalledWith(2, 1, 'customSource');
    });

    it('should not create row if removing has been canceled by beforeCreateRow hook handler', () => {
      const beforeCreateRow = jasmine.createSpy('beforeCreateRow');

      beforeCreateRow.and.callFake(() => false);

      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeCreateRow
      });

      expect(countRows()).toEqual(3);

      alter('insert_row');

      expect(countRows()).toEqual(3);
    });

    it('should not create/shift cell meta objects if creating has been canceled by beforeCreateRow hook handler', () => {
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

    it('should insert row at the end if index is not given', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('insert_row');

      expect(countRows()).toEqual(6);
      expect(getHtCore().find('tr:eq(4) td:eq(0)').html()).toEqual('e1');

      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('');
    });

    it('should not change cellMeta after executing `insert row` without parameters (#3581, #3989, #2114)', () => {
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

      alter('insert_row');

      expect(getCellMeta(1, 0).renderer).not.toBe(greenRenderer);
      expect(getCellMeta(1, 0).readOnly).toBe(false);

      expect(getCellMeta(4, 0).renderer).not.toBe(greenRenderer);
      expect(getCellMeta(4, 0).readOnly).toBe(false);
    });

    it('should add new row which respect defined type of cells after executing `insert_row`', () => {
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

      alter('insert_row');

      // added row

      expect(getCellMeta(4, 0).type).toEqual('numeric');
      expect(getDataAtCell(4, 0)).toEqual(null);

      expect(getCellMeta(4, 2).type).toEqual('checkbox');
      expect(getDataAtCell(4, 2)).toEqual(null);
    });

    it('should insert the amount of rows at given index', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('insert_row', 1, 3);

      expect(countRows()).toEqual(8);

      expect(spec().$container.find('tr:eq(1) td:eq(0)').html()).toEqual('');

      expect(spec().$container.find('tr:eq(4) td:eq(0)').html()).toEqual('b1');
    });

    it('should insert the amount of rows at the end if index is not given', () => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      alter('insert_row', null, 3);

      expect(countRows()).toEqual(8);
      expect(getHtCore().find('tr:eq(4) td:eq(0)').html()).toEqual('e1');

      expect(getHtCore().find('tr:eq(5) td:eq(0)').html()).toEqual('');
      expect(getHtCore().find('tr:eq(6) td:eq(0)').html()).toEqual('');
      expect(getHtCore().find('tr:eq(7) td:eq(0)').html()).toEqual('');
    });

    it('should insert not more rows than maxRows', () => {
      handsontable({
        startRows: 5,
        maxRows: 7
      });
      alter('insert_row', 1);
      alter('insert_row', 1);
      alter('insert_row', 1);

      expect(countRows()).toEqual(7);
    });

    it('when amount parameter is used, should not insert more rows than allowed by maxRows', () => {
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

      expect(countRows()).toEqual(10);
      expect(spec().$container.find('tr:eq(6) td:eq(0)').html()).toEqual('b1');
    });

    it('should fire callback on create row', () => {
      let outputBefore;
      let outputAfter;

      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeCreateRow(index, amount, source) {
          outputBefore = [index, amount, source];
        },
        afterCreateRow(index, amount, source) {
          outputAfter = [index, amount, source];
        },
      });
      alter('insert_row', 3, 1, 'customSource');

      expect(outputBefore).toEqual([3, 1, 'customSource']);
      expect(outputAfter).toEqual([3, 1, 'customSource']);
    });

    it('should keep the single-cell selection in the same position as before inserting the row', () => {
      handsontable({
        minRows: 5,
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });

      selectCell(2, 2);
      alter('insert_row', 2);

      const selected = getSelected();

      expect(selected[0][0]).toBe(3);
      expect(selected[0][2]).toBe(3);
      expect(selected.length).toBe(1);
      expect(`
      |   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   |
      |   :   : # :   :   :   :   :   |
      |   :   :   :   :   :   :   :   |
      |   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should shift the cell meta according to the new row layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(2, 1, 'className', 'test');
      alter('insert_row', 1, 1);

      expect(getCellMeta(3, 1).className).toEqual('test');
    });

    it('should shift the cell meta according to the new rows (>1) layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(2, 1, 'className', 'test');
      alter('insert_row', 0, 3);

      expect(getCellMeta(5, 1).className).toEqual('test');
    });

    it('should insert row at proper position when there were some row sequence changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5)
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
  });

  describe('insert column', () => {
    it('should insert column at given index', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', 1);

      expect(countCols()).toEqual(9);
      expect(spec().$container.find('tr:eq(1) td:eq(2)').html()).toEqual('b');
    });

    it('should insert column at the end if index is not given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col');

      expect(countCols()).toEqual(9);
      expect(spec().$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');
    });

    it('should insert the amount of columns at given index', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', 1, 3);

      expect(countCols()).toEqual(11);
      expect(spec().$container.find('tr:eq(1) td:eq(4)').html()).toEqual('b');
    });

    it('should insert the amount of columns at the end if index is not given', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ]
      });
      alter('insert_col', null, 3);

      expect(countCols()).toEqual(11);
      expect(spec().$container.find('tr:eq(1) td:eq(7)').html()).toEqual('h');

      expect(spec().$container.find('tr:eq(1) td:eq(8)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(9)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(10)').html()).toEqual('');
    });

    it('should insert not more cols than maxCols', () => {
      handsontable({
        startCols: 5,
        maxCols: 7
      });
      alter('insert_col', 1);
      alter('insert_col', 1);
      alter('insert_col', 1);

      expect(countCols()).toEqual(7);
    });

    it('should not insert more columns than allowed by maxCols, when amount parameter is used', () => {
      handsontable({
        data: [
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        ],
        maxCols: 10
      });
      alter('insert_col', 1, 10);

      expect(countCols()).toEqual(10);
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(2)').html()).toEqual('');
      expect(spec().$container.find('tr:eq(1) td:eq(3)').html()).toEqual('b');
    });

    it('should fire callback on create col', () => {
      let outputBefore;
      let outputAfter;

      handsontable({
        minRows: 5,
        data: arrayOfArrays(),
        beforeCreateCol(index, amount, source) {
          outputBefore = [index, amount, source];
        },
        afterCreateCol(index, amount, source) {
          outputAfter = [index, amount, source];
        },
      });
      alter('insert_col', 2, 1, 'customSource');

      expect(outputBefore).toEqual([2, 1, 'customSource']);
      expect(outputAfter).toEqual([2, 1, 'customSource']);
    });

    it('should not create columns when beforeCreateCol returns false', () => {
      handsontable({
        data: arrayOfArrays(),
        beforeCreateCol() {
          return false;
        },
      });

      const countedColumns = countCols();

      alter('insert_col', 2, 1, 'customSource');

      expect(countCols()).toBe(countedColumns);
    });

    it('should not create/shift cell meta objects if creating has been canceled by beforeCreateCol hook handler', () => {
      handsontable({
        beforeCreateCol: () => false,
      });

      setCellMeta(2, 0, '_test', 'foo');

      alter('insert_col', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(1, 0)._test).toBeUndefined();
      expect(getCellMeta(2, 0)._test).toBe('foo');
      expect(getCellMeta(3, 0)._test).toBeUndefined();
      expect(getCellMeta(4, 0)._test).toBeUndefined();
    });

    it('should not create column header together with the column, if headers were NOT specified explicitly', () => {
      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: true
      });

      expect(getColHeader()).toEqual(['A', 'B', 'C']);

      expect(countCols()).toEqual(3);

      alter('insert_col', 1);

      expect(countCols()).toEqual(4);

      expect(getColHeader()).toEqual(['A', 'B', 'C', 'D']);

    });

    it('should create column header together with the column, if headers were specified explicitly', () => {
      handsontable({
        startCols: 3,
        startRows: 2,
        colHeaders: ['Header0', 'Header1', 'Header2']
      });

      expect(getColHeader()).toEqual(['Header0', 'Header1', 'Header2']);

      expect(countCols()).toEqual(3);

      alter('insert_col', 1);

      expect(countCols()).toEqual(4);

      expect(getColHeader()).toEqual(['Header0', 'B', 'Header1', 'Header2']);
    });

    it('should stretch the table after adding another column (if stretching is set to \'all\')', () => {
      spec().$container.css({
        width: 500,
      });

      const hot = handsontable({
        startCols: 5,
        startRows: 10,
        stretchH: 'all'
      });

      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
      alter('insert_col', null, 1);
      expect(Handsontable.dom.outerWidth(hot.view.TBODY)).toEqual(500);
    });

    it('should shift the cell meta according to the new column layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('insert_col', 1, 1);

      expect(getCellMeta(1, 3).className).toEqual('test');
    });

    it('should shift the cell meta according to the new columns (>1) layout', () => {
      handsontable({
        startCols: 4,
        startRows: 3
      });

      setCellMeta(1, 2, 'className', 'test');
      alter('insert_col', 0, 3);

      expect(getCellMeta(1, 5).className).toEqual('test');
    });

    it('should insert column at proper position when there were some column sequence changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5)
      });

      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);

      alter('insert_col', 1, 1);

      expect(getDataAtRow(0)).toEqual(['E1', null, 'D1', 'C1', 'B1', 'A1']);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', 'E1']);

      alter('insert_col', 0, 1);

      expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1']);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1']);

      alter('insert_col', 7, 1);

      expect(getDataAtRow(0)).toEqual([null, 'E1', null, 'D1', 'C1', 'B1', 'A1', null]);
      expect(getSourceDataAtRow(0)).toEqual(['A1', 'B1', 'C1', null, 'D1', null, 'E1', null]);
    });
  });
});
