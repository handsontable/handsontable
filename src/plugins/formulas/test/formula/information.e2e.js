describe('Formulas -> information functions', function() {
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

  it('ISBINARY', function() {
    var data = getDataForFormulas(0, 'name', ['=ISBINARY(A1)', '=ISBINARY(A2)', '=ISBINARY(A3)']);

    data[0].id = '1';
    data[1].id = '01011';
    data[2].id = 'foo';

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

  it('ISBLANK', function() {
    var data = getDataForFormulas(0, 'name', ['=ISBLANK(A1)', '=ISBLANK(A2)', '=ISBLANK(A3)', '=ISBLANK(A4)', '=ISBLANK(A5)', '=ISBLANK(A6)']);

    data[0].id = null;
    data[1].id = void 0;
    data[2].id = false;
    data[3].id = 0;
    data[4].id = 'foo';
    data[5].id = '';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe(false);
    expect(hot.getDataAtCell(2, 1)).toBe(false);
    expect(hot.getDataAtCell(3, 1)).toBe(false);
    expect(hot.getDataAtCell(4, 1)).toBe(false);
    expect(hot.getDataAtCell(5, 1)).toBe(false);
  });

  it('ISEVEN', function() {
    var data = getDataForFormulas(0, 'name', ['=ISEVEN(A1)', '=ISEVEN(A2)', '=ISEVEN(A3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 2.5;

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

  it('ISLOGICAL', function() {
    var data = getDataForFormulas(0, 'name', ['=ISLOGICAL(A1)', '=ISLOGICAL(A2)', '=ISLOGICAL(A3)', '=ISLOGICAL(A4)', '=ISLOGICAL(A5)']);

    data[0].id = 1;
    data[1].id = false;
    data[2].id = true;
    data[3].id = null;
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

  it('ISNONTEXT', function() {
    var data = getDataForFormulas(0, 'name', ['=ISNONTEXT(A1)', '=ISNONTEXT(A2)', '=ISNONTEXT(A3)', '=ISNONTEXT(A4)']);

    data[0].id = 1;
    data[1].id = true;
    data[2].id = 'false';
    data[3].id = 'foo';

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
    expect(hot.getDataAtCell(3, 1)).toBe(false);
  });

  it('ISNUMBER', function() {
    var data = getDataForFormulas(0, 'name', ['=ISNUMBER(A1)', '=ISNUMBER(A2)', '=ISNUMBER(A3)', '=ISNUMBER(A4)']);

    data[0].id = 1;
    data[1].id = 0.3456;
    data[2].id = '0.3456';
    data[3].id = 'false';

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
    expect(hot.getDataAtCell(3, 1)).toBe(false);
  });

  it('ISODD', function() {
    var data = getDataForFormulas(0, 'name', ['=ISODD(A1)', '=ISODD(A2)', '=ISODD(A3)']);

    data[0].id = 1;
    data[1].id = 2;
    data[2].id = 2.5;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
    expect(hot.getDataAtCell(1, 1)).toBe(false);
    expect(hot.getDataAtCell(2, 1)).toBe(false);
  });

  it('ISTEXT', function() {
    var data = getDataForFormulas(0, 'name', ['=ISTEXT(A1)', '=ISTEXT(A2)', '=ISTEXT(A3)', '=ISTEXT(A4)']);

    data[0].id = 1;
    data[1].id = '2';
    data[2].id = true;
    data[3].id = 'true';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(1, 1)).toBe(true);
    expect(hot.getDataAtCell(2, 1)).toBe(false);
    expect(hot.getDataAtCell(3, 1)).toBe(true);
  });
});
