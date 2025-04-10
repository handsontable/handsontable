describe('Focus selection scroll', () => {
  const id = 'testContainer';
  let scrollIntoViewSpy;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    scrollIntoViewSpy = spyOn(Element.prototype, 'scrollIntoView');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should scroll the viewport vertically', async() => {
    // the viewport height shows exactly 4 rows + 1 header row + 15px (scrollbar) + 1px (border top)
    const height = getDefaultColumnHeaderHeight() + (4 * getDefaultRowHeight()) + 16;

    handsontable({
      data: createSpreadsheetData(50, 5),
      width: 200,
      height,
      navigableHeaders: true,
      rowHeaders: true,
      colHeaders: true,
    });

    selectColumns(1, 1, -1);
    listen();
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter');
    keyDownUp('enter'); // B4

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(3, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp('enter'); // B5

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight() + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(4, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp('enter'); // B6

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe((getDefaultRowHeight() * 2) + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(5, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'enter']); // B5
    keyDownUp(['shift', 'enter']); // B4

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe((getDefaultRowHeight() * 2) + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(3, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'enter']); // B3

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight() * 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(2, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'enter']); // B2

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight());
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'enter']); // B1

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'enter']); // B50

    await sleep(20);

    expect(topOverlay().getScrollPosition()).toBe((getDefaultRowHeight() * 46) + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(49, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('should scroll the viewport horizontally', async() => {
    // the viewport width shows exactly 4 columns + 1 header col + 15px (scrollbar) + 1px (border left)
    const colWidths = 60;
    const width = getDefaultRowHeaderWidth() + (4 * colWidths) + 16;

    handsontable({
      data: createSpreadsheetData(5, 50),
      width,
      height: 130,
      colWidths,
      navigableHeaders: true,
      rowHeaders: true,
      colHeaders: true,
    });

    selectRows(1, 1, -1);
    listen();
    keyDownUp('tab');
    keyDownUp('tab');
    keyDownUp('tab');
    keyDownUp('tab'); // D2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, -1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(1, 3, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp('tab'); // E2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(colWidths);
      main.toBe(colWidths + 1); // +1 for border left
      horizon.toBe(colWidths + 1); // +1 for border left
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 4, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp('tab'); // F2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(colWidths * 2);
      main.toBe((colWidths * 2) + 1); // +1 for border left
      horizon.toBe((colWidths * 2) + 1); // +1 for border left
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 5, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'tab']); // E2
    keyDownUp(['shift', 'tab']); // D2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(colWidths * 2);
      main.toBe((colWidths * 2) + 1); // +1 for border left
      horizon.toBe((colWidths * 2) + 1); // +1 for border left
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 3, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'tab']); // C2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(colWidths * 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 2, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'tab']); // B2
    keyDownUp(['shift', 'tab']); // A2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 0, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    keyDownUp(['shift', 'tab']); // AX2

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(colWidths * 46);
      main.toBe((colWidths * 46) + 1); // +1 for border left
      horizon.toBe((colWidths * 46) + 1); // +1 for border left
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 49, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
