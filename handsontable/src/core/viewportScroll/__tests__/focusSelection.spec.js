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

    await listen();

    await selectColumns(1, 1, -1);
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter');
    await keyDownUp('enter'); // B4

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(2)).toBe(getCell(1, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(3)).toBe(getCell(2, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp('enter'); // B5

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight() + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(4, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp('enter'); // B6

    expect(topOverlay().getScrollPosition()).toBe((getDefaultRowHeight() * 2) + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(5, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'enter']); // B5
    await keyDownUp(['shift', 'enter']); // B4

    expect(topOverlay().getScrollPosition()).toBe((getDefaultRowHeight() * 2) + 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(4, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(3, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'enter']); // B3

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight() * 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(2, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'enter']); // B2

    expect(topOverlay().getScrollPosition()).toBe(getDefaultRowHeight());
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'enter']); // B1

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'enter']); // B50

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

    await listen();

    await selectRows(1, 1, -1);
    await keyDownUp('tab');
    await keyDownUp('tab');
    await keyDownUp('tab');
    await keyDownUp('tab'); // D2

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, -1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(1, 0, true));
    expect(scrollIntoViewSpy.calls.thisFor(2)).toBe(getCell(1, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(3)).toBe(getCell(1, 2, true));
    expect(scrollIntoViewSpy.calls.thisFor(4)).toBe(getCell(1, 3, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp('tab'); // E2

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

    await keyDownUp('tab'); // F2

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

    await keyDownUp(['shift', 'tab']); // E2
    await keyDownUp(['shift', 'tab']); // D2

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(colWidths * 2);
      main.toBe((colWidths * 2) + 1); // +1 for border left
      horizon.toBe((colWidths * 2) + 1); // +1 for border left
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 4, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(1, 3, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'tab']); // C2

    expect(inlineStartOverlay().getScrollPosition()).toBe(colWidths * 2);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 2, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'tab']); // B2
    await keyDownUp(['shift', 'tab']); // A2

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 1, true));
    expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(1, 0, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });

    scrollIntoViewSpy.calls.reset();

    await keyDownUp(['shift', 'tab']); // AX2

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
