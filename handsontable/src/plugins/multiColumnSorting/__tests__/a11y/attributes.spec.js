describe('a11y DOM attributes (ARIA tags)', () => {
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

  it('should add the `aria-sort` attribute to a sortable header and change its value after sorting', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      nestedRows: true,
      multiColumnSorting: true,
    });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    getPlugin('multiColumnSorting').sort([{
      column: 1, sortOrder: 'asc'
    }, {
      column: 0, sortOrder: 'desc'
    }]);

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('descending');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('ascending');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('ascending');
  });
});
