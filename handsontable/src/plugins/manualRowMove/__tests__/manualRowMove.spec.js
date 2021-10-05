describe('manualRowMove', () => {
  const id = 'testContainer';
  const arrayOfObjects = [
    { id: 1, name: 'Ted', lastName: 'Right' },
    { id: 2, name: 'Frank', lastName: 'Honest' },
    { id: 3, name: 'Joan', lastName: 'Well' },
    { id: 4, name: 'Sid', lastName: 'Strong' },
    { id: 5, name: 'Jane', lastName: 'Neat' },
    { id: 6, name: 'Chuck', lastName: 'Jackson' },
    { id: 7, name: 'Meg', lastName: 'Jansen' },
    { id: 8, name: 'Rob', lastName: 'Norris' },
    { id: 9, name: 'Sean', lastName: 'O\'Hara' },
    { id: 10, name: 'Eve', lastName: 'Branson' }
  ];

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('init', () => {
    it('should change row order at init', () => {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });
  });

  describe('updateSettings', () => {
    it('should be enabled after specifying it in updateSettings config', () => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true
      });

      updateSettings({
        manualRowMove: true
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');

      expect(spec().$container.hasClass('after-selection--rows')).toBeGreaterThan(0);
    });

    it('should change the default row order with updateSettings', () => {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      updateSettings({
        manualRowMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should change row order with updateSettings', () => {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    });

    it('should not change row order with updateSettings when `undefined` is passed', () => {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: void 0
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should not change row order with updateSettings when `true` is passed', () => {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });
  });

  describe('moving', () => {
    it('should keep cell meta created using cells function', () => {
      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        cells(row, col) {
          if (row === 1 && col === 0) {
            this.readOnly = true;
          }
        }
      });

      const htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);

      hot.getPlugin('manualRowMove').moveRow(1, 3);
      hot.render();

      expect(htCore.find('tbody tr:eq(3) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    it('should keep cell meta created using cell array', () => {
      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        cell: [
          { row: 1, col: 0, readOnly: true }
        ]
      });

      const htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);

      hot.getPlugin('manualRowMove').moveRow(3, 1);
      hot.render();

      expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    describe('by API', () => {
      describe('the `moveRow` method', () => {
        it('should move single row from the bottom to the top', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRow(2, 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
        });

        it('should move single row from the top to the bottom', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRow(0, 2);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
        });

        it('should revert change by two moves', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRow(1, 0);
          hot.render();

          hot.getPlugin('manualRowMove').moveRow(1, 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
        });

        it('should not move and not trigger the `afterRowMove` hook after try of moving row, when `beforeRowMove` return false', () => {
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            beforeRowMove() {
              return false;
            },
            afterRowMove: afterMoveRowCallback
          });

          const result = hot.getPlugin('manualRowMove').moveRow(0, 1);

          expect(afterMoveRowCallback).not.toHaveBeenCalled();
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving row to final index, which is too high', () => {
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove: afterMoveRowCallback
          });

          const result = hot.getPlugin('manualRowMove').moveRow(0, 1000);

          expect(afterMoveRowCallback).toHaveBeenCalledWith([0], 1000, void 0, false, false);
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving row to final index, which is too low', () => {
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove: afterMoveRowCallback
          });

          const result = hot.getPlugin('manualRowMove').moveRow(0, -1);

          expect(afterMoveRowCallback).toHaveBeenCalledWith([0], -1, void 0, false, false);
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving too high row', () => {
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove: afterMoveRowCallback
          });

          const result = hot.getPlugin('manualRowMove').moveRow(1000, 1);

          expect(afterMoveRowCallback).toHaveBeenCalledWith([1000], 1, void 0, false, false);
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
          expect(result).toBeFalsy();
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of moving too low row', () => {
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove: afterMoveRowCallback
          });

          const result = hot.getPlugin('manualRowMove').moveRow(-1, 1);

          expect(afterMoveRowCallback).toHaveBeenCalledWith([-1], 1, void 0, false, false);
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
          expect(result).toBeFalsy();
        });
      });

      describe('the `moveRows` method', () => {
        it('should move multiple rows from the bottom to the top #1', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRows([7, 9, 8], 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('8');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
        });

        it('should move multiple rows from the bottom to the top #2', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRows([9, 7, 8], 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('10');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('8');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
        });

        it('should move multiple rows with mixed indexes #1', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRows([0, 1, 4], 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('5');
        });

        it('should move multiple rows with mixed indexes #2', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').moveRows([1, 4, 0, 5], 3);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('7');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
          expect(spec().$container.find('tbody tr:eq(5) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(6) td:eq(0)').text()).toEqual('6');
          expect(spec().$container.find('tbody tr:eq(7) td:eq(0)').text()).toEqual('8');
          expect(spec().$container.find('tbody tr:eq(8) td:eq(0)').text()).toEqual('9');
        });
      });

      describe('the `dragRow` method', () => {
        it('should not change order when dragging single row from the position of first row to the top of second row', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRow(0, 1);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
        });

        it('should not change order when dragging single row from the position of first row to the top of first row', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRow(0, 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
        });

        it('should change order properly when dragging single row from the position of first row to the top of fourth row', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRow(0, 3);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('4');
        });

        it('should change order properly when dragging single row from the position of fourth row to the top of first row', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRow(3, 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
        });
      });

      describe('the `dragRows` method', () => {
        it('should not change order when dragging multiple rows to the specific position', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRows([0, 1, 2, 3], 2);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
        });

        it('should change order properly when dragging multiple rows from the top to the bottom', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRows([0, 1, 2], 4);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('5');
        });

        it('should change order properly when dragging multiple rows from the bottom to the top', () => {
          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          hot.getPlugin('manualRowMove').dragRows([4, 3, 2], 0);
          hot.render();

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('5');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('1');
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging rows to index, which is too high', () => {
          let movePossible;
          let orderChanged;

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = hot.getPlugin('manualRowMove').dragRows([1, 2, 3], 15);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging rows to index, which is too low', () => {
          let movePossible;
          let orderChanged;

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = hot.getPlugin('manualRowMove').dragRows([1, 2, 3], -1);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging too low rows to index, which is too high', () => {
          let movePossible;
          let orderChanged;

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = hot.getPlugin('manualRowMove').dragRows([-1, -2, -3, -4], 15);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
        });

        it('should not move and trigger the `afterRowMove` hook with proper arguments after try of dragging too low rows to index, which is too low', () => {
          let movePossible;
          let orderChanged;

          const hot = handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            afterRowMove(...args) {
              [, , , movePossible, orderChanged] = args;
            }
          });

          const result = hot.getPlugin('manualRowMove').dragRows([-2, -3, -4, -5], -1);

          expect(movePossible).toBeFalsy();
          expect(orderChanged).toBeFalsy();
          expect(result).toBeFalsy();
          expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
        });
      });
    });

    describe('by drag', () => {
      describe('should trigger the `beforeRowMove` and `afterRowMove` hooks with proper ' +
               'parameters (moving single row)', () => {
        it('visual indexes as parameters', () => {
          const beforeRowMoveCallback = jasmine.createSpy('beforeRowMoveCallback');
          const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

          const hot = handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true,
            beforeRowMove: beforeRowMoveCallback,
            afterRowMove: afterMoveRowCallback
          });

          hot.rowIndexMapper.setIndexesSequence([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
          const result = hot.getPlugin('manualRowMove').moveRows([8, 9, 7], 0);

          expect(beforeRowMoveCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, true);
          expect(afterMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, true, true);
          expect(result).toBeTruthy();
        });

        describe('moving single row from the bottom to the top', () => {
          it('drag first row above the top of first header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $fistHeader = spec().$container.find('tbody tr:eq(0) th:eq(0)');

            $fistHeader.simulate('mousedown');
            $fistHeader.simulate('mouseup');
            $fistHeader.simulate('mousedown');

            $fistHeader.simulate('mouseover');
            $fistHeader.simulate('mousemove', {
              clientY: $fistHeader.offset().bottom - $fistHeader.height() - 200
            });
            $fistHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });

          it('drag first row to the top of first header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseover');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousemove');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });

          it('drag second row above the top of first header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            const $fistHeader = spec().$container.find('tbody tr:eq(0) th:eq(0)');

            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

            $fistHeader.simulate('mouseover');
            $fistHeader.simulate('mousemove', {
              clientY: $fistHeader.offset().bottom - $fistHeader.height() - 50
            });
            $fistHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag second row to the top of first header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });
            const $fistHeader = spec().$container.find('tbody tr:eq(0) th:eq(0)');

            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

            $fistHeader.simulate('mouseover');
            $fistHeader.simulate('mousemove', {
              clientY: $fistHeader.offset().bottom - $fistHeader.height()
            });
            $fistHeader.simulate('mouseup');

            expect(finalIndex1).toEqual(0);
            expect(dropIndex1).toEqual(0);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(0);
            expect(dropIndex2).toEqual(0);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag second row to the bottom of first header (top of second row)', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousedown');

            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousemove');
            spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');

            expect(finalIndex1).toEqual(1);
            expect(dropIndex1).toEqual(1);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(1);
            expect(dropIndex2).toEqual(1);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeFalsy();
          });
        });

        describe('moving single row from the top to the bottom', () => {
          it('drag first row to the middle of the table', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

            spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
            spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
            spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

            expect(finalIndex1).toEqual(1);
            expect(dropIndex1).toEqual(2);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(1);
            expect(dropIndex2).toEqual(2);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag first row to the top of last header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

            spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mouseover');
            spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mousemove');
            spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mouseup');

            expect(finalIndex1).toEqual(8);
            expect(dropIndex1).toEqual(9);
            expect(movePossible1).toBeTruthy();

            expect(finalIndex2).toEqual(8);
            expect(dropIndex2).toEqual(9);
            expect(movePossible2).toBeTruthy();
            expect(orderChanged).toBeTruthy();
          });

          it('drag first row to the bottom of last header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });
            const $lastHeader = spec().$container.find('tbody tr:eq(9) th:eq(0)');

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

            $lastHeader.simulate('mouseover');
            $lastHeader.simulate('mousemove', {
              clientY: $lastHeader.offset().top + $lastHeader.height()
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

          it('drag first row below the bottom of last header', () => {
            let finalIndex1;
            let dropIndex1;
            let movePossible1;
            let finalIndex2;
            let dropIndex2;
            let movePossible2;
            let orderChanged;

            handsontable({
              data: Handsontable.helper.createSpreadsheetData(10, 10),
              rowHeaders: true,
              colHeaders: true,
              manualRowMove: true,
              beforeRowMove(...args) {
                [, finalIndex1, dropIndex1, movePossible1] = args;
              },
              afterRowMove(...args) {
                [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
              }
            });
            const $lastHeader = spec().$container.find('tbody tr:eq(9) th:eq(0)');

            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
            spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

            $lastHeader.simulate('mouseover');
            $lastHeader.simulate('mousemove', {
              clientY: $lastHeader.offset().top + $lastHeader.height() + 200
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

        it('moving multiple rows from the top to the bottom', () => {
          let finalIndex1;
          let dropIndex1;
          let movePossible1;
          let finalIndex2;
          let dropIndex2;
          let movePossible2;
          let orderChanged;

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            beforeRowMove(...args) {
              [, finalIndex1, dropIndex1, movePossible1] = args;
            },
            afterRowMove(...args) {
              [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
            }
          });

          selectRows(0, 2);

          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mouseover');
          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mousemove');
          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mouseup');

          expect(finalIndex1).toEqual(2);
          expect(dropIndex1).toEqual(5);
          expect(movePossible1).toBeTruthy();

          expect(finalIndex2).toEqual(2);
          expect(dropIndex2).toEqual(5);
          expect(movePossible2).toBeTruthy();
          expect(orderChanged).toBeTruthy();
        });

        it('moving multiple rows from the bottom to the top', () => {
          let finalIndex1;
          let dropIndex1;
          let movePossible1;
          let finalIndex2;
          let dropIndex2;
          let movePossible2;
          let orderChanged;

          handsontable({
            data: Handsontable.helper.createSpreadsheetData(10, 10),
            rowHeaders: true,
            colHeaders: true,
            manualRowMove: true,
            beforeRowMove(...args) {
              [, finalIndex1, dropIndex1, movePossible1] = args;
            },
            afterRowMove(...args) {
              [, finalIndex2, dropIndex2, movePossible2, orderChanged] = args;
            }
          });

          selectRows(0, 2);

          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(5) th:eq(0)').simulate('mousedown');

          spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseover');
          spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mousemove');
          spec().$container.find('tbody tr:eq(1) th:eq(0)').simulate('mouseup');

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
        it('drag the second row above the top of first header', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowsHeaders = spec().$container.find('.ht_clone_left tr th');

          $rowsHeaders.eq(1).simulate('mousedown');
          $rowsHeaders.eq(1).simulate('mouseup');
          $rowsHeaders.eq(1).simulate('mousedown');
          $rowsHeaders.eq(0).simulate('mouseover');
          $rowsHeaders.eq(0).simulate('mousemove');
          $rowsHeaders.eq(0).simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
        });

        it('drag the second row before the fourth row', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $rowsHeaders = spec().$container.find('.ht_clone_left tr th');

          $rowsHeaders.eq(1).simulate('mousedown');
          $rowsHeaders.eq(1).simulate('mouseup');
          $rowsHeaders.eq(1).simulate('mousedown');
          $rowsHeaders.eq(3).simulate('mouseover');
          $rowsHeaders.eq(3).simulate('mousemove');
          $rowsHeaders.eq(3).simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
        });

        it('drag the fist row below the last row', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $lastHeader = spec().$container.find('tbody tr:eq(9) th:eq(0)');

          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

          $lastHeader.simulate('mouseover');
          $lastHeader.simulate('mousemove', {
            clientY: $lastHeader.offset().top + $lastHeader.height()
          });
          $lastHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(9) td:eq(0)').text()).toEqual('1');
        });

        it('drag the last row above the first row', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $fistHeader = spec().$container.find('tbody tr:eq(0) th:eq(0)');

          spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(9) th:eq(0)').simulate('mousedown');

          $fistHeader.simulate('mouseover');
          $fistHeader.simulate('mousemove', {
            clientY: $fistHeader.offset().bottom - $fistHeader.height()
          });
          $fistHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('10');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(9) td:eq(0)').text()).toEqual('9');
        });

        it('drag multiple rows from the top to the bottom', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $fourthHeader = spec().$container.find('tbody tr:eq(4) th:eq(0)');

          selectRows(0, 2);

          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

          $fourthHeader.simulate('mouseover');
          $fourthHeader.simulate('mousemove');
          $fourthHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('3');
        });

        it('drag multiple rows from the bottom to the top', () => {
          handsontable({
            data: arrayOfObjects,
            rowHeaders: true,
            manualRowMove: true
          });

          const $secondHeader = spec().$container.find('tbody tr:eq(1) th:eq(0)');

          selectRows(3, 5);

          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mouseup');
          spec().$container.find('tbody tr:eq(3) th:eq(0)').simulate('mousedown');

          $secondHeader.simulate('mouseover');
          $secondHeader.simulate('mousemove');
          $secondHeader.simulate('mouseup');

          expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
          expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('4');
          expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('5');
          expect(spec().$container.find('tbody tr:eq(3) td:eq(0)').text()).toEqual('6');
          expect(spec().$container.find('tbody tr:eq(4) td:eq(0)').text()).toEqual('2');
        });
      });

      it('should properly scrolling viewport if mouse is over part-visible cell', (done) => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(20, 20),
          colHeaders: true,
          rowHeaders: true,
          manualRowMove: true,
          width: 600,
          height: 600,
          rowHeights: 47
        });

        hot.selectCell(19, 0);

        setTimeout(() => {
          expect(hot.view.wt.wtTable.getFirstVisibleRow()).toBeGreaterThan(8);

          const $rowsHeaders = spec().$container.find('.ht_clone_left tr th');

          $rowsHeaders.eq(10).simulate('mousedown');
          $rowsHeaders.eq(10).simulate('mouseup');
          $rowsHeaders.eq(10).simulate('mousedown');
          $rowsHeaders.eq(8).simulate('mouseover');
          $rowsHeaders.eq(8).simulate('mousemove');
          $rowsHeaders.eq(8).simulate('mouseup');
        }, 50);

        setTimeout(() => {
          expect(hot.view.wt.wtTable.getFirstVisibleRow())
            .toBeLessThan(8);
          done();
        }, 150);
      });
    });
  });

  describe('undoRedo', () => {
    describe('should back changes', () => {
      it('when moving single row from the top to the bottom', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRow(1, 4);
        hot.render();

        hot.undo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows from the top to the bottom', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 4);
        hot.render();

        hot.undo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows from the bottom to the top', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([4, 5], 1);
        hot.render();

        hot.undo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows with mixed indexes', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1, 8, 4, 7], 2);
        hot.render();

        hot.undo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });
    });

    describe('should revert changes', () => {
      it('when moving single row from the top to the bottom', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRow(1, 4);
        hot.render();

        hot.undo();
        hot.redo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A3', 'A4', 'A5', 'A2', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows from the top to the bottom', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1], 4);
        hot.render();

        hot.undo();
        hot.redo();

        expect(hot.getDataAtCol(0)).toEqual(['A3', 'A4', 'A5', 'A6', 'A1', 'A2', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows from the bottom to the top', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([4, 5], 1);
        hot.render();

        hot.undo();
        hot.redo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A5', 'A6', 'A2', 'A3', 'A4', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving multiple rows with mixed indexes', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRows([0, 1, 8, 4, 7], 2);
        hot.render();

        hot.undo();
        hot.redo();

        expect(hot.getDataAtCol(0)).toEqual(['A3', 'A4', 'A1', 'A2', 'A9', 'A5', 'A8', 'A6', 'A7', 'A10']);
      });
    });
  });

  describe('integration', () => {
    it('should properly render saved order if columnSorting and persistentState are enabled', async() => {
      const config = {
        data: Handsontable.helper.createSpreadsheetData(5, 1),
        persistentState: true,
        manualRowMove: true,
        columnSorting: true,
      };
      const container = spec().$container[0];
      let hot = new Handsontable(container, config);

      const plugin = hot.getPlugin('manualRowMove');

      plugin.moveRow(0, 4);
      plugin.persistentStateSave();

      hot.destroy();

      hot = new Handsontable(container, config);

      expect(hot.getData()).toEqual([
        ['A2'],
        ['A3'],
        ['A4'],
        ['A5'],
        ['A1'],
      ]);

      // cleanup
      hot.destroy();
      window.localStorage.clear();
    });

    it('should load new dataset on loadData if minSpareRows is set', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(1, 1),
        manualRowMove: true,
        minSpareRows: 1,
      });

      loadData(Handsontable.helper.createSpreadsheetData(4, 4));

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
        ['A4', 'B4', 'C4', 'D4'],
        [null, null, null, null],
      ]);
    });
  });
});
