describe('Core.sanitizer', () => {
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

  it('should sanitize row header content', async() => {
    const sanitizer = jasmine.createSpy('sanitizer')
      .and
      .callFake(content => content.replace(/<danger\/>/g, ''));

    handsontable({
      data: createSpreadsheetData(1, 1),
      sanitizer,
      rowHeaders: ['<danger/> tag'],
    });

    expect(getRenderedValue(0, -1))
      .toBe('<div class="relative"><span class="rowHeader"> tag</span></div>');
    expect(sanitizer).toHaveBeenCalledWith('<danger/> tag', 'innerHTML');
  });

  it('should sanitize column header content', async() => {
    const sanitizer = jasmine.createSpy('sanitizer')
      .and
      .callFake(content => content.replace(/<danger\/>/g, ''));

    handsontable({
      data: createSpreadsheetData(1, 1),
      sanitizer,
      colHeaders: ['<danger/> tag'],
    });

    expect(getRenderedValue(-1, 0))
      .toBe('<div class="relative" role="presentation"><span class="colHeader" role="presentation"> tag</span></div>');
    expect(sanitizer).toHaveBeenCalledWith('<danger/> tag', 'innerHTML');
  });
});
