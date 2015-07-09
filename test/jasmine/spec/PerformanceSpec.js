describe('Performance', function () {
  var id = 'testContainer';

  //this is a test suite to test if there are no redundant operations

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call renderer once for one cell (fixed column width)', function () {
    var count = 0;
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colWidths: 100,
      rowHeights: 23,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(1); // only for master table
  });

  it('should call renderer twice for one cell (auto column width)', function () {
    var count = 0;
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      rowHeights: 23,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(2); // 1 for autoColumnSize, 1 for actual cell render
  });

  it('should call renderer twice for one cell (auto row height)', function () {
    var count = 0;
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colWidths: 50,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(1); // 1 for actual cell render (colWidths prevent autoColumnSize to enable)
  });

  it('should call renderer triple times for one cell (auto row height, auto column width)', function () {
    var count = 0;
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      autoRowSize: true,
      autoColumnSize: true,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(3); //1 for autoColumnSize, 1 for autoRowSize, 1 for actual cell render
  });

  it('should call getCellMeta minimum number of times for one cell (auto column width, without overlays)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      rowHeights: 23,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(7);
  });

  it('should call getCellMeta minimum number of times for one cell (auto row height, without overlays)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colWidths: 50,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(5);
  });

  it('should call getCellMeta minimum number of times for one cell (auto column width, with left overlay)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colHeaders: true,
      rowHeights: 23,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(8);
  });

  it('should call getCellMeta minimum number of times for one cell (auto row height, with left overlay)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colHeaders: true,
      colWidths: 50,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(6);
  });

  it('should call getCellMeta minimum number of times for one cell (auto column width, with top overlay)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      rowHeaders: true,
      rowHeights: 23,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(7);
  });

  it('should call getCellMeta minimum number of times for one cell (auto row height, with top overlay)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      rowHeaders: true,
      colWidths: 50,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(5);
  });

  it('should call getCellMeta minimum number of times for one cell (auto column width, with all overlays)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colHeaders: true,
      rowHeaders: true,
      rowHeights: 23,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(8);
  });

  it('should call getCellMeta minimum number of times for one cell (auto row height, with all overlays)', function () {
    var count = 0;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 1),
      colHeaders: true,
      rowHeaders: true,
      colWidths: 50,
      beforeGetCellMeta: function(){
        count++;
      }
    });

    expect(count).toEqual(6);
  });

  it('should call renderer twice for each cell (auto column width)', function () {
    var count = 0;
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      rowHeights: 23,
      autoColumnSize: true,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(28);
  });

  it('should call renderer twice for each cell (auto row height)', function () {
    var count = 0;
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      colWidths: 50,
      autoRowSize: true,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(28); // 16 in main table and 4 rows for autoRowSize
  });

  it('should call renderer twice for each cell (auto row height, auto column width)', function () {
    var count = 0;
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(4, 4),
      autoRowSize: true,
      autoColumnSize: true,
      renderer: function () {
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        count++;
      }
    });

    expect(count).toEqual(40); // 16x2 in main table, 4 rows for autoRowSize and 4 cols for autoColumnSize
  });
});
