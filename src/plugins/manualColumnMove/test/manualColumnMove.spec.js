describe('manualColumnMove', function () {
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

  describe('init', function () {
    it('should change column order at init', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });
  });

  describe('updateSettings', function() {
    it("should be enabled after specifying it in updateSettings config", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true
      });

      updateSettings({
        manualColumnMove: true
      });

      this.$container.find('thead tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('thead tr:eq(0) th:eq(0)').simulate('mouseup');

      expect(this.$container.hasClass('after-selection--columns')).toBeGreaterThan(0);
    });

    it('should change the default column order with updateSettings', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should change column order with updateSettings', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      updateSettings({
        manualColumnMove: [2, 1, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should update columnsMapper when updateSettings change numbers of columns', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);

      updateSettings({
        columns: [
          {data: 2},
          {data: 0},
          {data: 1},
        ]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');
    });

    it('should reset column order with updateSettings when undefined is passed', function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('A1');

      updateSettings({
        manualColumnMove: void 0
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
    });
  });

  describe('moving', function() {
    it('should move column by API', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumn(2, 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
    });

    it('should move many columns by API', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([7, 9, 8], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('H1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('I1');
    });

    it('should trigger an beforeColumnMove event before column move', function () {
      var beforeMoveColumnCallback = jasmine.createSpy('beforeMoveColumnCallback');

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        beforeColumnMove: beforeMoveColumnCallback
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([8,9,7], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('I1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('H1');

      expect(beforeMoveColumnCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should trigger an afterColumnMove event after column move', function () {
      var afterMoveColumnCallback = jasmine.createSpy('afterMoveColumnCallback');

      this.$container.height(150);

      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        afterColumnMove: afterMoveColumnCallback
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      hot.getPlugin('manualColumnMove').moveColumns([8, 9, 7], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('I1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('J1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('H1');

      expect(afterMoveColumnCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it("should move the second column to the first column", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      var $rowsHeaders = this.$container.find('.ht_clone_top tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(0).simulate('mouseover');
      $rowsHeaders.eq(0).simulate('mousemove');
      $rowsHeaders.eq(0).simulate('mouseup');

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');
    });

    it("should move the second row to the third row", function () {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('B1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('C1');

      var $rowsHeaders = this.$container.find('.ht_clone_top tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(3).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mousemove');
      $rowsHeaders.eq(3).simulate('mouseup');

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('A1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(1)').text()).toEqual('C1');
      expect(this.$container.find('tbody tr:eq(0) td:eq(2)').text()).toEqual('B1');
    });

    it('should properly scrolling viewport if mouse is over part-visible cell', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 20),
        colHeaders: true,
        rowHeaders: true,
        manualColumnMove: true,
        width: 600,
        height: 600,
        colWidths: 47
      });

      hot.selectCell(0, 19);

      setTimeout(function () {
        expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBeGreaterThan(8);

        var $rowsHeaders = spec().$container.find('.ht_clone_top tr th');

        $rowsHeaders.eq(2).simulate('mousedown');
        $rowsHeaders.eq(2).simulate('mouseup');
        $rowsHeaders.eq(2).simulate('mousedown');
        $rowsHeaders.eq(1).simulate('mouseover');
        $rowsHeaders.eq(1).simulate('mousemove');
        $rowsHeaders.eq(1).simulate('mouseup');
      }, 50);

      setTimeout(function () {
        expect(hot.view.wt.wtTable.getFirstVisibleColumn()).toBeLessThan(9);
        done();
      }, 150);
    });

    it("moving column should keep cell meta created using cells function", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        cells: function (row, col) {
          if (row == 1 && col == 0) {
            this.readOnly = true;
          }
        }
      });

      var htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

      hot.getPlugin('manualColumnMove').moveColumn(0, 3);
      hot.render();

      expect(htCore.find('tbody tr:eq(1) td:eq(2)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
    });

    it("moving column should keep cell meta created using cell array", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        colHeaders: true,
        manualColumnMove: true,
        cell: [
          {row: 1, col: 0, readOnly: true}
        ]
      });

      var htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

      hot.getPlugin('manualColumnMove').moveColumn(3, 0);
      hot.render();

      expect(htCore.find('tbody tr:eq(1) td:eq(1)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
    });
  });

  describe('copy-paste', function() {
    it('should create new columns is are needed', function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        colHeaders: true,
        manualColumnMove: true,
      });
      var changesSet = [
        [3, 4, 'A1'],
        [3, 5, 'B1'],
        [3, 6, 'C1'],
        [3, 7, 'D1'],
      ];

      // unfortunately couse of security rules, we can't simulate native mechanism (e.g. CTRL+C -> CTRL+V)
      hot.setDataAtCell(changesSet, void 0, void 0, 'paste');
      expect(hot.countCols()).toEqual(8)
    })
  });

  describe('undoRedo', function() {
    xit('should back changes', function () {
      var hot = handsontable({
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

    xit('should revert changes', function () {
      var hot = handsontable({
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
  })
});
