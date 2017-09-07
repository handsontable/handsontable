describe('Formulas -> math trig functions', function() {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('NUMERAL', function() {
    var data = getDataForFormulas(0, 'name', ['=NUMERAL()', '=NUMERAL(A1, "0,0.000")', '=NUMERAL(A2, "$0,0.0")']);

    data[0].id = -2.2;
    data[1].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    // The same exclude as in the hot-formula-parser
    // expect(hot.getDataAtCell(0, 1)).toBe('0');
    expect(hot.getDataAtCell(1, 1)).toBe('-2.200');
    expect(hot.getDataAtCell(2, 1)).toBe('$3.0');
  });

  it('UNIQUE', function() {
    var data = getDataForFormulas(0, 'name', ['=UNIQUE()', '=UNIQUE(1, 2, 3, 4, 4, 4, 4, 3)']);

    data[0].id = -2.2;
    data[1].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toEqual([]);
    expect(hot.getDataAtCell(1, 1)).toEqual([1, 2, 3, 4]);
  });

  it('ARGS2ARRAY', function() {
    var data = getDataForFormulas(0, 'name', ['=ARGS2ARRAY()', '=ARGS2ARRAY(1, 2, 3, 4, 4, 4, 4, 3)']);

    data[0].id = -2.2;
    data[1].id = 3;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toEqual([]);
    expect(hot.getDataAtCell(1, 1)).toEqual([1, 2, 3, 4, 4, 4, 4, 3]);
  });

  it('FLATTEN', function() {
    var data = getDataForFormulas(0, 'address', ['=FLATTEN()', '=FLATTEN(A1:B3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 'Nannie Patel', 2, 'Leanne Ware', 3, 'Mathis Boone']);
  });

  it('JOIN', function() {
    var data = getDataForFormulas(0, 'address', ['=JOIN()', '=JOIN(A1:B3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 'Nannie Patel', 2, 'Leanne Ware', 3, 'Mathis Boone'].join(','));
  });

  it('NUMBERS', function() {
    var data = getDataForFormulas(0, 'address', ['=NUMBERS()', '=NUMBERS(A1:B3)']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toEqual([]);
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 2, 3]);
  });

  it('REFERENCE', function() {
    var data = getDataForFormulas(0, 'address', ['=REFERENCE()', '=REFERENCE(A1, "name.firstName")']);

    data[0].id = {name: {firstName: 'Jim'}};

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe('Jim');
  });
});
