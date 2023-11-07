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

  it('should assign the `aria-label` attribute to the indicators in the headers before and after hidden rows', async() => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 1),
      hiddenRows: {
        rows: [1, 3],
        indicators: true,
      },
      rowHeaders: true,
    });
    const dictionaryKeys = Handsontable.languages.dictionaryKeys;
    const getIndicator = (parentEl, direction) => {
      return direction === 'after' ?
        parentEl.querySelector('.afterHiddenRowIndicator')
        : parentEl.querySelector('.beforeHiddenRowIndicator');
    };

    expect(getIndicator(getCell(0, -1), 'before').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.ROW_HEADER_LABEL_BEFORE_HIDDEN_ROW)
    );
    expect(getIndicator(getCell(2, -1), 'before').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.ROW_HEADER_LABEL_BEFORE_HIDDEN_ROW)
    );
    expect(getIndicator(getCell(2, -1), 'after').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.ROW_HEADER_LABEL_AFTER_HIDDEN_ROW)
    );
    expect(getIndicator(getCell(4, -1), 'after').getAttribute('aria-label')).toEqual(
      hot.getTranslatedPhrase(dictionaryKeys.ROW_HEADER_LABEL_AFTER_HIDDEN_ROW)
    );
  });
});
