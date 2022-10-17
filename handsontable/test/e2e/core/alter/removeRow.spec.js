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

  describe('`remove_row` action', () => {
    describe('for multiple items at once', () => {
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
});
