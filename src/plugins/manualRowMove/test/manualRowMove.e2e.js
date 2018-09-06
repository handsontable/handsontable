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

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should reset row order with updateSettings when undefined is passed', () => {
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

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
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

  describe('loadData', () => {
    it('should increase numbers of rows if it is necessary', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        manualRowMove: true
      });

      hot.loadData(Handsontable.helper.createSpreadsheetData(10, 10));

      expect(countRows()).toEqual(10);
      expect(hot.getPlugin('manualRowMove').rowsMapper.__arrayMap.length).toEqual(10);
    });
    it('should decrease numbers of rows if it is necessary', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        manualRowMove: true
      });

      hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

      expect(countRows()).toEqual(2);
      expect(hot.getPlugin('manualRowMove').rowsMapper.__arrayMap.length).toEqual(2);
    });
  });

  describe('moving', () => {
    it('should move row by API', () => {
      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRow(2, 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    });

    it('should move many rows by API', () => {
      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRows([7, 9, 8], 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('8');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
    });

    it('should trigger the `beforeRowMove` hook before row move with visual indexes as parameters', () => {
      const beforeMoveRowCallback = jasmine.createSpy('beforeMoveRowCallback');

      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: beforeMoveRowCallback,
        modifyRow(row) {
          return row + 10;
        }
      });

      hot.getPlugin('manualRowMove').moveRows([8, 9, 7], 0);
      hot.render();

      expect(beforeMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should trigger the `afterRowMove` hook after row move with visual indexes as parameters', () => {
      const afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      const hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback,
        modifyRow(row) {
          return row + 10;
        }
      });

      hot.getPlugin('manualRowMove').moveRows([8, 9, 7], 0);
      hot.render();

      expect(afterMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row above first header)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        colHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
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

      expect(targetParameterInsideCallback).toEqual(0);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the top of first header)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        colHeaders: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
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

      expect(targetParameterInsideCallback).toEqual(0);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the middle of the table)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(2);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the top of last header)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('tbody tr:eq(29) th:eq(0)').simulate('mouseover');
      spec().$container.find('tbody tr:eq(29) th:eq(0)').simulate('mousemove');
      spec().$container.find('tbody tr:eq(29) th:eq(0)').simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(29);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row to the bottom of last header)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });
      const $lastHeader = spec().$container.find('tbody tr:eq(29) th:eq(0)');

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      $lastHeader.simulate('mouseover');
      $lastHeader.simulate('mousemove', {
        clientY: $lastHeader.offset().top + $lastHeader.height()
      });
      $lastHeader.simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(30);
    });

    it('should run `beforeRowMove` with proper `target` parameter (moving row below last header)', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });
      const $lastHeader = spec().$container.find('tbody tr:eq(29) th:eq(0)');

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      $lastHeader.simulate('mouseover');
      $lastHeader.simulate('mousemove', {
        clientY: $lastHeader.offset().top + $lastHeader.height() + 200
      });
      $lastHeader.simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(30);
    });

    it('should run `beforeRowMove` with proper visual `target` parameter', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: [1, 2, 0],
        beforeRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(2);
    });

    it('should run `afterRowMove` with proper visual `target` parameter', () => {
      let targetParameterInsideCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(30, 30),
        rowHeaders: true,
        manualRowMove: [1, 2, 0],
        afterRowMove: (rows, target) => {
          targetParameterInsideCallback = target;
        }
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

      expect(targetParameterInsideCallback).toEqual(2);
    });

    it('should move the second row to the first row', () => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

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

    it('should move the second row to the third row', () => {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(spec().$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(spec().$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

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

    it('should not move row if it\'s not needed', () => {
      const cache = [];

      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        afterRowMove(rows) {
          cache.push(rows);
        }
      });

      const $rowsHeaders = spec().$container.find('.ht_clone_left tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(3).simulate('mouseup');

      expect(cache.length).toEqual(0);
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
        expect(hot.view.wt.wtTable.getFirstVisibleRow()).toBeLessThan(8);
        done();
      }, 150);
    });

    it('moving row should keep cell meta created using cells function', () => {
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

      expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    it('moving row should keep cell meta created using cell array', () => {
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
  });

  describe('callbacks', () => {
    it('should run `beforeRowMove` and `afterRowMove` with proper visual `target` parameter', () => {
      let targetParameterInsideBeforeRowMoveCallback;
      let targetParameterInsideAfterRowMoveCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows, target) => {
          targetParameterInsideBeforeRowMoveCallback = target;
        },
        afterRowMove: (rows, target) => {
          targetParameterInsideAfterRowMoveCallback = target;
        }
      });

      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseover');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mousemove');
      spec().$container.find('tbody tr:eq(2) th:eq(0)').simulate('mouseup');

      expect(targetParameterInsideBeforeRowMoveCallback).toEqual(2);
      expect(targetParameterInsideAfterRowMoveCallback).toEqual(2);
    });

    it('should run `beforeRowMove` and `afterRowMove` with proper visual `rows` parameter', () => {
      let rowsParameterInsideBeforeRowMoveCallback;
      let rowsParameterInsideAfterRowMoveCallback;

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: (rows) => {
          rowsParameterInsideBeforeRowMoveCallback = rows;
        },
        afterRowMove: (rows) => {
          rowsParameterInsideAfterRowMoveCallback = rows;
        }
      });

      hot.getPlugin('manualRowMove').moveRow(2, 0);

      expect(rowsParameterInsideBeforeRowMoveCallback).toEqual([2]);
      expect(rowsParameterInsideAfterRowMoveCallback).toEqual([2]);
      expect(rowsParameterInsideBeforeRowMoveCallback).toEqual(rowsParameterInsideAfterRowMoveCallback);

      hot.getPlugin('manualRowMove').moveRow(2, 0);

      expect(rowsParameterInsideBeforeRowMoveCallback).toEqual([2]);
      expect(rowsParameterInsideAfterRowMoveCallback).toEqual([2]);
      expect(rowsParameterInsideBeforeRowMoveCallback).toEqual(rowsParameterInsideAfterRowMoveCallback);
    });
  });

  describe('undoRedo', () => {
    it('should back changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        manualRowMove: true,
      });
      hot.getPlugin('manualRowMove').moveRow(1, 4);
      hot.render();

      expect(hot.getDataAtCell(3, 0)).toBe('A2');

      hot.undo();

      expect(hot.getDataAtCell(1, 0)).toBe('A2');
    });

    it('should revert changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        rowHeaders: true,
        manualRowMove: true,
      });
      hot.getPlugin('manualRowMove').moveRow(1, 4);
      hot.render();

      expect(hot.getDataAtCell(3, 0)).toBe('A2');

      hot.undo();

      expect(hot.getDataAtCell(1, 0)).toBe('A2');

      hot.redo();

      expect(hot.getDataAtCell(3, 0)).toBe('A2');
    });
  });
});
