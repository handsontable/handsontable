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
      it('should remove rows when index groups are passed in ascending order', async() => {
        handsontable({
          data: createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        await alter('remove_row', [[1, 3], [5, 1], [7, 3], [11, 2]]);
        // It remove rows as follow:
        //     1--------3      5-1     7---------3       11-----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A7, A11, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A7', 'A11', 'A14', 'A15']);
        expect(getData().length).toBe(6);
      });

      it('should remove rows when index groups are passed in descending order', async() => {
        handsontable({
          data: createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        await alter('remove_row', [[11, 2], [7, 3], [5, 1], [1, 3]]);
        // It remove rows as follow:
        //     1--------3      5-1     7---------3       11-----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A7, A11, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A7', 'A11', 'A14', 'A15']);
        expect(getData().length).toBe(6);
      });

      it('should remove rows when index groups are passed as intersecting values', async() => {
        handsontable({
          data: createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        await alter('remove_row', [[1, 3], [4, 2], [5, 5], [11, 1]]);
        // It remove rows as follow:
        //     1---------------------------------9       11-1
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A11, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A11', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(5);
      });

      it('should remove rows when index groups are passed as intersecting values (the second scenario)', async() => {
        handsontable({
          data: createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        await alter('remove_row', [[1, 3], [2, 1], [5, 2]]);
        // It remove columns as follow:
        //     1--------3      5----2
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A5, A8, A9, A10, A11, A12, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A5', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(10);
      });

      it('should remove rows when index groups are passed as intersecting values (placed randomly)', async() => {
        handsontable({
          data: createSpreadsheetData(15, 5),
        });
        // [[rowVisualIndex, amountRowsToRemove] ...]
        await alter('remove_row', [[4, 2], [11, 1], [5, 5], [1, 3]]);
        // It remove rows as follow:
        //     1---------------------------------9       11-1
        // A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
        //
        // Result: A1, A11, A13, A14, A15

        expect(getDataAtCol(0)).toEqual(['A1', 'A11', 'A13', 'A14', 'A15']);
        expect(getData().length).toBe(5);
      });

      it('should not display columns when every row have been removed (row header enabled, column header disabled)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: false,
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed (row header disabled, column header enabled)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: false,
          colHeaders: true,
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(5);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(5);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed (both headers disabled)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: false,
          colHeaders: false,
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(0);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should not display columns when every row have been removed (both headers enabled)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(5);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(6); // 5 + corner
        expect($('.ht_master .htCore .cornerHeader').length).toBe(1); // Corner visible.
      });

      it('should not display columns when every row have been removed and just `columns` property is defined', async() => {
        handsontable({
          data: arrayOfNestedObjects(),
          columns: [
            { data: 'id' },
            { data: 'name.first' }
          ]
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(2);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(0);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed and `columns` property is defined with `title` for column header', async() => {
        handsontable({
          data: arrayOfNestedObjects(),
          columns: [
            { data: 'id', title: 'ID' },
            { data: 'name.first', title: 'First name' }
          ]
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(2);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(2);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });

      it('should display columns when every row have been removed and `dataSchema` property is defined and column headers are defined', async() => {
        handsontable({
          data: arrayOfNestedObjects(),
          dataSchema: {
            id: null,
            name: { first: null, last: null }
          },
          colHeaders: true
        });

        await alter('remove_row', 0, 5);

        expect(countCols()).toBe(3);
        expect(getData()).toEqual([]);
        expect($('.ht_master .htCore td').length).toBe(0);
        expect($('.ht_master .htCore tbody th').length).toBe(0);
        expect($('.ht_master .htCore thead th').length).toBe(3);
        expect($('.ht_master .htCore .cornerHeader').length).toBe(0);
      });
    });

    it('should remove row', async() => {
      handsontable({
        minRows: 5,
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ]
      });
      await alter('remove_row', 1);

      expect(getDataAtCell(1, 1)).toEqual('Joan'); // Joan should be moved up
      expect(getData().length).toEqual(5); // new row should be added by keepEmptyRows
    });

    it('should not remove row if amount is zero', async() => {
      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
      });
      const countedRows = countRows();

      await alter('remove_row', 1, 0);

      expect(countRows()).toBe(countedRows);
    });

    it('should fire beforeRemoveRow event before removing row', async() => {
      const onBeforeRemoveRow = jasmine.createSpy('onBeforeRemoveRow');

      handsontable({
        data: arrayOfNestedObjects(),
        columns: [
          { data: 'id' },
          { data: 'name.first' }
        ],
        beforeRemoveRow: onBeforeRemoveRow,
      });
      await alter('remove_row', 2, 1, 'customSource');

      expect(onBeforeRemoveRow).toHaveBeenCalledWith(countRows(), 1, [2], 'customSource');
    });

    it('should not remove row if removing has been canceled by beforeRemoveRow event handler', async() => {
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

      await alter('remove_row');

      expect(countRows()).toEqual(3);
    });

    it('should not remove cell meta objects if removing has been canceled by beforeRemoveRow event handler', async() => {
      handsontable({
        beforeRemoveRow: () => false,
      });

      await setCellMeta(2, 0, '_test', 'foo');

      await alter('remove_row', 1, 1);

      expect(getCellMeta(0, 0)._test).toBeUndefined();
      expect(getCellMeta(1, 0)._test).toBeUndefined();
      expect(getCellMeta(2, 0)._test).toBe('foo');
      expect(getCellMeta(3, 0)._test).toBeUndefined();
      expect(getCellMeta(4, 0)._test).toBeUndefined();
    });

    it('should not remove rows below minRows', async() => {
      handsontable({
        startRows: 5,
        minRows: 4
      });
      await alter('remove_row', 1);
      await alter('remove_row', 1);
      await alter('remove_row', 1);

      expect(countRows()).toEqual(4);
    });

    it('should not remove cols below minCols', async() => {
      handsontable({
        startCols: 5,
        minCols: 4
      });
      await alter('remove_col', 1);
      await alter('remove_col', 1);
      await alter('remove_col', 1);

      expect(countCols()).toEqual(4);
    });

    it('should remove one row if amount parameter is empty', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      await alter('remove_row', 1);

      expect(countRows()).toEqual(4);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('c2');
    });

    it('should remove as many rows as given in the amount parameter', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      await alter('remove_row', 1, 3);

      expect(countRows()).toEqual(2);
      expect(spec().$container.find('tr:eq(0) td:eq(0)').html()).toEqual('a1');
      expect(spec().$container.find('tr:eq(1) td:eq(1)').html()).toEqual('e2');
    });

    it('should not remove more rows that exist', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      await alter('remove_row', 1, 10);

      expect(countRows()).toEqual(1);
      expect(getHtCore().find('tr:last td:last').html()).toEqual('a3');
    });

    it('should remove one row from end if no parameters are given', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      await alter('remove_row');

      expect(countRows()).toEqual(4);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('d1');
    });

    it('should remove amount of rows from end if index parameter is not given', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3'],
          ['c1', 'c2', 'c3'],
          ['d1', 'd2', 'd3'],
          ['e1', 'e2', 'e3']
        ]
      });
      await alter('remove_row', null, 3);

      expect(countRows()).toEqual(2);
      expect(getHtCore().find('tr:last td:eq(0)').html()).toEqual('b1');
    });

    it('should remove rows from table with fixedRows', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3']
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      await alter('remove_row', 1);

      expect(countRows()).toEqual(1);

    });

    it('should remove all rows from table with fixedRows', async() => {
      handsontable({
        data: [
          ['a1', 'a2', 'a3'],
          ['b1', 'b2', 'b3']
        ],
        fixedRowsTop: 1,
        minSpareRows: 0
      });

      await alter('remove_row', 1);
      await alter('remove_row', 1);

      expect(countRows()).toEqual(0);

    });

    it('should remove row\'s cellProperties', async() => {
      handsontable({
        startCols: 1,
        startRows: 3
      });

      getCellMeta(0, 0).someValue = [0, 0];
      getCellMeta(1, 0).someValue = [1, 0];
      getCellMeta(2, 0).someValue = [2, 0];

      await alter('remove_row', 0);

      expect(getCellMeta(0, 0).someValue).toEqual([1, 0]);
      expect(getCellMeta(1, 0).someValue).toEqual([2, 0]);
    });

    it('should fire callback on remove row', async() => {
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
      await alter('remove_row', 1, 2, 'customSource');

      expect(outputBefore).toEqual([1, 2, [1, 2], 'customSource']);
      expect(outputAfter).toEqual([1, 2, [1, 2], 'customSource']);
    });

    it('should decrement the number of fixed rows, if a fix row is removed', async() => {
      handsontable({
        startCols: 1,
        startRows: 3,
        fixedRowsTop: 4
      });

      await alter('remove_row', 1, 1);

      expect(getSettings().fixedRowsTop).toEqual(3);

      await alter('remove_row', 1, 2);

      expect(getSettings().fixedRowsTop).toEqual(1);
    });

    it('should shift the cell meta according to the new row layout', async() => {
      handsontable({
        startCols: 3,
        startRows: 4
      });

      await setCellMeta(2, 1, 'className', 'test');
      await alter('remove_row', 1, 1);

      expect(getCellMeta(1, 1).className).toEqual('test');
    });

    it('should shift the cell meta according to the new rows (>1) layout', async() => {
      handsontable({
        startCols: 3,
        startRows: 4
      });

      await setCellMeta(2, 1, 'className', 'test');
      await alter('remove_row', 0, 2);

      expect(getCellMeta(0, 1).className).toEqual('test');
    });

    it('should cooperate with the `beforeRemoveRow` changing list of the removed rows properly', async() => {
      const afterRemoveRow = jasmine.createSpy('afterRemoveRow');
      let hookArgumentsBefore;
      let hookArgumentsAfter;

      handsontable({
        data: createSpreadsheetData(10, 5),
        beforeRemoveRow(index, amount, physicalRows) {
          hookArgumentsBefore = [index, amount, [...physicalRows]];

          physicalRows.length = 0;
          physicalRows.push(0, 1, 2, 3);

          hookArgumentsAfter = [index, amount, [...physicalRows]];
        },
        afterRemoveRow
      });

      await alter('remove_row', 5, 2);

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
