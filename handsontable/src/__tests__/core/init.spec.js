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

  it('should rerender the table after changing the `display` property to anything other than `none` on the root' +
    ' element if it was initialized with `display: none` with inline styles', async() => {
    const initialDisplayValue = spec().$container.css('display');

    spec().$container.css('display', 'none');

    const hot = handsontable({
      data: createSpreadsheetData(15, 15),
      rowHeaders: true,
      colHeaders: true,
      stretchH: 'all'
    });

    // Make sure the table is not visible.
    expect(hot.rootElement.offsetParent).toEqual(null);

    spec().$container.css('display', initialDisplayValue);

    await waitForNextAnimationFrames(2);

    const $topHolderElement = getTopClone().find('.wtHolder');
    const $testTopHeader = $(hot.getCell(-1, 0, true));

    expect($topHolderElement.height()).toBeGreaterThanOrEqual($testTopHeader.height());
    expect(
      [...Array(15).keys()].map(index => $(hot.getCell(-1, index, true)).outerWidth())
    ).toEqual(
      [...Array(15).keys()].map(index => $(hot.getCell(0, index, true)).outerWidth())
    );
    expect($topHolderElement.outerWidth()).toBe(getTopClone().find('.htCore').outerWidth());
  });

  it('should rerender the table after changing the `display` property to anything other than `none` on the root' +
    ' element\'s parent if it was initialized with `display: none` with inline styles', async() => {
    const $testParentContainer = $('<div id="test-parent-container"></div>');

    $('body').append($testParentContainer);

    spec().$container.detach();

    $testParentContainer.append(spec().$container);

    $testParentContainer.css('display', 'none');

    const hot = handsontable({
      data: createSpreadsheetData(15, 15),
      rowHeaders: true,
      colHeaders: true,
      stretchH: 'all'
    });

    // Make sure the table is not visible.
    expect(hot.rootElement.offsetParent).toEqual(null);

    $testParentContainer.css('display', 'block');

    await waitForNextAnimationFrames(2);

    const $topHolderElement = getTopClone().find('.wtHolder');
    const $testTopHeader = $(hot.getCell(-1, 0, true));

    expect($topHolderElement.height()).toBeGreaterThanOrEqual($testTopHeader.height());
    expect(
      [...Array(15).keys()].map(index => $(hot.getCell(-1, index, true)).outerWidth())
    ).toEqual(
      [...Array(15).keys()].map(index => $(hot.getCell(0, index, true)).outerWidth())
    );
    expect($topHolderElement.outerWidth()).toBe(getTopClone().find('.htCore').outerWidth());

    spec().$container.detach();
    $('body').append(spec().$container);
    $testParentContainer.remove();
  });

  it('should rerender the table after changing the `display` property to anything other than `none` on the root' +
    ' element if it was initialized with `display: none` using the stylesheet', async() => {
    const $style = $('<style>#test-hot {display: none;}</style>').appendTo('head');

    spec().$container.attr('id', 'test-hot');

    const hot = handsontable({
      data: createSpreadsheetData(15, 15),
      rowHeaders: true,
      colHeaders: true,
      stretchH: 'all'
    });

    // Make sure the table is not visible.
    expect(hot.rootElement.offsetParent).toEqual(null);

    spec().$container.css('display', 'block');

    await waitForNextAnimationFrames(2);

    const $topHolderElement = getTopClone().find('.wtHolder');
    const $testTopHeader = $(hot.getCell(-1, 0, true));

    expect($topHolderElement.height()).toBeGreaterThanOrEqual($testTopHeader.height());
    expect(
      [...Array(15).keys()].map(index => $(hot.getCell(-1, index, true)).outerWidth())
    ).toEqual(
      [...Array(15).keys()].map(index => $(hot.getCell(0, index, true)).outerWidth())
    );
    expect($topHolderElement.outerWidth()).toBe(getTopClone().find('.htCore').outerWidth());

    $style.remove();
  });

  it('should rerender the table after changing the `display` property to anything other than `none` on the root' +
    ' element\'s parent if it was initialized with `display: none` with a stylesheet', async() => {
    const $style = $('<style>#test-parent-container {display: none;}</style>').appendTo('head');
    const $testParentContainer = $('<div id="test-parent-container"></div>');

    $('body').append($testParentContainer);

    spec().$container.detach();

    $testParentContainer.append(spec().$container);

    const hot = handsontable({
      data: createSpreadsheetData(15, 15),
      rowHeaders: true,
      colHeaders: true,
      stretchH: 'all'
    });

    // Make sure the table is not visible.
    expect(hot.rootElement.offsetParent).toEqual(null);

    $testParentContainer.css('display', 'block');

    await waitForNextAnimationFrames(2);

    const $topHolderElement = getTopClone().find('.wtHolder');
    const $testTopHeader = $(hot.getCell(-1, 0, true));

    expect($topHolderElement.height()).toBeGreaterThanOrEqual($testTopHeader.height());
    expect(
      [...Array(15).keys()].map(index => $(hot.getCell(-1, index, true)).outerWidth())
    ).toEqual(
      [...Array(15).keys()].map(index => $(hot.getCell(0, index, true)).outerWidth())
    );
    expect($topHolderElement.outerWidth()).toBe(getTopClone().find('.htCore').outerWidth());

    spec().$container.detach();
    $('body').append(spec().$container);
    $testParentContainer.remove();
    $style.remove();
  });

  it('should keep the viewport scrollable when the table is initialized on a detached element ' +
    'and attached to the DOM in `afterInit`', async() => {
    // Regression: with the documented "build on a detached container, attach it in `afterInit`"
    // pattern, the scrollable element was resolved at construction time against a detached parent
    // (which reports an empty computed `overflow`) and fell back to the window. The scroll listener
    // and the container ResizeObserver were therefore never bound to the holder, so scrolling
    // rendered nothing below the initially visible rows.
    spec().$container.remove();

    const example = $(`<div id="${id}"></div>`).appendTo('body')[0];
    const container = document.createElement('div');

    const hot = new Handsontable(container, {
      data: createSpreadsheetData(100, 100),
      width: 200,
      height: 100,
      afterInit() {
        example.appendChild(container);
        this.render();
      }
    });

    setCurrentHotInstance(hot);
    spec().$container = $(example);

    await waitForNextAnimationFrames(2);

    const holder = hot.view._wt.wtTable.holder;

    // The scrollable element must be re-resolved to the holder once the table is attached,
    // instead of remaining the window it fell back to while detached.
    expect(hot.view._wt.wtOverlays.scrollableElement).not.toBe(hot.rootWindow);
    expect(hot.view._wt.wtOverlays.scrollableElement).toBe(holder);

    // Scrolling the holder must render rows below the initial viewport.
    const lastRenderedRowBeforeScroll = hot.view._wt.wtTable.getLastRenderedRow();

    holder.scrollTop = 1500;

    await sleep(100);

    expect(hot.view._wt.wtTable.getLastRenderedRow()).toBeGreaterThan(lastRenderedRowBeforeScroll);
  });

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
