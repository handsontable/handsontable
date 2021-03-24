describe('Formulas -> math trig functions', () => {
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

  it('UNIQUE', () => {
    const data = getDataForFormulas(0, 'name', ['=UNIQUE()', '=UNIQUE(1, 2, 3, 4, 4, 4, 4, 3)']);

    data[0].id = -2.2;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toEqual([]);
    expect(hot.getDataAtCell(1, 1)).toEqual([1, 2, 3, 4]);
  });

  it('ARGS2ARRAY', () => {
    const data = getDataForFormulas(0, 'name', ['=ARGS2ARRAY()', '=ARGS2ARRAY(1, 2, 3, 4, 4, 4, 4, 3)']);

    data[0].id = -2.2;
    data[1].id = 3;

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 1)).toEqual([]);
    expect(hot.getDataAtCell(1, 1)).toEqual([1, 2, 3, 4, 4, 4, 4, 3]);
  });

  it('FLATTEN', () => {
    const data = getDataForFormulas(0, 'address', ['=FLATTEN()', '=FLATTEN(A1:B3)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 'Nannie Patel', 2, 'Leanne Ware', 3, 'Mathis Boone']);
  });

  it('JOIN', () => {
    const data = getDataForFormulas(0, 'address', ['=JOIN()', '=JOIN(A1:B3)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 'Nannie Patel', 2, 'Leanne Ware', 3, 'Mathis Boone'].join(','));
  });

  it('NUMBERS', () => {
    const data = getDataForFormulas(0, 'address', ['=NUMBERS()', '=NUMBERS(A1:B3)']);

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toEqual([]);
    expect(hot.getDataAtCell(1, 2)).toEqual([1, 2, 3]);
  });

  it('REFERENCE', () => {
    const data = getDataForFormulas(0, 'address', ['=REFERENCE()', '=REFERENCE(A1, "name.firstName")']);

    data[0].id = { name: { firstName: 'Jim' } };

    const hot = handsontable({
      data,
      columns: getColumnsForFormulas(),
      formulas: true,
      width: 500,
      height: 300
    });

    expect(hot.getDataAtCell(0, 2)).toBe('#ERROR!');
    expect(hot.getDataAtCell(1, 2)).toBe('Jim');
  });
});
