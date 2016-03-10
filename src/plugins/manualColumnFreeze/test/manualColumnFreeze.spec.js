describe("ManualColumnFreeze plugin:", function () {
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

  describe("addFixedColumn", function () {
    it("should increment fixed column count by 1", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 2
      });

      var plugin = hot.getPlugin('manualColumnFreeze');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      plugin.addFixedColumn();
      expect(hot.getSettings().fixedColumnsLeft).toEqual(3);
      plugin.addFixedColumn();
      expect(hot.getSettings().fixedColumnsLeft).toEqual(4);
    });
  });

  describe("removeFixedColumn", function () {
    it("should decrement fixed column count by 1", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 4
      });

      var plugin = hot.getPlugin('manualColumnFreeze');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(4);
      plugin.removeFixedColumn();
      expect(hot.getSettings().fixedColumnsLeft).toEqual(3);
      plugin.removeFixedColumn();
      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
    });
  });

  describe("getBestColumnReturnPosition", function () {
    it("should calculate/estimate the best return position for already fixed column", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 2
      });

      var plugin = hot.getPlugin('manualColumnFreeze');

      plugin.changeColumnPositions(4, hot.getSettings().fixedColumnsLeft);
      plugin.addFixedColumn();
      // here manualColumnPositions looks like [0, 1, 4, 2, 3, 5] with 3 fixed columns

      expect(plugin.getBestColumnReturnPosition(2)).toEqual(4);
      expect(plugin.getBestColumnReturnPosition(1)).toEqual(2);
      expect(plugin.getBestColumnReturnPosition(0)).toEqual(2);

      plugin.addFixedColumn();
      expect(plugin.getBestColumnReturnPosition(2)).toEqual(4);
      expect(plugin.getBestColumnReturnPosition(1)).toEqual(3);
      expect(plugin.getBestColumnReturnPosition(0)).toEqual(3);
    });
  });

  describe("freezeColumn", function () {
    it("should freeze (make fixed) the column provided as an argument", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 2
      });

      var plugin = hot.getPlugin('manualColumnFreeze');
      var manualColumnMovePlugin = hot.getPlugin('manualColumnMove');
      var positionsArray = manualColumnMovePlugin.columnPositions;

      plugin.freezeColumn(5);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(3);
      expect(positionsArray[2]).toEqual(5);
      expect(positionsArray[3]).toEqual(2);
      expect(positionsArray[4]).toEqual(3);
    });
  });

  describe("unfreezeColumn", function () {
    it("should unfreeze (make non-fixed) the column provided as an argument", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 3
      });

      var plugin = hot.getPlugin('manualColumnFreeze');
      var manualColumnMovePlugin = hot.getPlugin('manualColumnMove');
      var positionsArray = manualColumnMovePlugin.columnPositions;

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(positionsArray[0]).toEqual(1);
      expect(positionsArray[1]).toEqual(2);
      expect(positionsArray[2]).toEqual(0);
    });
  });

  describe("functionality", function () {

    it("should add a 'freeze this column' context menu entry for non-fixed columns", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true
      });

      selectCell(1, 1);
      contextMenu();

      var freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        return $(this).text() === "Freeze this column";

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it("should add a 'unfreeze this column' context menu entry for fixed columns", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true,
        fixedColumnsLeft: 2
      });

      selectCell(1, 1);
      contextMenu();

      var freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        return $(this).text() === "Unfreeze this column";

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it("should fix the desired column after clicking the 'freeze this column' context menu entry", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 1,
        contextMenu: true
      });

      selectCell(1, 3);

      var dataAtCell = hot.getDataAtCell(1, 3);

      contextMenu();

      var freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        if ($(this).text() === "Freeze this column") {
          return true;
        }
        return false;
      });

      expect(freezeEntry.size()).toEqual(1);
      freezeEntry.eq(0).simulate("mousedown");

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(hot.getDataAtCell(1, 1)).toEqual(dataAtCell);

    });

    it("should unfix the desired column (and revert it to it's original position) after clicking the 'unfreeze this column' context menu entry", function () {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 3,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
        contextMenu: true,
        rowHeaders: true
      });

      var dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual("A2");
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual("C2");
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual("F2");

      selectCell(1, 1);
      contextMenu();

      var freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        return $(this).text() === "Unfreeze this column";

      });
      freezeEntry.eq(0).simulate("mousedown");

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual("A2");
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual("F2");
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual("C2");

      selectCell(1, 1);
      contextMenu();

      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        if ($(this).text() === "Unfreeze this column") {
          return true;
        }
        return false;
      });
      freezeEntry.eq(0).simulate("mousedown");

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual("A2");
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual("C2");
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual("D2");

      dataAtCell = hot.getDataAtCell(1, 5);
      expect(dataAtCell).toEqual("F2");

      // Use the modified columns position.
      hot.updateSettings({
        fixedColumnsLeft: 0,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
      });

      hot.getPlugin('manualColumnFreeze').fixedColumnsCount = 0;

      selectCell(1, 2);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        return $(this).text() === "Freeze this column";
      });

      freezeEntry.eq(0).simulate("mousedown");

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual("F2");

      selectCell(1, 0);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find("div").filter(function () {
        return $(this).text() === "Unfreeze this column";
      });

      freezeEntry.eq(0).simulate("mousedown");

      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual("F2");

    });

  });

});
