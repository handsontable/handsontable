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

  var arrayOfObjects = function () {
    return [
      {id: "Short", name: "Somewhat long", lastName: "The very very very longest one", nestedData: [{id: 1000}]}
    ];
  };

  it('should apply auto size by default', function () {
    handsontable({
      data: arrayOfObjects()
    });

    var width0 = colWidth(this.$container, 0);
    var width1 = colWidth(this.$container, 1);
    var width2 = colWidth(this.$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should update column width after update value in cell (array of objects)', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        {data: 'id'},
        {data: 'name'},
        {data: 'lastName'},
      ]
    });

    expect(colWidth(this.$container, 0)).toBeAroundValue(50);
    expect([93, 94, 95, 96].indexOf(colWidth(this.$container, 1))).toBeGreaterThan(-1);
    expect([171, 174, 175, 176].indexOf(colWidth(this.$container, 2))).toBeGreaterThan(-1); // codeship reports different values

    setDataAtRowProp(0, 'id', 'foo bar foo bar foo bar');
    setDataAtRowProp(0, 'name', 'foo');

    expect(colWidth(this.$container, 0)).toBeAroundValue(129);
    expect(colWidth(this.$container, 1)).toBeAroundValue(50);
    expect([171, 174, 175, 176].indexOf(colWidth(this.$container, 2))).toBeGreaterThan(-1); // codeship reports different values
  });

  it('should correctly detect column width with colHeaders', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier Longer text'],
      columns: [
        {data: 'id'}
      ]
    });

    expect(colWidth(this.$container, 0)).toBeAroundValue(119);
  });

  it('should correctly detect column width with colHeaders and the useHeaders option set to false (not taking the header widths into calculation)', function () {
    handsontable({
      data: [
        {id: 'ab'}
      ],
      autoColumnSize: {
        useHeaders: false
      },
      colHeaders: ['Identifier'],
      columns: [
        {data: 'id'}
      ]
    });

    expect(colWidth(this.$container, 0)).toEqual(50);
  });

  it('should correctly detect column width with columns.title', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        {data: 'id', title: 'Identifier'}
      ]
    });

    expect(colWidth(this.$container, 0)).toBeAroundValue(56);
  });

  // https://github.com/handsontable/handsontable/issues/2684
  it('should correctly detect column width when table is hidden on init (display: none)', function () {
    this.$container.css('display', 'none');
    var hot = handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier', 'First Name']
    });

    waits(200);

    runs(function() {
      this.$container.css('display', 'block');
      hot.render();

      expect(colWidth(this.$container, 0)).toBeAroundValue(56);
    });
  });

  it('should keep last columns width unchanged if all rows was removed', function () {
    var hot = handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        {data: 'id', title: 'Identifier'},
        {data: 'name', title: 'Name'},
        {data: 'lastName', title: 'Last Name'},
      ]
    });

    expect(colWidth(this.$container, 0)).toBeAroundValue(56);
    expect([93, 94, 95, 96].indexOf(colWidth(this.$container, 1))).toBeGreaterThan(-1);
    expect([171, 174, 175, 176].indexOf(colWidth(this.$container, 2))).toBeGreaterThan(-1); // codeship reports different values

    hot.alter('remove_row', 0);

    expect(colWidth(this.$container, 0)).toBeAroundValue(56);
    expect([93, 94, 95, 96].indexOf(colWidth(this.$container, 1))).toBeGreaterThan(-1);
    expect([171, 174, 175, 176].indexOf(colWidth(this.$container, 2))).toBeGreaterThan(-1); // codeship reports different values
  });

  it('should be possible to disable plugin using updateSettings', function () {

    handsontable({
      data: arrayOfObjects()
    });

    var width0 = colWidth(this.$container, 0);
    var width1 = colWidth(this.$container, 1);
    var width2 = colWidth(this.$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);

    updateSettings({
      autoColumnSize: false
    });

    width0 = colWidth(this.$container, 0);
    width1 = colWidth(this.$container, 1);
    width2 = colWidth(this.$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);
  });

  it('should apply disabling/enabling plugin using updateSettings, only to a particular HOT instance', function () {

    this.$container2 = $('<div id="' + id + '-2"></div>').appendTo('body');


    handsontable({
      data: arrayOfObjects()
    });

    this.$container2.handsontable({
      data: arrayOfObjects()
    });

    var widths = {
      1: [],
      2: []
    };

    widths[1][0] = colWidth(this.$container, 0);
    widths[1][1] = colWidth(this.$container, 1);
    widths[1][2] = colWidth(this.$container, 2);

    widths[2][0] = colWidth(this.$container2, 0);
    widths[2][1] = colWidth(this.$container2, 1);
    widths[2][2] = colWidth(this.$container2, 2);

    expect(widths[1][0]).toBeLessThan(widths[1][1]);
    expect(widths[1][1]).toBeLessThan(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    updateSettings({
      autoColumnSize: false
    });

    widths[1][0] = colWidth(this.$container, 0);
    widths[1][1] = colWidth(this.$container, 1);
    widths[1][2] = colWidth(this.$container, 2);

    widths[2][0] = colWidth(this.$container2, 0);
    widths[2][1] = colWidth(this.$container2, 1);
    widths[2][2] = colWidth(this.$container2, 2);

    expect(widths[1][0]).toEqual(widths[1][1]);
    expect(widths[1][0]).toEqual(widths[1][2]);
    expect(widths[1][1]).toEqual(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    this.$container2.handsontable('destroy');
    this.$container2.remove();
  });

  it('should be possible to enable plugin using updateSettings', function () {

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: false
    });

    var width0 = colWidth(this.$container, 0);
    var width1 = colWidth(this.$container, 1);
    var width2 = colWidth(this.$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);

    updateSettings({
      autoColumnSize: true
    });

    width0 = colWidth(this.$container, 0);
    width1 = colWidth(this.$container, 1);
    width2 = colWidth(this.$container, 2);

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

    var width = colWidth(this.$container, 0);

    this.$container.find('table').addClass('big-table');
    render();
    expect(colWidth(this.$container, 0)).toBeGreaterThan(width);

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

    expect(colWidth(this.$container, 0)).toBe(70);
  });

  it('should not trigger autoColumnSize when column width is defined (through columns.width)', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidth: 77,
      columns: [
        {width: 70},
        {width: 70},
        {width: 70}
      ],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(colWidth(this.$container, 0)).toBe(70);
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', function () {
    var data = arrayOfObjects();
    data.push({id: "2", name: "Rocket Man", lastName: "In a tin can"});
    handsontable({
      data: data,
      columns: [
        {data: 'id'},
        {data: 'name'}
      ],
      autoColumnSize: true,
      renderer: function (instance, td, row, col, prop, value, cellProperties) {
        //taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        if (row === 1 && col === 0) {
          td.style.padding = "100px";
        }
      }
    });

    expect(colWidth(this.$container, 0)).toBeGreaterThan(colWidth(this.$container, 1));
  });

  it('should\'t serialize value if it is array (nested data sources)', function () {
    var spy = jasmine.createSpy('renderer');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        {data: 'nestedData'}
      ],
      renderer: spy
    });

    expect(spy.mostRecentCall.args[5]).toEqual([{id: 1000}]);
  });
});
