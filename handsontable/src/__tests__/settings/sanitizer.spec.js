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
    expect(sanitizer).toHaveBeenCalledWith('<danger/> tag', 'header');
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
    expect(sanitizer).toHaveBeenCalledWith('<danger/> tag', 'header');
  });

  it('should warn once when a column header contains HTML and no sanitizer is configured', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(1, 2),
      colHeaders: ['<b>Bold</b>', '<i>Italic</i>'],
    });

    expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));
    // Multiple HTML headers in the same instance must not stack warnings (once per instance).
    expect(warnSpy.calls.count()).toBe(1);

    // Re-rendering must not emit a second warning.
    warnSpy.calls.reset();
    await render();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should NOT warn when an HTML header is rendered with a sanitizer configured', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(1, 1),
      sanitizer: content => content,
      colHeaders: ['<b>Bold</b>'],
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
