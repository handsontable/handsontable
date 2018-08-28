describe('Formulas -> text functions', () => {
  var id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('CHAR', () => {
    var data = getDataForFormulas(0, 'name', ['=CHAR()', '=CHAR(A1)']);

    data[0].id = 33;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('!');
  });

  it('CLEAN', () => {
    var data = getDataForFormulas(0, 'name', ['=CLEAN()', '=CLEAN(A1)']);

    /* eslint-disable no-tabs */
    data[0].id = '	Monthly report	\n\n'; // tab with new line

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('Monthly report');
  });

  it('CODE', () => {
    var data = getDataForFormulas(0, 'name', ['=CODE()', '=CODE(A1)']);

    data[0].id = '!';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(33);
  });

  it('CONCATENATE', () => {
    var data = getDataForFormulas(0, 'name', ['=CONCATENATE()', '=CONCATENATE(A1, " "&A2, A3)']);

    data[0].id = 'Hello';
    data[1].id = 'world';
    data[2].id = '!';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('Hello world!');
  });

  xit('DOLLAR', () => {
    var data = getDataForFormulas(0, 'name', ['=DOLLAR()', '=DOLLAR(A1, 2)']);

    data[0].id = 1100;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('$1,100.00');
  });

  it('EXACT', () => {
    var data = getDataForFormulas(0, 'name', ['=EXACT()', '=EXACT(A1, 2)', '=EXACT(A1, 1100)']);

    data[0].id = 1100;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(false);
    expect(hot.getDataAtCell(2, 1)).toBe(true);
  });

  it('FIND', () => {
    var data = getDataForFormulas(0, 'name', ['=FIND()', '=FIND(A1, C1)']);

    data[0].id = 'k';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(4);
  });

  xit('FIXED', () => {
    var data = getDataForFormulas(0, 'name', ['=FIXED()', '=FIXED(12345.11, 0)']);

    data[0].id = 'k';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('12,345');
  });

  it('LEFT', () => {
    var data = getDataForFormulas(0, 'name', ['=LEFT()', '=LEFT(A1, 4)']);

    data[0].id = 'Foo Bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('Foo ');
  });

  it('LEN', () => {
    var data = getDataForFormulas(0, 'name', ['=LEN()', '=LEN(A1)']);

    data[0].id = 'Foo Bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 1)).toBe(7);
  });

  it('LOWER', () => {
    var data = getDataForFormulas(0, 'name', ['=LOWER()', '=LOWER(A1)']);

    data[0].id = 'Foo Bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('foo bar');
  });

  it('MID', () => {
    var data = getDataForFormulas(0, 'name', ['=MID()', '=MID(A1, 2, 5)']);

    data[0].id = 'Foo Bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('oo Ba');
  });

  it('PROPER', () => {
    var data = getDataForFormulas(0, 'name', ['=PROPER()', '=PROPER(A1)', '=PROPER(A2)']);

    data[0].id = 'foo bar';
    data[1].id = true;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('Foo Bar');
    expect(hot.getDataAtCell(2, 1)).toBe('True');
  });

  it('REGEXEXTRACT', () => {
    var data = getDataForFormulas(0, 'name', ['=REGEXEXTRACT()', '=REGEXEXTRACT(A1, "(foo)")']);

    data[0].id = 'extract foo bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe('foo');
  });

  it('REGEXREPLACE', () => {
    var data = getDataForFormulas(0, 'name', ['=REGEXREPLACE()', '=REGEXREPLACE(A1, "(foo)", A2)']);

    data[0].id = 'extract foo bar';
    data[1].id = 'baz';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe('extract baz bar');
  });

  it('REGEXMATCH', () => {
    var data = getDataForFormulas(0, 'name', ['=REGEXMATCH()', '=REGEXMATCH(A1, "([0-9]+.[0-9]+)")']);

    data[0].id = 'pressure 12.21bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(true);
  });

  it('REPLACE', () => {
    var data = getDataForFormulas(0, 'name', ['=REPLACE()', '=REPLACE(A1, 2, 5, "*")']);

    data[0].id = 'foo bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('f*r');
  });

  it('REPT', () => {
    var data = getDataForFormulas(0, 'name', ['=REPT()', '=REPT(A1, 5)']);

    data[0].id = 'foo';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('foofoofoofoofoo');
  });

  it('RIGHT', () => {
    var data = getDataForFormulas(0, 'name', ['=RIGHT()', '=RIGHT(A1, 4)']);

    data[0].id = 'foo bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(' bar');
  });

  it('SEARCH', () => {
    var data = getDataForFormulas(0, 'name', ['=SEARCH()', '=SEARCH(A2, A1)']);

    data[0].id = 'foo bar';
    data[1].id = 'bar';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe(5);
  });

  it('SPLIT', () => {
    var data = getDataForFormulas(0, 'name', ['=SPLIT()', '=SPLIT(A1)', '=SPLIT(A2, ".")']);

    data[0].id = 'foo bar baz';
    data[1].id = 'foo.bar.b.az';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 1)).toEqual(['foo bar baz']);
    expect(hot.getDataAtCell(2, 1)).toEqual(['foo', 'bar', 'b', 'az']);
  });

  it('SUBSTITUTE', () => {
    var data = getDataForFormulas(0, 'name', ['=SUBSTITUTE()', '=SUBSTITUTE(A1)', '=SUBSTITUTE(A1, "a", "A")']);

    data[0].id = 'foo bar baz';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(2, 1)).toBe('foo bAr bAz');
  });

  it('T', () => {
    var data = getDataForFormulas(0, 'name', ['=T()', '=T(A1)', '=T(A2)']);

    data[0].id = 'foo bar baz';
    data[1].id = 9.66;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('foo bar baz');
    expect(hot.getDataAtCell(2, 1)).toBe('');
  });

  xit('TEXT', () => {
    var data = getDataForFormulas(0, 'name', ['=TEXT()', '=TEXT(A1, "####.#")']);

    data[0].id = '1234.99';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe('1235.0');
  });

  it('TRIM', () => {
    var data = getDataForFormulas(0, 'name', ['=TRIM()', '=TRIM(A1)']);

    data[0].id = '   foo  ';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('foo');
  });

  it('UNICHAR', () => {
    var data = getDataForFormulas(0, 'name', ['=UNICHAR()', '=UNICHAR(A1)']);

    data[0].id = 33;

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('!');
  });

  it('UNICODE', () => {
    var data = getDataForFormulas(0, 'name', ['=UNICODE()', '=UNICODE(A1)']);

    data[0].id = '!';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#N/A');
    expect(hot.getDataAtCell(1, 1)).toBe(33);
  });

  it('UPPER', () => {
    var data = getDataForFormulas(0, 'name', ['=UPPER()', '=UPPER(A1)']);

    data[0].id = 'Foo bAr';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe('FOO BAR');
  });

  xit('VALUE', () => {
    var data = getDataForFormulas(0, 'name', ['=VALUE()', '=VALUE(A1)', '=VALUE(A2)']);

    data[0].id = '$1,000';
    data[1].id = 'foo';

    var hot = handsontable({
      data: data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('#VALUE!');
    expect(hot.getDataAtCell(1, 1)).toBe(1000);
    expect(hot.getDataAtCell(2, 1)).toBe(0);
  });
});
