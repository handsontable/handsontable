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
      {id: "Short", name: "Somewhat long", lastName: "The very very very longest one"}
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

  it('should consider CSS style of each instance separately', function () {
    var $style = $('<style>.big td {font-size: 40px}</style>').appendTo('head');
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });

    expect(colWidth($container1, 0)).toEqual(colWidth($container2, 0));

    $container1.addClass('big').handsontable('render');
    $container2.handsontable('render');
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
    var $style = $('<style>.big-table td {font-size: 32px}</style>').appendTo('head');

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

    var HOT = getInstance();
    var tmp = HOT.autoColumnSizeTmp.container;

    expect(tmp.parentNode).toBe(document.body);

    destroy();

    expect(tmp.parentNode).not.toBe(document.body); //null in standard browsers, #document-fragment in IE8
  });

  it('should not set column width wider than the viewport', function () {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      width: 100,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLongLongLongLongLongLongLongLongLongLongLongCell');

    expect(colWidth(this.$container, 0)).toBeLessThan(55); //remaining part is used by row header and scrollbar
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
});