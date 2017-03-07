describe('AutoRowSize', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function arrayOfObjects() {
    return [
      {id: 'Short'},
      {id: 'Somewhat\nlong'},
      {id: 'The\nvery\nvery\nvery\nlongest one'}
    ];
  }
  function arrayOfObjects2() {
    return [
      {id: 'Short', name: 'Somewhat long'},
      {id: 'Somewhat long', name: 'The very very longest one'},
      {id: 'The very very very longest one', name: 'Short'}
    ];
  }

  it('should apply auto size by default', function() {
    handsontable({
      data: arrayOfObjects()
    });

    var height0 = rowHeight(this.$container, 0);
    var height1 = rowHeight(this.$container, 1);
    var height2 = rowHeight(this.$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should draw scrollbar correctly (proper height) after calculation when autoRowSize option is set (long text in row) #4000', (done) => {
    var row = ['This is very long text which will break this cell text into two lines'];
    var data = [];
    var nrOfRows = 200;
    var columnWidth = 100;

    for (var i = 0; i < nrOfRows; i += 1) {
      data.push(row);
    }

    handsontable({
      data,
      colWidths() {
        return columnWidth;
      },
      autoRowSize: true
    });

    var oldHeight = spec().$container[0].scrollHeight;

    setTimeout(() => {
      var newHeight = spec().$container[0].scrollHeight;
      expect(oldHeight).toBeLessThan(newHeight);
      done();
    }, 200);
  });

  describe('should draw scrollbar correctly (proper height) after calculation when autoRowSize option is set (`table td` element height set by CSS) #4000', () => {
    var cellHeightInPx = 100;
    var nrOfRows = null;
    var nrOfColumns = 200,
      style;

    var SYNC_CALCULATION_LIMIT = Handsontable.plugins.AutoRowSize.SYNC_CALCULATION_LIMIT;
    var CALCULATION_STEP = Handsontable.plugins.AutoRowSize.CALCULATION_STEP;

    beforeEach(function() {
      if (!this.$container) {
        this.$container = $(`<div id="${id}"></div>`).appendTo('body');
      }

      var css = `.handsontable table td { height: ${cellHeightInPx}px !important }`,
        head = document.head;

      style = document.createElement('style');
      style.type = 'text/css';

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      $(head).append(style);
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }

      if (style) {
        $(style).remove();
      }
    });

    it('(SYNC_CALCULATION_LIMIT - 1 rows)', (done) => {
      nrOfRows = SYNC_CALCULATION_LIMIT - 1;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      setTimeout(() => {
        var newHeight = spec().$container[0].scrollHeight;

        expect(newHeight).toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        done();
      }, 200);
    });

    it('(SYNC_CALCULATION_LIMIT + 1 rows)', (done) => {
      nrOfRows = SYNC_CALCULATION_LIMIT + 1;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      setTimeout(() => {
        var newHeight = spec().$container[0].scrollHeight;

        expect(newHeight).toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        done();
      }, 200);
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1 rows)', (done) => {

      nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      setTimeout(() => {
        var newHeight = spec().$container[0].scrollHeight;

        expect(newHeight).toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        done();
      }, 200);
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1 rows)', (done) => {

      nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      setTimeout(() => {
        var newHeight = spec().$container[0].scrollHeight;

        expect(newHeight).toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        done();
      }, 200);
    });
  });

  it('should correctly detect row height when table is hidden on init (display: none)', function(done) {
    this.$container.css('display', 'none');
    var hot = handsontable({
      data: arrayOfObjects(),
      rowHeaders: true,
      autoRowSize: true
    });

    setTimeout(() => {
      spec().$container.css('display', 'block');
      hot.render();

      expect(rowHeight(spec().$container, 0)).toBe(24);
      expect(rowHeight(spec().$container, 1)).toBe(43);
      expect([106, 127]).toEqual(jasmine.arrayContaining([rowHeight(spec().$container, 2)]));
      done();
    }, 200);
  });

  it('should be possible to disable plugin using updateSettings', function() {
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

  it('should be possible to enable plugin using updateSettings', () => {
    handsontable({
      data: arrayOfObjects(),
      autoRowSize: false
    });

    var height0 = parseInt(getCell(0, 0).style.height, 10);
    var height1 = parseInt(getCell(1, 0).style.height, 10);
    var height2 = parseInt(getCell(2, 0).style.height, 10);

    expect(height0).toEqual(height1);
    expect(height0).toEqual(height2);
    expect(height1).toEqual(height2);

    updateSettings({
      autoRowSize: true
    });

    height0 = parseInt(getCell(0, 0).style.height, 10);
    height1 = parseInt(getCell(1, 0).style.height, 10);
    height2 = parseInt(getCell(2, 0).style.height, 10);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should consider CSS style of each instance separately', () => {
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

    expect(parseInt(hot1.getCell(0, 0).style.height, 10)).toEqual(parseInt(hot2.getCell(0, 0).style.height, 10));

    $container1.addClass('big');
    hot1.render();
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height, 10)).toBeGreaterThan(parseInt(hot2.getCell(2, 0).style.height, 10));

    $container1.removeClass('big');
    hot1.render();
    $container2.addClass('big');
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height, 10)).toBeLessThan(parseInt(hot2.getCell(2, 0).style.height, 10));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', function() {
    var $style = $('<style>.htCore.big-table td {font-size: 32px;line-height: 1.1}</style>').appendTo('head');

    var hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    var height = parseInt(hot.getCell(2, 0).style.height, 10);

    this.$container.find('table').addClass('big-table');
    hot.getPlugin('autoRowSize').clearCache();
    render();
    expect(parseInt(hot.getCell(2, 0).style.height, 10)).toBeGreaterThan(height);

    $style.remove();
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', () => {
    var hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(69); // -1px of cell border
  });

  // Currently columns.height is not supported
  xit('should not trigger autoRowSize when column height is defined (through columns.height)', () => {
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

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(69); // -1px of cell border
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', () => {
    var data = arrayOfObjects();
    data.push({id: '2', name: 'Rocket Man', lastName: 'In a tin can'});

    var hot = handsontable({
      data,
      columns: [
        {data: 'id'},
        {data: 'name'}
      ],
      autoRowSize: true,
      renderer(instance, td, row, col, prop, value, cellProperties) {
        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, arguments);

        if (row === 1 && col === 0) {
          td.style.padding = '100px';
        }
      }
    });

    expect(parseInt(hot.getCell(1, 0).style.height || 0, 10)).toBe(242);
  });

  it('should destroy temporary element', () => {
    handsontable({
      autoRowSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should recalculate heights after column resize', function() {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualColumnResize: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]); // -1px of cell border

    resizeColumn.call(this, 1, 100);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(42);
    expect([63, 84]).toEqual(jasmine.arrayContaining([parseInt(hot.getCell(2, -1).style.height, 10)]));

    resizeColumn.call(this, 1, 50);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(42);
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBe(126);

    resizeColumn.call(this, 1, 200);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBe(42);
  });

  it('should recalculate heights after column moved', () => {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: [250, 50],
      manualColumnMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    var plugin = hot.getPlugin('manualColumnMove');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(42); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(105); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]); // -1px of cell border

    plugin.moveColumn(0, 2);
    hot.render();

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(42);
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBe(126);
  });

  it('should recalculate heights with manualRowResize when changing text to multiline', () => {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(49); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]); // -1px of cell border

    hot.setDataAtCell(1, 0, 'A\nB\nC\nD\nE');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(105);
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]);
  });

  it('should recalculate heights after moved row', () => {
    var hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      manualRowMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(22); // -1px of cell border
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(49); // -1px of cell border
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]); // -1px of cell border

    var plugin = hot.getPlugin('manualRowMove');
    plugin.moveRow(1, 0);
    hot.render();

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(49);
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).toBe(22);
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).toBeInArray([22, 42]); // -1px of cell border
  });

  it('should resize the column headers properly, according the their content sizes', () => {
    var hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(30, 30),
      colHeaders(index) {
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

    expect(rowHeight(spec().$container, -1)).toBe(89);
  });
});
