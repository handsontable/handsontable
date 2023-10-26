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
    });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('ascending');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');

    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'desc' });

    expect(getCell(-1, 0).getAttribute('aria-sort')).toEqual('none');
    expect(getCell(-1, 1).getAttribute('aria-sort')).toEqual('descending');
    expect(getCell(-1, 2).getAttribute('aria-sort')).toEqual('none');
  });

  it('should add the `aria-description` attribute to the sortable column headers', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      nestedRows: true,
      columnSorting: true,
    });
    const dictionaryKeys = Handsontable.languages.dictionaryKeys;

    expect(getCell(-1, 0).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));
    expect(getCell(-1, 1).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));
    expect(getCell(-1, 2).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));

    updateSettings({
      columnSorting: false
    });

    expect(getCell(-1, 0).getAttribute('aria-description')).toEqual(null);
    expect(getCell(-1, 1).getAttribute('aria-description')).toEqual(null);
    expect(getCell(-1, 2).getAttribute('aria-description')).toEqual(null);

    updateSettings({
      columnSorting: true
    });

    expect(getCell(-1, 0).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));
    expect(getCell(-1, 1).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));
    expect(getCell(-1, 2).getAttribute('aria-description'))
      .toEqual(hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_DESCRIPTION_SORT_ROWS));
  });
});
