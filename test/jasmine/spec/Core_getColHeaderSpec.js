describe('Core.getColHeader', function () {
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

  it('when not configured, should return undefined', function () {
    handsontable();
    expect(getColHeader(1)).toEqual(void 0);
  });

  it('when configured as true, should return the Excel-style column title', function () {
    handsontable({
      colHeaders: true
    });
    expect(getColHeader(30)).toEqual('AE');
  });

  it('when configured as array, should return value at index', function () {
    handsontable({
      colHeaders: ['One', 'Two', 'Three', 'Four', 'Five']
    });
    expect(getColHeader(1)).toEqual('Two');
  });

  it('when configured as function, should return function output', function () {
    handsontable({
      colHeaders: function (index) {
        return 'col' + index;
      }
    });
    expect(getColHeader(1)).toEqual('col1');
  });

  it('when configured as static value, should return the value', function () {
    handsontable({
      colHeaders: 'static'
    });
    expect(getColHeader(1)).toEqual('static');
  });

  it('when configured as HTML value, should render that as HTML', function () {
    handsontable({
      colHeaders: function (index) {
        return '<b>col' + index + '</b>';
      }
    });
    expect(getColHeader(1)).toEqual('<b>col1</b>');
  });

  it('when no argument given, should return as much column headers as there are columns', function () {
    handsontable({
      colHeaders: true,
      startCols: 3
    });
    expect(getColHeader()).toEqual(['A', 'B', 'C']);
  });
});