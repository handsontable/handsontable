'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

describe('AutoColumnSize', function () {
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

  var arrayOfObjects = function arrayOfObjects() {
    return [{ id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one', nestedData: [{ id: 1000 }] }];
  };

  it('should apply auto size by default', function () {
    handsontable({
      data: arrayOfObjects()
    });

    var width0 = colWidth(spec().$container, 0);
    var width1 = colWidth(spec().$container, 1);
    var width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should update column width after update value in cell (array of objects)', _asyncToGenerator(function* () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'lastName' }]
    });

    expect(colWidth(spec().$container, 0)).toBeAroundValue(50, 3);
    expect([117, 120, 121, 129, 135]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
    expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 2)]));

    setDataAtRowProp(0, 'id', 'foo bar foo bar foo bar');
    setDataAtRowProp(0, 'name', 'foo');

    yield sleep(50);

    expect([165, 168, 169, 189, 191]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect(colWidth(spec().$container, 1)).toBeAroundValue(50, 3);
    expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 2)]));
  }));

  it('should correctly detect column widths with colHeaders', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier Longer text'],
      columns: [{ data: 'id' }, { data: 'name' }]
    });

    expect([149, 155, 174, 178]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as an array', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [{ data: 'id' }, { data: 'name' }]
    });

    expect([50, 51, 53]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));

    updateSettings({ colHeaders: ['Identifier Longer text', 'Identifier Longer and longer text'] });

    expect([149, 155, 174, 178]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect([226, 235, 263, 270]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a string', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [{ data: 'id' }, { data: 'name' }]
    });

    expect([50, 51, 53]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));

    updateSettings({ colHeaders: 'Identifier Longer text' });

    expect([149, 155, 174, 178]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect([149, 155, 174, 178]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a function', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [{ data: 'id' }, { data: 'name' }]
    });

    expect([50, 51, 53]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));

    updateSettings({
      colHeaders: function colHeaders(index) {
        return index === 0 ? 'Identifier Longer text' : 'Identifier Longer and longer text';
      }
    });

    expect([149, 155, 174, 178]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect([226, 235, 263, 270]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
  });

  it('should correctly detect column width with colHeaders and the useHeaders option set to false (not taking the header widths into calculation)', function () {
    handsontable({
      data: [{ id: 'ab' }],
      autoColumnSize: {
        useHeaders: false
      },
      colHeaders: ['Identifier'],
      columns: [{ data: 'id' }]
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
  });

  it('should correctly detect column width with columns.title', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [{ data: 'id', title: 'Identifier' }]
    });

    expect([68, 70, 71, 80, 82]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
  });

  it('should correctly detect column widths after update columns.title', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [{ data: 'id', title: 'Identifier' }]
    });

    updateSettings({
      columns: [{ data: 'id', title: 'Identifier with longer text' }]
    });

    expect([174, 182, 183, 208, 213]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
  });

  // https://github.com/handsontable/handsontable/issues/2684
  it('should correctly detect column width when table is hidden on init (display: none)', _asyncToGenerator(function* () {
    spec().$container.css('display', 'none');
    var hot = handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier', 'First Name']
    });

    yield sleep(200);

    spec().$container.css('display', 'block');
    hot.render();

    expect([68, 70, 71, 80, 82]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
  }));

  it('should not wrap the cell values when the whole column has values with the same length', function () {
    handsontable({
      data: [{
        units: 'EUR / USD'
      }, {
        units: 'JPY / USD'
      }, {
        units: 'GBP / USD'
      }, {
        units: 'MXN / USD'
      }, {
        units: 'ARS / USD'
      }],
      autoColumnSize: {
        samplingRatio: 5
      },
      columns: [{ data: 'units' }]
    });

    expect([93]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect(rowHeight(spec().$container, 0)).toBe(24);
    expect(rowHeight(spec().$container, 1)).toBe(23);
    expect(rowHeight(spec().$container, 2)).toBe(23);
    expect(rowHeight(spec().$container, 3)).toBe(23);
    expect(rowHeight(spec().$container, 4)).toBe(23);
  });

  it('should keep last columns width unchanged if all rows was removed', _asyncToGenerator(function* () {
    var hot = handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [{ data: 'id', title: 'Identifier' }, { data: 'name', title: 'Name' }, { data: 'lastName', title: 'Last Name' }]
    });

    expect([68, 70, 71, 80, 82]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect([117, 120, 121, 129, 135]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
    expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 2)]));

    hot.alter('remove_row', 0);
    yield sleep(50);

    expect([68, 70, 71, 80, 82]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 0)]));
    expect([117, 120, 121, 129, 135]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 1)]));
    expect([216, 229, 247, 260, 261]).toEqual(jasmine.arrayContaining([colWidth(spec().$container, 2)]));
  }));

  it('should be possible to disable plugin using updateSettings', function () {
    handsontable({
      data: arrayOfObjects()
    });

    var width0 = colWidth(spec().$container, 0);
    var width1 = colWidth(spec().$container, 1);
    var width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);

    updateSettings({
      autoColumnSize: false
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);
  });

  it('should apply disabling/enabling plugin using updateSettings, only to a particular HOT instance', function () {
    spec().$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');

    handsontable({
      data: arrayOfObjects()
    });

    spec().$container2.handsontable({
      data: arrayOfObjects()
    });

    var widths = {
      1: [],
      2: []
    };

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toBeLessThan(widths[1][1]);
    expect(widths[1][1]).toBeLessThan(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    updateSettings({
      autoColumnSize: false
    });

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toEqual(widths[1][1]);
    expect(widths[1][0]).toEqual(widths[1][2]);
    expect(widths[1][1]).toEqual(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();
  });

  it('should be possible to enable plugin using updateSettings', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: false
    });

    var width0 = colWidth(spec().$container, 0);
    var width1 = colWidth(spec().$container, 1);
    var width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);

    updateSettings({
      autoColumnSize: true
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should consider CSS style of each instance separately', function () {
    var $style = $('<style>.big .htCore td {font-size: 40px; line-height: 1.1;}</style>').appendTo('head');
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    var hot1 = $container1.handsontable('getInstance');
    var hot2 = $container2.handsontable('getInstance');

    expect(colWidth($container1, 0)).toEqual(colWidth($container2, 0));

    $container1.addClass('big');
    hot1.render();
    hot2.render();
    expect(colWidth($container1, 0)).toBeGreaterThan(colWidth($container2, 0));

    $container1.removeClass('big').handsontable('render');
    $container2.addClass('big').handsontable('render');
    expect(colWidth($container1, 0)).toBeLessThan(colWidth($container2, 0));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', function () {
    var $style = $('<style>.htCore.big-table td {font-size: 32px}</style>').appendTo('head');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true
    });

    var width = colWidth(spec().$container, 0);

    spec().$container.find('table').addClass('big-table');
    render();
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(width);

    $style.remove();
  });

  it('should destroy temporary element', function () {
    handsontable({
      autoColumnSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidths: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should not trigger autoColumnSize when column width is defined (through columns.width)', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidth: 77,
      columns: [{ width: 70 }, { width: 70 }, { width: 70 }],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', function () {
    var data = arrayOfObjects();
    data.push({ id: '2', name: 'Rocket Man', lastName: 'In a tin can' });
    handsontable({
      data: data,
      columns: [{ data: 'id' }, { data: 'name' }],
      autoColumnSize: true,
      renderer: function renderer(instance, td, row, col) {
        for (var _len = arguments.length, args = Array(_len > 4 ? _len - 4 : 0), _key = 4; _key < _len; _key++) {
          args[_key - 4] = arguments[_key];
        }

        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col].concat(_toConsumableArray(args)));
        if (row === 1 && col === 0) {
          td.style.padding = '100px';
        }
      }
    });

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(colWidth(spec().$container, 1));
  });

  it('should\'t serialize value if it is array (nested data sources)', function () {
    var spy = jasmine.createSpy('renderer');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [{ data: 'nestedData' }],
      renderer: spy
    });

    expect(spy.calls.mostRecent().args[5]).toEqual([{ id: 1000 }]);
  });
});