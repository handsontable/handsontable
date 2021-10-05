describe('AutocompleteRenderer', () => {
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

  it('should contain down arrow glyph', (done) => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      type: 'autocomplete',
      afterValidate: onAfterValidate
    });
    setDataAtCell(2, 2, 'string');

    setTimeout(() => {
      const html = getCell(2, 2).innerHTML;

      expect(html).toContain('string');
      expect(html).toContain('\u25BC');
      done();
    }, 100);
  });

  it('should open cell editor after clicking on arrow glyph', () => {
    const hot = handsontable({
      type: 'autocomplete'
    });

    selectCell(0, 0);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
  });

  it('should open cell editor after clicking on arrow glyph, after the table has been destroyed and reinitialized (#1367)', () => {
    handsontable({
      type: 'autocomplete'
    });

    destroy();

    const hot = handsontable({
      type: 'autocomplete'
    });

    selectCell(0, 0);

    expect(hot.getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(hot.getActiveEditor().isOpened()).toBe(true);
  });

  it('should prepend the autocomplete arrow at the start of the cell element (#5124)', () => {
    handsontable({
      type: 'autocomplete'
    });

    const $contents = $(getCell(0, 0)).contents();

    expect($contents.eq(0).hasClass('htAutocompleteArrow')).toBe(true);
  });
});
