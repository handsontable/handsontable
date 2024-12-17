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
        manualRowMove: undefined
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

          expect(beforeRowMoveCallback).toHaveBeenCalledWith([8, 9, 7], 0, undefined, true);
          expect(afterMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, undefined, true, true);
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

          const $rowsHeaders = spec().$container.find('.ht_clone_inline_start tr th');

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

          const $rowsHeaders = spec().$container.find('.ht_clone_inline_start tr th');

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

      it('should properly scrolling viewport if mouse is over part-visible cell', async() => {
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

        await sleep(50);

        expect(hot.view.getFirstFullyVisibleRow()).toBe(9);

        $(getCell(9, -1))
          .simulate('mousedown')
          .simulate('mouseup')
          .simulate('mousedown');
        $(getCell(7, -1))
          .simulate('mouseover')
          .simulate('mousemove')
          .simulate('mouseup');

        expect(hot.view.getFirstFullyVisibleRow()).toBe(7);
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

        getPlugin('undoRedo').undo();

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

        getPlugin('undoRedo').undo();

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

        getPlugin('undoRedo').undo();

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

        getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']);
      });

      it('when moving using few actions', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRow(0, 9);
        hot.getPlugin('manualRowMove').moveRow(0, 9);
        hot.render();

        getPlugin('undoRedo').undo();

        expect(hot.getDataAtCol(0)).toEqual(['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A1']);

        getPlugin('undoRedo').undo();

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

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

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

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

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

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

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

        getPlugin('undoRedo').undo();
        hot.getPlugin('undoRedo').redo();

        expect(hot.getDataAtCol(0)).toEqual(['A3', 'A4', 'A1', 'A2', 'A9', 'A5', 'A8', 'A6', 'A7', 'A10']);
      });

      it('when moving using few actions', () => {
        const hot = handsontable({
          data: Handsontable.helper.createSpreadsheetData(10, 10),
          rowHeaders: true,
          manualRowMove: true,
        });

        hot.getPlugin('manualRowMove').moveRow(0, 9);
        hot.getPlugin('manualRowMove').moveRow(0, 9);
        hot.render();

        getPlugin('undoRedo').undo();
        getPlugin('undoRedo').undo();

        hot.getPlugin('undoRedo').redo();

        expect(hot.getDataAtCol(0)).toEqual(['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A1']);

        hot.getPlugin('undoRedo').redo();

        expect(hot.getDataAtCol(0)).toEqual(['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A1', 'A2']);
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
