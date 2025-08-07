describe('manualColumnMove', () => {
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

  it.forTheme('classic')('should retain the cell border on the first rendered column ' +
    'with `autoRowSize` enabled (dev-2512)', () => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      rowHeaders: true,
      autoRowSize: true,
      manualColumnMove: [5, 6, 7, 8, 9],
      width: 300,
      height: 300,
    });

    const firstCell = getCell(0, 0, true);
    const firstCellBorderLeftWidth = getComputedStyle(firstCell).borderLeftWidth;

    expect(firstCellBorderLeftWidth).toBe('1px');
  });

  describe('init', () => {
    it('should change column order at init when columns properly is not defined', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should change column order at init when columns properly is defined #4470', async() => {
      handsontable({
        data: [
          [1, 2, 3],
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        ],
        columns: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
        manualColumnMove: [0, 9, 8, 7, 6, 5, 4, 3, 2, 1],
      });

      expect(getData()).toEqual([
        [1, null, null, null, null, null, null, null, 3, 2],
        [1, 10, 9, 8, 7, 6, 5, 4, 3, 2]
      ]);
    });
  });

  describe('updateSettings', () => {
    it('should be enabled after specifying it in updateSettings config', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        colHeaders: true
      });

      await updateSettings({
        manualColumnMove: true
      });

      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseup');

      expect(spec().$container.children().first().children().hasClass('after-selection--columns')).toBeGreaterThan(0);
    });

    it('should change the default column order with updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      await updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should change column order with updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      await updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
    });

    it('should not change column order with updateSettings when `undefined` is passed', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      await updateSettings({
        manualColumnMove: undefined
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should not change column order with updateSettings when `true` is passed', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      await updateSettings({
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });
  });

  describe('loadData', () => {
    it('should reset column order if new dataset is loaded', async() => {
      handsontable({
        data: createSpreadsheetData(1, 5),
        manualColumnMove: true
      });

      getPlugin('manualColumnMove').moveColumn(4, 2);
      await render();

      await loadData(createSpreadsheetData(1, 5));

      const tdElements = spec().$container.find('tbody tr:eq(0) td');

      expect(tdElements.eq(0).text()).toEqual('A1');
      expect(tdElements.eq(1).text()).toEqual('B1');
      expect(tdElements.eq(2).text()).toEqual('C1');
      expect(tdElements.eq(3).text()).toEqual('D1');
      expect(tdElements.eq(4).text()).toEqual('E1');
    });
  });

  describe('moving', () => {
    it('should keep cell meta created using cells function', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        manualColumnMove: true,
        cells(row, col) {
          if (row === 1 && col === 0) {
            this.readOnly = true;
          }
        }
      });

      const htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);

      getPlugin('manualColumnMove').moveColumn(0, 2);
      await render();

      expect(htCore.find('tbody tr:eq(1) td:eq(2)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    it('should keep cell meta created using cell array', async() => {
      handsontable({
        data: createSpreadsheetData(3, 10),
        colHeaders: true,
        manualColumnMove: true,
        cell: [
          { row: 1, col: 0, readOnly: true }
        ]
      });

      const htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);

      getPlugin('manualColumnMove').moveColumn(3, 0);
      await render();

      expect(htCore.find('tbody tr:eq(1) td:eq(1)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    describe('by API', () => {
      describe('the `moveColumn` method', () => {
        it('should move single column from the right to the left', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumn(2, 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
        });

        it('should move single column from the left to the right', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumn(0, 2);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
        });

        it('should revert change by two moves', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumn(1, 0);
          await render();

          getPlugin('manualColumnMove').moveColumn(1, 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
        });

        it('should not move and not trigger the `afterColumnMove` hook after try of moving column, when `beforeColumnMove` return false', async() => {
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            beforeColumnMove() {
              return false;
            },
            afterColumnMove: afterMoveColumnCallback
          });

          const result = getPlugin('manualColumnMove').moveColumn(0, 1);

          expect(afterMoveColumnCallback).not.toHaveBeenCalled();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of moving column to final index, which is too high', async() => {
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove: afterMoveColumnCallback
          });

          const result = getPlugin('manualColumnMove').moveColumn(0, 1000);

          expect(afterMoveColumnCallback).toHaveBeenCalledWith([0], 1000, undefined, false, false);
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of moving column to final index, which is too low', async() => {
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove: afterMoveColumnCallback
          });

          const result = getPlugin('manualColumnMove').moveColumn(0, -1);

          expect(afterMoveColumnCallback).toHaveBeenCalledWith([0], -1, undefined, false, false);
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of moving too high column', async() => {
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove: afterMoveColumnCallback
          });

          const result = getPlugin('manualColumnMove').moveColumn(1000, 1);

          expect(afterMoveColumnCallback).toHaveBeenCalledWith([1000], 1, undefined, false, false);
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of moving too low column', async() => {
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove: afterMoveColumnCallback
          });

          const result = getPlugin('manualColumnMove').moveColumn(-1, 1);

          expect(afterMoveColumnCallback).toHaveBeenCalledWith([-1], 1, undefined, false, false);
          expect(result).toBeFalsy();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
          expect(result).toBeFalsy();
        });

        it('should work when also when `data` has less items than `columns` property #5931', async() => {
          const aPlusB = record => record.A + record.B;
          const aMinusB = record => record.A - record.B;
          const aMultiplyB = record => record.A * record.B;
          const aDivideB = record => record.A / record.B;

          handsontable({
            columns: [
              { data: 'ID', type: 'text' },
              { data: 'A', type: 'numeric' },
              { data: 'B', type: 'numeric' },
              { data: aPlusB, type: 'numeric' },
              { data: aMinusB, type: 'numeric' },
              { data: aMultiplyB, type: 'numeric' },
              { data: aDivideB, type: 'numeric' }
            ],
            data: [
              { ID: 20, A: 1000, B: 200 },
              { ID: 19, A: 1000, B: 200 },
              { ID: 18, A: 1000, B: 200 },
              { ID: 17, A: 1000, B: 200 },
              { ID: 16, A: 1000, B: 200 }
            ],
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumn(6, 0);
          await render();

          expect(getData()).toEqual([
            [5, 20, 1000, 200, 1200, 800, 200000],
            [5, 19, 1000, 200, 1200, 800, 200000],
            [5, 18, 1000, 200, 1200, 800, 200000],
            [5, 17, 1000, 200, 1200, 800, 200000],
            [5, 16, 1000, 200, 1200, 800, 200000],
          ]);
        });
      });

      describe('the `moveColumns` method', () => {
        it('should move multiple columns from the right to the left #1', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumns([7, 9, 8], 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('H1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
        });

        it('should move multiple columns from the right to the left #2', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumns([9, 7, 8], 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('J1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('H1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
        });

        it('should move multiple columns with mixed indexes #1', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumns([0, 1, 4], 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('E1');
        });

        it('should move multiple columns with mixed indexes #2', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').moveColumns([1, 4, 0, 5], 3);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('G1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('E1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(5)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(6)').text()).toEqual('F1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(7)').text()).toEqual('H1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(8)').text()).toEqual('I1');
        });
      });

      describe('the `dragColumn` method', () => {
        it('should not change order when dragging single column from the position of first column to the left side of second column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumn(0, 1);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
        });

        it('should not change order when dragging single column from the position of first column to the left side of first column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumn(0, 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
        });

        it('should change order properly when dragging single column from the position of first column to the left side of fourth column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumn(0, 3);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('D1');
        });

        it('should change order properly when dragging single column from the position of fourth column to the left side of first column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumn(3, 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('E1');
        });
      });

      describe('the `dragColumns` method', () => {
        it('should not change order when dragging multiple columns to the specific position', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumns([0, 1, 2, 3], 2);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('E1');
        });

        it('should change order properly when dragging multiple columns from the left to the right', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumns([0, 1, 2], 4);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('E1');
        });

        it('should change order properly when dragging multiple columns from the right to the left', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          getPlugin('manualColumnMove').dragColumns([4, 3, 2], 0);
          await render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('E1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('A1');
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of dragging columns to index, which is too high', async() => {
          let movePossible;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = getPlugin('manualColumnMove').dragColumns([1, 2, 3], 15);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of dragging columns to index, which is too low', async() => {
          let movePossible;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = getPlugin('manualColumnMove').dragColumns([1, 2, 3], -1);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of dragging too low columns to index, which is too high', async() => {
          let movePossible;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = getPlugin('manualColumnMove').dragColumns([-1, -2, -3, -4], 15);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
        });

        it('should not move and trigger the `afterColumnMove` hook with proper arguments after try of dragging too low columns to index, which is too low', async() => {
          let movePossible;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            afterColumnMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = getPlugin('manualColumnMove').dragColumns([-2, -3, -4, -5], -1);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
        });
      });
    });

    describe('by drag', () => {
      describe('should trigger the `beforeColumnMove` and `afterColumnMove` hooks with proper ' +
               'parameters (moving single column)', () => {
        it('visual indexes as parameters', async() => {
          const beforeColumnMoveCallback = jasmine.createSpy('beforeColumnMoveCallback');
          const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true,
            beforeColumnMove: beforeColumnMoveCallback,
            afterColumnMove: afterMoveColumnCallback
          });

          columnIndexMapper().setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
          const result = getPlugin('manualColumnMove').moveColumns([8, 9, 7], 0);

          expect(beforeColumnMoveCallback).toHaveBeenCalledWith([8, 9, 7], 0, undefined, true);
          expect(afterMoveColumnCallback).toHaveBeenCalledWith([8, 9, 7], 0, undefined, true, true);
          expect(result).toBeTruthy();
        });

        describe('moving single column from the right to the left', () => {
          it('drag first column before the left side of the first header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $firstHeader.simulate('mouseover');
            $firstHeader.simulate('mousemove', {
              clientX: $firstHeader.offset().left - $firstHeader.width() - 200
            });

            $firstHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });

          it('drag first column to the left side of the first header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $firstHeader.simulate('mouseover');
            $firstHeader.simulate('mousemove');
            $firstHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });

          it('drag second column before the left side of the first header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(2)');

            $secondHeader.simulate('mousedown');
            $secondHeader.simulate('mouseup');
            $secondHeader.simulate('mousedown');

            $firstHeader.simulate('mouseover');

            $firstHeader.simulate('mousemove', {
              clientX: $firstHeader.offset().left - $firstHeader.width() - 50
            });
            $firstHeader.simulate('mouseup');

            expect(finalIndex1).toBe(0);
            expect(dropIndex1).toBe(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toBe(0);
            expect(dropIndex2).toBe(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag second column to the left side of the first header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });
            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(2)');

            $secondHeader.simulate('mousedown');
            $secondHeader.simulate('mouseup');
            $secondHeader.simulate('mousedown');

            $firstHeader.simulate('mouseover');
            $firstHeader.simulate('mousemove', {
              clientX: $firstHeader.offset().left - $firstHeader.width()
            });
            $firstHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag second column to the right side of first header (left side of second column)', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(2)');

            $secondHeader.simulate('mousedown');
            $secondHeader.simulate('mouseup');
            $secondHeader.simulate('mousedown');

            $secondHeader.simulate('mouseover');
            $secondHeader.simulate('mousemove');
            $secondHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(1);
            expect(dropIndex1).toEqual(1);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(1);
            expect(dropIndex2).toEqual(1);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });
        });

        describe('moving single column from the left to the right', () => {
          it('drag first column to the middle of the table', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $middleHeader = spec().$container.find('thead tr:eq(0) th:eq(3)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $middleHeader.simulate('mouseover');
            $middleHeader.simulate('mousemove');
            $middleHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(1);
            expect(dropIndex1).toEqual(2);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(1);
            expect(dropIndex2).toEqual(2);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag first column to the left side of last header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(10)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $lastHeader.simulate('mouseover');
            $lastHeader.simulate('mousemove');
            $lastHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(8);
            expect(dropIndex1).toEqual(9);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(8);
            expect(dropIndex2).toEqual(9);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag first column to the right side of last header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(10)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $lastHeader.simulate('mouseover');
            $lastHeader.simulate('mousemove', {
              clientX: $lastHeader.offset().left + $lastHeader.width()
            });
            $lastHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(9);
            expect(dropIndex1).toEqual(10);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(9);
            expect(dropIndex2).toEqual(10);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag first column behind the right side of last header', async() => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualColumnMove: true,
              beforeColumnMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterColumnMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
            const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(10)');

            $firstHeader.simulate('mousedown');
            $firstHeader.simulate('mouseup');
            $firstHeader.simulate('mousedown');

            $lastHeader.simulate('mouseover');
            $lastHeader.simulate('mousemove', {
              clientX: $lastHeader.offset().left + $lastHeader.width() + 200
            });
            $lastHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(9);
            expect(dropIndex1).toEqual(10);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(9);
            expect(dropIndex2).toEqual(10);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });
        });

        it('moving multiple columns from the left to the right', async() => {
          let finalIndex1;
          let dropIndex1;
          let movePossible1;
          let finalIndex2;
          let dropIndex2;
          let movePossible2;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            beforeColumnMove(...args) {
              [, finalIndex1, dropIndex1, movePossible1] = args;
            },
            afterColumnMove(...args) {
              [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
            }
          });

          await selectColumns(0, 2);

          const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');
          const $middleHeader = spec().$container.find('thead tr:eq(0) th:eq(6)');

          $firstHeader.simulate('mousedown');
          $firstHeader.simulate('mouseup');
          $firstHeader.simulate('mousedown');

          $middleHeader.simulate('mouseover');
          $middleHeader.simulate('mousemove');
          $middleHeader.simulate('mouseup');

          expect(finalIndex1).toEqual(2);
          expect(dropIndex1).toEqual(5);
          expect(movePossible1).toBeTruthy();

          expect(finalIndex2).toEqual(2);
          expect(dropIndex2).toEqual(5);
          expect(movePossible2).toBeTruthy();
          expect(orderChanged).toBeTruthy();
        });

        it('moving multiple columns from the right to the left', async() => {
          let finalIndex1;
          let dropIndex1;
          let movePossible1;
          let finalIndex2;
          let dropIndex2;
          let movePossible2;
          let orderChanged;

          handsontable({
            data: createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualColumnMove: true,
            beforeColumnMove(...args) {
              [, finalIndex1, dropIndex1, movePossible1] = args;
            },
            afterColumnMove(...args) {
              [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
            }
          });

          await selectColumns(0, 2);

          const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(2)');
          const $middleHeader = spec().$container.find('thead tr:eq(0) th:eq(6)');

          $middleHeader.simulate('mousedown');
          $middleHeader.simulate('mouseup');
          $middleHeader.simulate('mousedown');

          $secondHeader.simulate('mouseover');
          $secondHeader.simulate('mousemove');
          $secondHeader.simulate('mouseup');

          expect(finalIndex1).toEqual(1);
          expect(dropIndex1).toEqual(1);
          expect(movePossible1).toBeTruthy();

          expect(finalIndex2).toEqual(1);
          expect(dropIndex2).toEqual(1);
          expect(movePossible2).toBeTruthy();
          expect(orderChanged).toBeTruthy();
        });
      });

      describe('should position the cells properly', () => {
        it('drag the second column before the left side of first header', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $columnHeaders = spec().$container.find('thead tr th');

          $columnHeaders.eq(1).simulate('mousedown');
          $columnHeaders.eq(1).simulate('mouseup');
          $columnHeaders.eq(1).simulate('mousedown');
          $columnHeaders.eq(0).simulate('mouseover');
          $columnHeaders.eq(0).simulate('mousemove');
          $columnHeaders.eq(0).simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
        });

        it('drag the second column before the fourth column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $columnHeaders = spec().$container.find('thead tr th');

          $columnHeaders.eq(1).simulate('mousedown');
          $columnHeaders.eq(1).simulate('mouseup');
          $columnHeaders.eq(1).simulate('mousedown');
          $columnHeaders.eq(3).simulate('mouseover');
          $columnHeaders.eq(3).simulate('mousemove');
          $columnHeaders.eq(3).simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
        });

        it('drag the fist column below the last column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
          const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(9)');

          $firstHeader.simulate('mousedown');
          $firstHeader.simulate('mouseup');
          $firstHeader.simulate('mousedown');

          $lastHeader.simulate('mouseover');
          $lastHeader.simulate('mousemove', {
            clientX: $lastHeader.offset().left + $lastHeader.width()
          });
          $lastHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('A1');
        });

        it('drag the last column before the first column', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
          const $lastHeader = spec().$container.find('thead tr:eq(0) th:eq(9)');

          $lastHeader.simulate('mousedown');
          $lastHeader.simulate('mouseup');
          $lastHeader.simulate('mousedown');

          $firstHeader.simulate('mouseover');
          $firstHeader.simulate('mousemove', {
            clientX: $firstHeader.offset().right - $firstHeader.width()
          });
          $firstHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('J1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(9)').text()).toEqual('I1');
        });

        it('drag multiple columns from the left to the right', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $firstHeader = spec().$container.find('thead tr:eq(0) th:eq(0)');
          const $fourthHeader = spec().$container.find('thead tr:eq(0) th:eq(4)');

          await selectColumns(0, 2);

          $firstHeader.simulate('mousedown');
          $firstHeader.simulate('mouseup');
          $firstHeader.simulate('mousedown');

          $fourthHeader.simulate('mouseover');
          $fourthHeader.simulate('mousemove');
          $fourthHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('C1');
        });

        it('drag multiple columns from the right to the left', async() => {
          handsontable({
            data: createSpreadsheetData(3, 10),
            colHeaders: true,
            manualColumnMove: true
          });

          const $fourthHeader = spec().$container.find('thead tr:eq(0) th:eq(3)');
          const $secondHeader = spec().$container.find('thead tr:eq(0) th:eq(1)');

          await selectColumns(3, 5);

          $fourthHeader.simulate('mousedown');
          $fourthHeader.simulate('mouseup');
          $fourthHeader.simulate('mousedown');

          $secondHeader.simulate('mouseover');
          $secondHeader.simulate('mousemove');
          $secondHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('D1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('E1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(3)').text()).toEqual('F1');
          expect(spec().$container.find('tbody tr:eq(0) td:eq(4)').text()).toEqual('B1');
        });
      });

      it('should properly scrolling viewport if mouse is over part-visible cell', async() => {
        handsontable({
          data: createSpreadsheetData(20, 20),
          rowHeaders: true,
          colHeaders: true,
          manualColumnMove: true,
          width: 600,
          height: 600,
          rowHeights: 47
        });

        await selectCell(19, 0);
        await sleep(50);

        expect(tableView()._wt.wtTable.getFirstVisibleRow()).toBeGreaterThan(8);

        const $rowsHeaders = spec().$container.find('.ht_clone_inline_start tr th');

        $rowsHeaders.eq(10).simulate('mousedown');
        $rowsHeaders.eq(10).simulate('mouseup');
        $rowsHeaders.eq(10).simulate('mousedown');
        $rowsHeaders.eq(8).simulate('mouseover');
        $rowsHeaders.eq(8).simulate('mousemove');
        $rowsHeaders.eq(8).simulate('mouseup');

        await sleep(100);

        expect(tableView()._wt.wtTable.getFirstVisibleRow()).toBeLessThan(8);
      });
    });
  });

  describe('undoRedo', () => {
    describe('should back changes', () => {
      it('when moving single row from the left to the right', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumn(1, 4);
        await render();

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns from the left to the right', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([0, 1], 4);
        await render();

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns from the right to the left', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([4, 5], 1);
        await render();

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns with mixed indexes', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([0, 1, 8, 4, 7], 2);
        await render();

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving using few actions', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumn(0, 9);
        getPlugin('manualColumnMove').moveColumn(0, 9);
        await render();

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'A1']);

        getPlugin('undoRedo').undo();

        expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });
    });

    describe('should revert changes', () => {
      it('when moving single row from the left to the right', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumn(1, 4);

        await render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['A1', 'C1', 'D1', 'E1', 'B1', 'F1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns from the left to the right', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([0, 1], 4);

        await render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['C1', 'D1', 'E1', 'F1', 'A1', 'B1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns from the right to the left', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([4, 5], 1);

        await render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['A1', 'E1', 'F1', 'B1', 'C1', 'D1', 'G1', 'H1', 'I1', 'J1']);
      });

      it('when moving multiple columns with mixed indexes', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumns([0, 1, 8, 4, 7], 2);

        await render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['C1', 'D1', 'A1', 'B1', 'I1', 'E1', 'H1', 'F1', 'G1', 'J1']);
      });

      it('when moving using few actions', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          colHeaders: true,
          manualColumnMove: true,
        });

        getPlugin('manualColumnMove').moveColumn(0, 9);
        getPlugin('manualColumnMove').moveColumn(0, 9);

        await render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'A1']);

        getPlugin('undoRedo').redo();

        expect(getDataAtRow(0)).toEqual(['C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'A1', 'B1']);
      });
    });
  });
});
