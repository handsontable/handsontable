describe('Core_init', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$parentContainer = $(`<div id="${id}"></div>`).appendTo('body');
    this.$container = $(`<div id="${id}"></div>`).appendTo(this.$parentContainer);
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    this.$parentContainer.remove();
  });

  it('should respect startRows and startCols when no data is provided', async() => {
    spec().$container.remove();
    spec().$container = $(`<div id="${id}"></div>`).appendTo('body');
    handsontable();

    expect(countRows()).toEqual(5); // as given in README.md
    expect(countCols()).toEqual(5); // as given in README.md
  });

  it('should construct when container is not appended to document', async() => {
    spec().$container.remove();
    handsontable();
    expect(getData()).toBeTruthy();
  });

  it('should create an instance when the iframe is a container', async() => {
    const iframe = $('<iframe/>').appendTo(spec().$container);
    const doc = iframe[0].contentDocument;

    doc.open('text/html', 'replace');
    doc.write(`
      <!doctype html>
      <head>
        ${getE2eThemeStylesheetLinkTagsHtml()}
      </head>`);
    doc.close();

    const container = $('<div/>').appendTo(doc.body);

    expect(() => {
      container.handsontable({});
      container.handsontable('destroy');
    }).not.toThrow();
  });

  it('should create table even if is launched inside custom element', async() => {
    const onErrorSpy = spyOn(window, 'onerror');

    spec().$container.remove();
    spec().$container = $(`<hot-table><div id="${id}"></div></hot-table>`).appendTo('body');

    handsontable();

    const cell = spec().$container.find('tr:eq(0) td:eq(1)');

    await mouseOver(cell);
    await mouseDown(cell);

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  // The four "rerender after changing the `display` property" tests were migrated to
  // `tests/e2e/hidden-init-rerender.spec.ts` (DEV-2745) - their `waitForNextAnimationFrames(2)`
  // waits raced IntersectionObserver delivery, which is not frame-bound (DEV-2668's Flake 4).

  describe('theme initialization', () => {
    it('should enable a theme when a theme class name was added to the root element', async() => {
      simulateModernThemeStylesheet(spec().$container);
      spec().$container.addClass('ht-theme-sth');

      handsontable({
        data: createSpreadsheetData(15, 15),
      }, true);

      expect(getCurrentThemeName()).toBe('ht-theme-sth');
    });

    it('should enable a theme when a theme class name was added to a parent of the root element', async() => {
      simulateModernThemeStylesheet(spec().$container);
      spec().$parentContainer.addClass('ht-theme-sth');

      const hot = handsontable({
        data: createSpreadsheetData(15, 15),
      }, true);

      expect(getCurrentThemeName()).toBe('ht-theme-sth');
      expect($(hot.rootWrapperElement).hasClass('ht-theme-sth')).toBe(true);
    });
  });
});
