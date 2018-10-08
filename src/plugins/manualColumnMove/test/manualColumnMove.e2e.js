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

  describe('init', () => {
    it('should change column order at init', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });
  });

  describe('persistentState', () => {
    it('should load data from cache after initialization of new Handsontable instance', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true,
        persistentState: true
      });

      const dataAt0x2Cell = getDataAtCell(0, 2);
      const manualColumnMovePlugin = hot.getPlugin('manualColumnMove');

      manualColumnMovePlugin.moveColumn(2, 0);
      manualColumnMovePlugin.persistentStateSave();

      hot.destroy();
      spec().$container.remove();
      spec().$container = $(`<div id="${id}"></div>`).appendTo('body');

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true,
        persistentState: true
      });

      expect(getDataAtCell(0, 0)).toEqual(dataAt0x2Cell);
    });

    it('should work with updateSettings properly', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true,
        persistentState: true
      });

      const dataAt0x2Cell = getDataAtCell(0, 2);
      const manualColumnMovePlugin = hot.getPlugin('manualColumnMove');

      manualColumnMovePlugin.moveColumn(2, 0);
      manualColumnMovePlugin.persistentStateSave();

      updateSettings({});
      expect(getDataAtCell(0, 0)).toEqual(dataAt0x2Cell);
    });
  });

  describe('updateSettings', () => {
    it('should be enabled after specifying it in updateSettings config', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true
      });

      updateSettings({
        manualColumnMove: true
      });

      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseup');

      expect(spec().$container.hasClass('after-selection--columns')).toBeGreaterThan(0);
    });

    it('should change the default column order with updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should change column order with updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should update columnsMapper when updateSettings change numbers of columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      updateSettings({
        columns: [
          { data: 2 },
          { data: 0 },
          { data: 1 },
        ]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should reset column order with updateSettings when undefined is passed', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      updateSettings({
        manualColumnMove: void 0
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
    });
  });

  describe('loadData', () => {
    it('should increase numbers of columns if it is necessary', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        manualColumnMove: true
      });

      hot.loadData(Handsontable.helper.createSpreadsheetData(10, 10));

      expect(countRows()).toEqual(10);
      expect(hot.getPlugin('manualColumnMove').columnsMapper.__arrayMap.length).toEqual(10);
    });

    it('should decrease numbers of columns if it is necessary', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        manualColumnMove: true
      });

      hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

      expect(countRows()).toEqual(2);
      expect(hot.getPlugin('manualColumnMove').columnsMapper.__arrayMap.length).toEqual(2);
    });
  });

  describe('moving', () => {
    it('should move column by API', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
    });

    it('should move many columns by API', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([7, 9, 8], 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('H1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
    });

    it('should trigger an beforeColumnMove event before column move', () => {
      const beforeMoveColumnCallback = jasmine.createSpy('beforeMoveColumnCallback');

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        beforeColumnMove: beforeMoveColumnCallback
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([8, 9, 7], 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('H1');

      expect(beforeMoveColumnCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should trigger an afterColumnMove event after column move', () => {
      const afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

      spec().$container.height(150);

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        afterColumnMove: afterMoveColumnCallback
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([8, 9, 7], 0);
      hot.render();

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('I1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('H1');

      expect(afterMoveColumnCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should move the second column to the first column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      const $rowsHeaders = spec().$container.find('.ht_clone_top tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(0).simulate('mouseover');
      $rowsHeaders.eq(0).simulate('mousemove');
      $rowsHeaders.eq(0).simulate('mouseup');

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
    });

    it('should move the second row to the third row', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      const $rowsHeaders = spec().$container.find('.ht_clone_top tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(3).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mousemove');
      $rowsHeaders.eq(3).simulate('mouseup');

      expect(spec().$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(spec().$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
    });

    it('should properly scrolling viewport if mouse is over part-visible cell', (done) => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 20),
        colHeaders: true,
        rowHeaders: true,
        manualColumnMove: true,
        width: 600,
        height: 600,
        colWidths: 47
      });

      hot.selectCell(0, 19);

      setTimeout(() => {
        expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBeGreaterThan(8);

        const $rowsHeaders = spec().$container.find('.ht_clone_top tr th');

        $rowsHeaders.eq(2).simulate('mousedown');
        $rowsHeaders.eq(2).simulate('mouseup');
        $rowsHeaders.eq(2).simulate('mousedown');
        $rowsHeaders.eq(1).simulate('mouseover');
        $rowsHeaders.eq(1).simulate('mousemove');
        $rowsHeaders.eq(1).simulate('mouseup');
      }, 50);

      setTimeout(() => {
        expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBeLessThan(9);
        done();
      }, 150);
    });

    it('moving column should keep cell meta created using cells function', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
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

      hot.getPlugin('manualColumnMove').moveColumn(0, 3);
      hot.render();

      expect(htCore.find('tbody tr:eq(1) td:eq(2)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });

    it('moving column should keep cell meta created using cell array', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        cell: [
          { row: 1, col: 0, readOnly: true }
        ]
      });

      const htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);

      hot.getPlugin('manualColumnMove').moveColumn(3, 0);
      hot.render();

      expect(htCore.find('tbody tr:eq(1) td:eq(1)')[0].className.indexOf('htDimmed')).toBeGreaterThan(-1);
    });
  });

  describe('callbacks', () => {

    it('should run `beforeColumnMove` and `afterColumnMove` with proper visual `target` parameter', () => {
      let targetParameterInsideBeforeColumnMoveCallback;
      let targetParameterInsideAfterColumnMoveCallback;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(3, 3),
        colHeaders: true,
        manualColumnMove: true,
        beforeColumnMove: (columns, target) => {
          targetParameterInsideBeforeColumnMoveCallback = target;
        },
        afterColumnMove: (columns, target) => {
          targetParameterInsideAfterColumnMoveCallback = target;
        }
      });

      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseup');
      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mousedown');
      spec().$container.find('thead tr:eq(0) th:eq(0)').simulate('mousedown');

      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseover');
      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mousemove');
      spec().$container.find('thead tr:eq(0) th:eq(2)').simulate('mouseup');

      expect(targetParameterInsideBeforeColumnMoveCallback).toEqual(2);
      expect(targetParameterInsideAfterColumnMoveCallback).toEqual(2);
    });

    it('should run `beforeColumnMove` and `afterColumnMove` with proper visual `columns` parameter', () => {
      let columnsParameterInsideBeforeColumnMoveCallback;
      let columnsParameterInsideAfterColumnMoveCallback;

      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        beforeColumnMove: (columns) => {
          columnsParameterInsideBeforeColumnMoveCallback = columns;
        },
        afterColumnMove: (columns) => {
          columnsParameterInsideAfterColumnMoveCallback = columns;
        }
      });

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      expect(columnsParameterInsideBeforeColumnMoveCallback).toEqual([2]);
      expect(columnsParameterInsideAfterColumnMoveCallback).toEqual([2]);
      expect(columnsParameterInsideBeforeColumnMoveCallback).toEqual(columnsParameterInsideAfterColumnMoveCallback);

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      expect(columnsParameterInsideBeforeColumnMoveCallback).toEqual([2]);
      expect(columnsParameterInsideAfterColumnMoveCallback).toEqual([2]);
      expect(columnsParameterInsideBeforeColumnMoveCallback).toEqual(columnsParameterInsideAfterColumnMoveCallback);
    });
  });

  describe('copy-paste', () => {
    it('should create new columns is are needed', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnMove: true,
      });
      const changesSet = [
        [3, 4, 'A1'],
        [3, 5, 'B1'],
        [3, 6, 'C1'],
        [3, 7, 'D1'],
      ];

      // unfortunately couse of security rules, we can't simulate native mechanism (e.g. CTRL+C -> CTRL+V)
      hot.setDataAtCell(changesSet, void 0, void 0, 'CopyPaste.paste');

      expect(hot.countCols()).toEqual(8);
    });
  });

  describe('undoRedo', () => {
    xit('should back changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
      });
      hot.getPlugin('manualColumnMove').moveColumn(1, 4);
      hot.render();

      expect(hot.getDataAtCell(1, 3)).toBe('B2');

      hot.undo();

      expect(hot.getDataAtCell(1, 3)).toBe('D2');
    });

    xit('should revert changes', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
      });
      hot.getPlugin('manualColumnMove').moveColumn(1, 4);
      hot.render();

      expect(hot.getDataAtCell(1, 3)).toBe('A2');

      hot.undo();

      expect(hot.getDataAtCell(1, 1)).toBe('A2');

      hot.redo();

      expect(hot.getDataAtCell(1, 3)).toBe('A2');
    });
  });
});
