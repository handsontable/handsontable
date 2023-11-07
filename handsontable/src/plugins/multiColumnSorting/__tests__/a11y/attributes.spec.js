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

  it('should add the `aria-sort` attribute to a sortable header and change its value after sorting', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      nestedRows: true,
      columnSorting: true,
      multiColumnSorting: true,
    });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    hot.getPlugin('multiColumnSorting').sort([{
      column: 1, sortOrder: 'asc'
    }, {
      column: 0, sortOrder: 'desc'
    }]);

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('descending');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('ascending');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    hot.getPlugin('multiColumnSorting').sort({ column: 2, sortOrder: 'asc' });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('ascending');
  });

  it('should remove the `aria-hidden` attribute and add `aria-label` to the sorting indicator elements', () => {
    const getIndicator = parentEl => parentEl.querySelector('.columnSortingIndicator');
    const dictionaryKeys = Handsontable.languages.dictionaryKeys;
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      columnSorting: true,
      multiColumnSorting: true,
    });

    hot.getPlugin('multiColumnSorting').sort([{
      column: 1, sortOrder: 'desc'
    }]);

    expect(getIndicator(getCell(-1, 1)).getAttribute('aria-hidden')).toEqual('true');

    hot.getPlugin('multiColumnSorting').sort([{
      column: 1, sortOrder: 'asc'
    }, {
      column: 0, sortOrder: 'desc'
    }]);

    expect(getIndicator(getCell(-1, 1)).getAttribute('aria-hidden')).toEqual(null);
    expect(getIndicator(getCell(-1, 0)).getAttribute('aria-hidden')).toEqual(null);

    expect(getIndicator(getCell(-1, 1)).getAttribute('aria-label')).toEqual(
      `${hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_MULTI_COLUMN_SORT_ORDER)} 1.`
    );
    expect(getIndicator(getCell(-1, 0)).getAttribute('aria-label')).toEqual(
      `${hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_MULTI_COLUMN_SORT_ORDER)} 2.`
    );
  });
});
