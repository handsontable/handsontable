describe('Formulas -> logical functions', function() {
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

  function getData(row, column, value) {
    var data = getDataForFormulas();

    if (row !== void 0) {
      if (!Array.isArray(value)) {
        value = [value];
      }
      value.forEach(function(v, index) {
        data[row + index][column] = v;
      });
    }

    return data;
  }

  it('AND', function() {
    var data = getData(0, 'name', ['=AND(A1)', '=AND(A1, A2, A3)', '=AND(A1, A2, A3, A4)']);

    data[0].id = true;
    data[1].id = true;
    data[2].id = true;
    data[3].id = false;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
    expect(hot.getDataAtCell(2, 1)).toBe(false);
  });

  it('CHOOSE', function() {
    var data = getData(0, 'name', ['=CHOOSE()', '=CHOOSE(2, A1, A2, A3)', '=CHOOSE(6, A1, A2, A3)']);

    data[0].id = 'foo';
    data[1].id = 'bar';
    data[2].id = 'baz';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe('bar');
    expect(hot.getDataAtCell(2, 1)).toBe('#VALUE!');
  });

  it('FALSE', function() {
    var data = getData(0, 'name', ['=FALSE()']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
  });

  it('IF', function() {
    var data = getData(0, 'name', ['=IF(A1, 1, 2)', '=IF(A2, "foo", "bar")']);

    data[0].id = true;
    data[1].id = false;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1);
    expect(hot.getDataAtCell(1, 1)).toBe('bar');
  });

  it('NOT', function() {
    var data = getData(0, 'name', ['=NOT(A1)', '=NOT(A2)', '=NOT(A3)', '=NOT(A4)', '=NOT(A5)']);

    data[0].id = true;
    data[1].id = false;
    data[2].id = 0;
    data[3].id = 1;
    data[4].id = 'foo';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
    expect(hot.getDataAtCell(2, 1)).toBe(true);
    expect(hot.getDataAtCell(3, 1)).toBe(false);
    expect(hot.getDataAtCell(4, 1)).toBe(false);
  });

  it('OR', function() {
    var data = getData(0, 'name', ['=OR(A1)', '=OR(A1, A2, A3)', '=OR(A1, A2, A3, A4)']);

    data[0].id = false;
    data[1].id = false;
    data[2].id = true;
    data[3].id = false;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
    expect(hot.getDataAtCell(2, 1)).toBe(true);
  });

  it('TRUE', function() {
    var data = getData(0, 'name', ['=TRUE()']);

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
  });

  it('XOR', function() {
    var data = getData(0, 'name', ['=XOR(A1)', '=XOR(A1, A2, A3)', '=XOR(A1, A2, A3, A4)', '=XOR(A1, A2, A4)']);

    data[0].id = false;
    data[1].id = false;
    data[2].id = true;
    data[3].id = false;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
    expect(hot.getDataAtCell(2, 1)).toBe(true);
    expect(hot.getDataAtCell(3, 1)).toBe(false);
  });

  it('SWITCH', function() {
    var data = getData(0, 'name', ['=SWITCH(A1, 9, "foo", 7, "bar")', '=SWITCH(A2, 1, "foo", 2, "bar", 3, "baz")']);

    data[0].id = 9;
    data[1].id = 33;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
    expect(hot.getDataAtCell(1, 1)).toBe('#N/A');
  });
});
