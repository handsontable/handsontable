describe('Formulas -> text functions', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('CHAR', () => {
    const data = getDataForFormulas(0, 'name', ['=CHAR(A1)']);

    data[0].id = 33;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('!');
  });

  xit('CLEAN', () => {
    const data = getDataForFormulas(0, 'name', ['=CLEAN()', '=CLEAN(A1)']);

    /* eslint-disable no-tabs */
    data[0].id = '	Monthly report	\n\n'; // tab with new line

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('Monthly report');
  });

  it('CODE', () => {
    const data = getDataForFormulas(0, 'name', ['=CODE(A1)']);

    data[0].id = '!';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(33);
  });

  it('CONCATENATE', () => {
    const data = getDataForFormulas(0, 'name', ['=CONCATENATE()', '=CONCATENATE(A1, " "&A2, A3)']);

    data[0].id = 'Hello';
    data[1].id = 'world';
    data[2].id = '!';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('Hello world!');
  });

  xit('DOLLAR', () => {
    const data = getDataForFormulas(0, 'name', ['=DOLLAR(A1, 2)']);

    data[0].id = 1100;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('$1,100.00');
  });

  xit('EXACT', () => {
    const data = getDataForFormulas(0, 'name', ['=EXACT(A1, 2)', '=EXACT(A1, 1100)']);

    data[0].id = 1100;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(false);
    expect(hot.getDataAtCell(2, 1)).toBe(true);
  });

  xit('FIND', () => {
    const data = getDataForFormulas(0, 'name', ['=FIND()', '=FIND(A1, C1)']);

    data[0].id = 'k';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(4);
  });

  xit('FIXED', () => {
    const data = getDataForFormulas(0, 'name', ['=FIXED(12345.11, 0)']);

    data[0].id = 'k';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('12,345');
  });

  xit('LEFT', () => {
    const data = getDataForFormulas(0, 'name', ['=LEFT(A1, 4)']);

    data[0].id = 'Foo Bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('Foo ');
  });

  xit('LEN', () => {
    const data = getDataForFormulas(0, 'name', ['=LEN(A1)']);

    data[0].id = 'Foo Bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(7);
  });

  xit('LOWER', () => {
    const data = getDataForFormulas(0, 'name', ['=LOWER(A1)']);

    data[0].id = 'Foo Bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo bar');
  });

  xit('MID', () => {
    const data = getDataForFormulas(0, 'name', ['=MID(A1, 2, 5)']);

    data[0].id = 'Foo Bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('oo Ba');
  });

  xit('PROPER', () => {
    const data = getDataForFormulas(0, 'name', ['=PROPER(A1)', '=PROPER(A2)']);

    data[0].id = 'foo bar';
    data[1].id = true;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('Foo Bar');
    expect(hot.getDataAtCell(1, 1)).toBe('True');
  });

  xit('REGEXEXTRACT', () => {
    const data = getDataForFormulas(0, 'name', ['=REGEXEXTRACT(A1, "(foo)")']);

    data[0].id = 'extract foo bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
  });

  xit('REGEXREPLACE', () => {
    const data = getDataForFormulas(0, 'name', ['=REGEXREPLACE(A1, "(foo)", A2)']);

    data[0].id = 'extract foo bar';
    data[1].id = 'baz';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('extract baz bar');
  });

  xit('REGEXMATCH', () => {
    const data = getDataForFormulas(0, 'name', ['=REGEXMATCH(A1, "([0-9]+.[0-9]+)")']);

    data[0].id = 'pressure 12.21bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(true);
  });

  xit('REPLACE', () => {
    const data = getDataForFormulas(0, 'name', ['=REPLACE(A1, 2, 5, "*")']);

    data[0].id = 'foo bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('f*r');
  });

  xit('REPT', () => {
    const data = getDataForFormulas(0, 'name', ['=REPT(A1, 5)']);

    data[0].id = 'foo';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foofoofoofoofoo');
  });

  xit('RIGHT', () => {
    const data = getDataForFormulas(0, 'name', ['=RIGHT(A1, 4)']);

    data[0].id = 'foo bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(' bar');
  });

  xit('SEARCH', () => {
    const data = getDataForFormulas(0, 'name', ['=SEARCH(A2, A1)']);

    data[0].id = 'foo bar';
    data[1].id = 'bar';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(5);
  });

  xit('SPLIT', () => { // TODO: seems to not be working properly
    const data = getDataForFormulas(0, 'name', ['=SPLxit(A1)', '=SPLxit(A2, ".")']);

    data[0].id = 'foo bar baz';
    data[1].id = 'foo.bar.b.az';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toEqual(['foo bar baz']);
    expect(hot.getDataAtCell(2, 1)).toEqual(['foo', 'bar', 'b', 'az']);
  });

  xit('SUBSTITUTE', () => {
    const data = getDataForFormulas(0, 'name', ['=SUBSTITUTE(A1, "a", "A")']);

    data[0].id = 'foo bar baz';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo bAr bAz');
  });

  xit('T', () => {
    const data = getDataForFormulas(0, 'name', ['=T()', '=T(A1)', '=T(A2)']);

    data[0].id = 'foo bar baz';
    data[1].id = 9.66;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('');
    expect(hot.getDataAtCell(1, 1)).toBe('foo bar baz');
    expect(hot.getDataAtCell(2, 1)).toBe('');
  });

  it('TEXT', () => {
    const data = getDataForFormulas(0, 'name', ['=TEXT(A1, "0%")']);

    data[0].id = '99';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('99%');
  });

  xit('TRIM', () => {
    const data = getDataForFormulas(0, 'name', ['=TRIM(A1)']);

    data[0].id = '   foo  ';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('foo');
  });

  xit('UNICHAR', () => {
    const data = getDataForFormulas(0, 'name', ['=UNICHAR(A1)']);

    data[0].id = 33;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('!');
  });

  xit('UNICODE', () => {
    const data = getDataForFormulas(0, 'name', ['=UNICODE(A1)']);

    data[0].id = '!';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(33);
  });

  xit('UPPER', () => {
    const data = getDataForFormulas(0, 'name', ['=UPPER(A1)']);

    data[0].id = 'Foo bAr';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe('FOO BAR');
  });

  xit('VALUE', () => {
    const data = getDataForFormulas(0, 'name', ['=VALUE(A1)', '=VALUE(A2)']);

    data[0].id = '$1,000';
    data[1].id = 'foo';

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toBe(1000);
    expect(hot.getDataAtCell(1, 1)).toBe(0);
  });
});
