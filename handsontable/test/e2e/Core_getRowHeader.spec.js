describe('Core.getRowHeader', () => {
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
    expect(getRowHeader(1)).toEqual(void 0);
  });

  it('when configured as true, should return the index incremented by 1', () => {
    handsontable({
      rowHeaders: true
    });
    expect(getRowHeader(1)).toEqual(2);
  });

  it('when configured as array, should return value at index', () => {
    handsontable({
      rowHeaders: ['One', 'Two', 'Three', 'Four', 'Five']
    });
    expect(getRowHeader(1)).toEqual('Two');
  });

  it('when configured as function, should return function output', () => {
    handsontable({
      rowHeaders(index) {
        return `row${index}`;
      }
    });
    expect(getRowHeader(1)).toEqual('row1');
  });

  it('when configured as static value, should return the value', () => {
    handsontable({
      rowHeaders: 'static'
    });
    expect(getRowHeader(1)).toEqual('static');
  });

  it('when configured as HTML value, should render that as HTML', () => {
    handsontable({
      rowHeaders(index) {
        return `<b>row${index}</b>`;
      }
    });
    expect(getRowHeader(1)).toEqual('<b>row1</b>');
  });

  it('when no argument given, should return as much row headers as there are rows', () => {
    handsontable({
      rowHeaders: true,
      startRows: 3
    });
    expect(getRowHeader()).toEqual([1, 2, 3]);
  });
});
