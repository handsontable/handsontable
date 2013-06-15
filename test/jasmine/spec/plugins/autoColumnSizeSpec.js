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

    var width0 = this.$container.find('tr:eq(0) td:eq(0)').width();
    var width1 = this.$container.find('tr:eq(0) td:eq(1)').width();
    var width2 = this.$container.find('tr:eq(0) td:eq(2)').width();

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should consider CSS style of each instance separately', function () {
    function getFirstCellWidth($el) {
      return $el.find('tr:eq(0) td:eq(0)').width();
    }

    var $style = $('<style>.big td {font-size: 40px}</style>').appendTo('head');
    var $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    var $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });

    expect(getFirstCellWidth($container1)).toEqual(getFirstCellWidth($container2));

    $container1.addClass('big').handsontable('render');
    $container2.handsontable('render');
    expect(getFirstCellWidth($container1)).toBeGreaterThan(getFirstCellWidth($container2));

    $container1.removeClass('big').handsontable('render');
    $container2.addClass('big').handsontable('render');
    expect(getFirstCellWidth($container1)).toBeLessThan(getFirstCellWidth($container2));

    $style.remove();
    $container1.remove();
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', function () {
    var $style = $('<style>.big-table td {font-size: 32px}</style>').appendTo('head');

    function getFirstCellWidth($el) {
      return $el.find('tr:eq(0) td:eq(0)').width();
    }

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true
    });

    var width = getFirstCellWidth(this.$container);

    this.$container.find('table').addClass('big-table');
    render();
    expect(getFirstCellWidth(this.$container)).toBeGreaterThan(width);

    $style.remove();
  });
});