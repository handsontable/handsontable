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

  it('should sanitize nested header content using the same context as plain headers', async() => {
    const sanitizer = jasmine.createSpy('sanitizer')
      .and
      .callFake(content => content.replace(/<danger\/>/g, ''));

    handsontable({
      data: createSpreadsheetData(1, 2),
      colHeaders: true,
      nestedHeaders: [
        [{ label: '<danger/> group', colspan: 2 }],
        ['A', 'B'],
      ],
      sanitizer,
    });

    expect(getRenderedValue(-2, 0)).toBe('<div class="relative" role="presentation">' +
      '<span class="colHeader" role="presentation"> group</span></div>');
    expect(sanitizer).toHaveBeenCalledWith('<danger/> group', 'header');
    // The ghost table measures the very same label. It used to pass `'innerHTML'`, which made a
    // context-aware sanitizer apply one rule set to the rendered header and another to its copy.
    expect(sanitizer.calls.allArgs().map(([, context]) => context)).not.toContain('innerHTML');
  });

  it('should warn once when both nested headers and column headers contain HTML', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: createSpreadsheetData(1, 2),
      colHeaders: ['<b>A</b>', '<b>B</b>'],
      nestedHeaders: [
        [{ label: '<i>group</i>', colspan: 2 }],
        ['<b>A</b>', '<b>B</b>'],
      ],
    });

    expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/without a sanitizer/));
    // The rendered headers and the ghost table that measures them are separate write surfaces.
    // They must share one "warn once" scope, or a single grid reports the same problem twice.
    expect(warnSpy.calls.count()).toBe(1);
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
