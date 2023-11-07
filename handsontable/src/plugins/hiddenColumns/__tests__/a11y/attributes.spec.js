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

  it('should assign the `aria-label` attribute to the indicators in the headers before and after hidden columns', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(1, 5),
      hiddenColumns: {
        columns: [1, 3],
        indicators: true,
      },
      colHeaders: true,
    });
    const dictionaryKeys = Handsontable.languages.dictionaryKeys;
    const getIndicator = (parentEl, direction) => {
      return direction === 'after' ?
        parentEl.querySelector('.afterHiddenColumnIndicator')
        : parentEl.querySelector('.beforeHiddenColumnIndicator');
    };

    expect(getIndicator(getCell(-1, 0), 'before').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_BEFORE_HIDDEN_COLUMN)
    );
    expect(getIndicator(getCell(-1, 2), 'before').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_BEFORE_HIDDEN_COLUMN)
    );
    expect(getIndicator(getCell(-1, 2), 'after').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_AFTER_HIDDEN_COLUMN)
    );
    expect(getIndicator(getCell(-1, 4), 'after').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.COLUMN_HEADER_LABEL_AFTER_HIDDEN_COLUMN)
    );
  });
});
