describe('AutoRowSize', function () {
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

  function arrayOfObjects() {
    return [
      {id: "Short"},
      {id: "Somewhat\nlong"},
      {id: "The\nvery\nvery\nvery\nlongest one"}
    ];
  }
  function arrayOfObjects2() {
    return [
      {id: "Short", name: "Somewhat long"},
      {id: "Somewhat long", name: "The very very longest one"},
      {id: "The very very very longest one", name: "Short"}
    ];
  }

  it('should apply auto size by default', function () {
    handsontable({
      data: arrayOfObjects()
    });

    var height0 = rowHeight(this.$container, 0);
    var height1 = rowHeight(this.$container, 1);
    var height2 = rowHeight(this.$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should correctly detect row height when table is hidden on init (display: none)', function () {
    this.$container.css('display', 'none');
    var hot = handsontable({
      data: arrayOfObjects(),
      rowHeaders: true,
      autoRowSize: true
    });

    waits(200);

    runs(function() {
      this.$container.css('display', 'block');
      hot.render();

      expect(rowHeight(this.$container, 0)).toBeAroundValue(24);
      expect(rowHeight(this.$container, 1)).toBeAroundValue(43);

      if (Handsontable.helper.isIE9()) {
        expect(rowHeight(this.$container, 2)).toBeAroundValue(127);
      } else {
        expect(rowHeight(this.$container, 2)).toBeAroundValue(106);
      }
    });
  });

  it('should be possible to disable plugin using updateSettings', function () {
    var hot = handsontable({
      data: arrayOfObjects()
    });

    var height0 = rowHeight(this.$container, 0);
    var height1 = rowHeight(this.$container, 1);
    var height2 = rowHeight(this.$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);

    updateSettings({
      autoRowSize: false
    });
    hot.setDataAtCell(0, 0, 'A\nB\nC');

    var height4 = rowHeight(this.$container, 0);

    expect(height4).toBeGreaterThan(height0);
  });

  it('should be possible to enable plugin using updateSettings', function () {
    handsontable({
      data: arrayOfObjects(),
      autoRowSize: false
    });

    var height0 = parseInt(getCell(0, 0).style.height || 0);
    var height1 = parseInt(getCell(1, 0).style.height || 0);
    var height2 = parseInt(getCell(2, 0).style.height || 0);

    expect(height0).toEqual(height1);
    expect(height0).toEqual(height2);
    expect(height1).toEqual(height2);

    updateSettings({
      autoRowSize: true
    });

    height0 = parseInt(getCell(0, 0).style.height || 0);
    height1 = parseInt(getCell(1, 0).style.height || 0);
    height2 = parseInt(getCell(2, 0).style.height || 0);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should consider CSS style of each instance separately', function () {
    var $style = $('<style>.big .htCore td {font-size: 40px;line-height: 1.1}</style>').appendTo('head');
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    var hot1 = $container1.handsontable('getInstance');
    var hot2 = $container2.handsontable('getInstance');

    expect(parseInt(hot1.getCell(0, 0).style.height || 0)).toEqual(parseInt(hot2.getCell(0, 0).style.height || 0));

    $container1.addClass('big');
    hot1.render();
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height || 0)).toBeGreaterThan(parseInt(hot2.getCell(2, 0).style.height || 0));

    $container1.removeClass('big');
    hot1.render();
    $container2.addClass('big');
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height || 0)).toBeLessThan(parseInt(hot2.getCell(2, 0).style.height || 0));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', function () {
    var $style = $('<style>.htCore.big-table td {font-size: 32px;line-height: 1.1}</style>').appendTo('head');

    var hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    var height = parseInt(hot.getCell(2, 0).style.height || 0);

    this.$container.find('table').addClass('big-table');
    hot.getPlugin('autoRowSize').clearCache();
    render();
    expect(parseInt(hot.getCell(2, 0).style.height || 0)).toBeGreaterThan(height);

    $style.remove();
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', function () {
    var hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(69); // -1px of cell border
  });

  // Currently columns.height is not supported
  xit('should not trigger autoColumnSize when column width is defined (through columns.width)', function () {
    var hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: 77,
      columns: [
        {height: 70},
        {height: 70},
        {height: 70}
      ],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(69); // -1px of cell border
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', function () {
    var data = arrayOfObjects();
    data.push({id: "2", name: "Rocket Man", lastName: "In a tin can"});

    var hot = handsontable({
      data: data,
      columns: [
        {data: 'id'},
        {data: 'name'}
      ],
      autoRowSize: true,
      renderer: function (instance, td, row, col, prop, value, cellProperties) {
        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, arguments);

        if (row === 1 && col === 0) {
          td.style.padding = "100px";
        }
      }
    });

    expect(parseInt(hot.getCell(1, 0).style.height || 0)).toBe(242);
  });

  it('should destroy temporary element', function () {
    handsontable({
      autoRowSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should recalculate heights after column resize', function () {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualColumnResize: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22); // -1px of cell border

    resizeColumn.call(this, 1, 100);

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(42);

    resizeColumn.call(this, 1, 50);

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(42);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(126);

    resizeColumn.call(this, 1, 200);

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22);
  });

  it('should recalculate heights after column moved', function () {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: [250, 50],
      manualColumnMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    window.hot = hot;

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(42); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(105); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22); // -1px of cell border

    swapDisplayedColumns(getHtCore(), 2, 1);

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(42);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(126);
  });

  it('should recalculate heights with manualRowResize when changing text to multiline', function () {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(49); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22); // -1px of cell border

    hot.setDataAtCell(1, 0, 'A\nB\nC\nD\nE');

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(105);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22);
  });

  it('should recalculate heights after moved row', function () {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      manualRowMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(49); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22); // -1px of cell border

    moveSecondDisplayedRowBeforeFirstRow(getHtCore(), 0);

    expect(parseInt(hot.getCell(0, -1).style.height || 0)).toBe(49);
    expect(parseInt(hot.getCell(1, -1).style.height || 0)).toBe(22);
    expect(parseInt(hot.getCell(2, -1).style.height || 0)).toBe(22);
  });

  it('should resize the column headers properly, according the their content sizes', function() {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 30),
      colHeaders: function(index) {
        if (index === 22) {
          return 'a<br>much<br>longer<br>label';
        }
        return 'test';
      },
      autoRowSize: true,
      rowHeaders: true,
      width: 300,
      height: 300
    });

    debugger;

  });
});
