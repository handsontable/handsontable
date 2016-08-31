describe('manualRowMove', function () {
  var id = 'testContainer';
  var arrayOfObjects = [
    {id: 1, name: "Ted", lastName: "Right"},
    {id: 2, name: "Frank", lastName: "Honest"},
    {id: 3, name: "Joan", lastName: "Well"},
    {id: 4, name: "Sid", lastName: "Strong"},
    {id: 5, name: "Jane", lastName: "Neat"},
    {id: 6, name: "Chuck", lastName: "Jackson"},
    {id: 7, name: "Meg", lastName: "Jansen"},
    {id: 8, name: "Rob", lastName: "Norris"},
    {id: 9, name: "Sean", lastName: "O'Hara"},
    {id: 10, name: "Eve", lastName: "Branson"}
  ];

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
    it('should change row order at init', function () {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });
  });

  describe('updateSettings', function() {
    it("should be enabled after specifying it in updateSettings config", function () {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true
      });

      updateSettings({
        manualRowMove: true
      });

      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mousedown');
      this.$container.find('tbody tr:eq(0) th:eq(0)').simulate('mouseup');

      expect(this.$container.hasClass('after-selection--rows')).toBeGreaterThan(0);
    });

    it('should change the default row order with updateSettings', function () {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      updateSettings({
        manualRowMove: [2, 1, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should change row order with updateSettings', function () {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: [2, 1, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });

    it('should reset row order with updateSettings when undefined is passed', function () {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: void 0
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    });

    xit('should not change row order with updateSettings when `true` is passed', function () {
      handsontable({
        data: arrayOfObjects,
        manualRowMove: [1, 2, 0]
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');

      updateSettings({
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('1');
    });
  });

  describe('moving', function() {
    it('should move row by API', function () {
      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRow(2, 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    });

    it('should move many rows by API', function () {
      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRows([7, 9, 8], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('8');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('9');
    });

    it('should trigger an beforeRowMove event before row move', function () {
      var beforeMoveRowCallback = jasmine.createSpy('beforeMoveRowCallback');

      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        beforeRowMove: beforeMoveRowCallback
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRows([8,9,7], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('9');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('8');

      expect(beforeMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it('should trigger an afterRowMove event after row move', function () {
      var afterMoveRowCallback = jasmine.createSpy('afterMoveRowCallback');

      this.$container.height(150);

      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        afterRowMove: afterMoveRowCallback
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      hot.getPlugin('manualRowMove').moveRows([8, 9, 7], 0);
      hot.render();

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('9');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('10');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('8');

      expect(afterMoveRowCallback).toHaveBeenCalledWith([8, 9, 7], 0, void 0, void 0, void 0, void 0);
    });

    it("should move the second row to the first row", function () {
      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      var $rowsHeaders = this.$container.find('.ht_clone_left tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');
      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(0).simulate('mouseover');
      $rowsHeaders.eq(0).simulate('mousemove');
      $rowsHeaders.eq(0).simulate('mouseup');

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');
    });

    it("should move the second row to the third row", function () {
      handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true
      });

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('2');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('3');

      var $rowsHeaders = this.$container.find('.ht_clone_left tr th');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(1).simulate('mouseup');

      var $guideline = this.$container.find('.ht__manualRowMove--guideline');

      $rowsHeaders.eq(1).simulate('mousedown');
      $rowsHeaders.eq(3).simulate('mouseover');
      $rowsHeaders.eq(3).simulate('mousemove');
      $rowsHeaders.eq(3).simulate('mouseup');

      expect(this.$container.find('tbody tr:eq(0) td:eq(0)').text()).toEqual('1');
      expect(this.$container.find('tbody tr:eq(1) td:eq(0)').text()).toEqual('3');
      expect(this.$container.find('tbody tr:eq(2) td:eq(0)').text()).toEqual('2');
    });

    it("moving row should keep cell meta created using cells function", function () {
      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        cells: function (row, col) {
          if (row == 1 && col == 0) {
            this.readOnly = true;
          }
        }
      });

      var htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

      hot.getPlugin('manualRowMove').moveRow(1, 3);
      hot.render();

      expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
    });

    it("moving row should keep cell meta created using cell array", function () {
      var hot = handsontable({
        data: arrayOfObjects,
        rowHeaders: true,
        manualRowMove: true,
        cell: [
          {row: 1, col: 0, readOnly: true}
        ]
      });

      var htCore = getHtCore();

      expect(htCore.find('tbody tr:eq(1) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);

      hot.getPlugin('manualRowMove').moveRow(3, 1);
      hot.render();

      expect(htCore.find('tbody tr:eq(2) td:eq(0)')[0].className.indexOf("htDimmed")).toBeGreaterThan(-1);
    });
  });
  describe('undoRedo', function() {
    it('should back changes', function () {
      var hot = handsontable({
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

    it('should revert changes', function () {
      var hot = handsontable({
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
  })
});
