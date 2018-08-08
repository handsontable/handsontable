describe('Core.colToProp', () => {
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

  it('should return the property name for the provided column number', () => {
    handsontable({
      data: [{
        id: 1,
        firstName: 'Tobias',
        lastName: 'Forge'
      }]
    });

    expect(colToProp(0)).toBe('id');
    expect(colToProp(1)).toBe('firstName');
    expect(colToProp(2)).toBe('lastName');
  });

  it('it should return the provided property name, when the user passes a property name as a column number', () => {
    handsontable({
      data: [{
        id: 1,
        sort: true,
        length: 2
      }]
    });

    expect(colToProp('id')).toBe('id');
    expect(colToProp('sort')).toBe('sort');
    expect(colToProp('length')).toBe('length');
  });
});
