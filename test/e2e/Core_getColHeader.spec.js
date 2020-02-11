describe('Core.getColHeader', () => {
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

  it('when not configured, should return undefined', () => {
    handsontable();
    expect(getColHeader(1)).toBe(null);
  });

  it('when configured as true, should return the Excel-style column title', () => {
    handsontable({
      colHeaders: true
    });
    expect(getColHeader(30)).toEqual('AE');
  });

  it('when configured as array, should return value at index', () => {
    handsontable({
      colHeaders: ['One', 'Two', 'Three', 'Four', 'Five']
    });
    expect(getColHeader(1)).toEqual('Two');
  });

  it('when configured as function, should return function output', () => {
    handsontable({
      colHeaders(index) {
        return `col${index}`;
      }
    });
    expect(getColHeader(1)).toEqual('col1');
  });

  it('when configured as static value, should return the value', () => {
    handsontable({
      colHeaders: 'static'
    });
    expect(getColHeader(1)).toEqual('static');
  });

  it('when configured as HTML value, should render that as HTML', () => {
    handsontable({
      colHeaders(index) {
        return `<b>col${index}</b>`;
      }
    });
    expect(getColHeader(1)).toEqual('<b>col1</b>');
  });

  it('when no argument given, should return as much column headers as there are columns', () => {
    handsontable({
      colHeaders: true,
      startCols: 3
    });
    expect(getColHeader()).toEqual(['A', 'B', 'C']);
  });
});
