describe('Core.getRowHeader', function () {
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
    expect(getRowHeader(1)).toEqual(void 0);
  });

  it('when configured as true, should return the index incremented by 1', function () {
    handsontable({
      rowHeaders: true
    });
    expect(getRowHeader(1)).toEqual(2);
  });

  it('when configured as array, should return value at index', function () {
    handsontable({
      rowHeaders: ['One', 'Two', 'Three', 'Four', 'Five']
    });
    expect(getRowHeader(1)).toEqual('Two');
  });

  it('when configured as function, should return function output', function () {
    handsontable({
      rowHeaders: function (index) {
        return 'row' + index;
      }
    });
    expect(getRowHeader(1)).toEqual('row1');
  });

  it('when configured as static value, should return the value', function () {
    handsontable({
      rowHeaders: 'static'
    });
    expect(getRowHeader(1)).toEqual('static');
  });

  it('when configured as HTML value, should render that as HTML', function () {
    handsontable({
      rowHeaders: function (index) {
        return '<b>row' + index + '</b>';
      }
    });
    expect(getRowHeader(1)).toEqual('<b>row1</b>');
  });

  it('when no argument given, should return as much row headers as there are rows', function () {
    handsontable({
      rowHeaders: true,
      startRows: 3
    });
    expect(getRowHeader()).toEqual([1, 2, 3]);
  });
});