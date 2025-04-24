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

  it('should contain down arrow glyph', async() => {
    const onAfterValidate = jasmine.createSpy('onAfterValidate');

    handsontable({
      type: 'autocomplete',
      afterValidate: onAfterValidate
    });

    await setDataAtCell(2, 2, 'string');
    await sleep(100);

    const html = getCell(2, 2).innerHTML;

    expect(html).toContain('string');
    expect(html).toContain('\u25BC');
  });

  it('should open cell editor after clicking on arrow glyph', async() => {
    handsontable({
      renderer: 'autocomplete'
    });

    await selectCell(0, 0);

    expect(getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should open cell editor after clicking on arrow glyph, after the table has been destroyed and reinitialized (#1367)', async() => {
    handsontable({
      renderer: 'autocomplete'
    });

    destroy();

    handsontable({
      renderer: 'autocomplete'
    });

    await selectCell(0, 0);

    expect(getActiveEditor().isOpened()).toBe(false);

    $(getCell(0, 0)).find('.htAutocompleteArrow').simulate('mousedown');

    expect(getActiveEditor().isOpened()).toBe(true);
  });

  it('should prepend the autocomplete arrow at the start of the cell element (#5124)', async() => {
    handsontable({
      renderer: 'autocomplete'
    });

    const $contents = $(getCell(0, 0)).contents();

    expect($contents.eq(0).hasClass('htAutocompleteArrow')).toBe(true);
  });

  it('should render the cell without messing with "dir" attribute', async() => {
    handsontable({
      data: [['foo']],
      renderer: 'autocomplete'
    });

    expect(getCell(0, 0).getAttribute('dir')).toBeNull();
  });
});
