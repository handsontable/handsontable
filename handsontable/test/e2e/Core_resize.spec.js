describe('Core resize', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$wrapper = $('<div style=""></div>').css({ overflow: 'auto' });
    this.$container = $(`<div id="${id}"></div>`);

    this.$wrapper.append(this.$container);
    this.$wrapper.appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    if (this.$wrapper) {
      destroy();
      this.$wrapper.remove();
    }
  });

  it('should not change table height after window is resized when a handsontable parent elements have not defined height', async() => {
    handsontable({
      data: createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    await refreshDimensions();

    expect(getMaster().height()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getBottomClone().height()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);
    expect(getBottomInlineStartClone().height()).toBe(0);
  });

  it('should not change table height after window is resized when a handsontable parent elements have not defined height and has overflow scroll', async() => {
    spec().$wrapper.css({ overflow: 'scroll' });

    handsontable({
      data: createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    await refreshDimensions();

    expect(getMaster().height()).toBe(0);
    expect(getTopClone().height()).toBe(0);
    expect(getBottomClone().height()).toBe(0);
    expect(getInlineStartClone().height()).toBe(0);
    expect(getBottomInlineStartClone().height()).toBe(0);
  });

  it('should change table height after changing parent element height', async() => {
    handsontable({
      data: createSpreadsheetData(10, 2),
      rowHeaders: true,
      colHeaders: true,
      fixedRowsBottom: 1,
    });

    spec().$wrapper.css('height', 200);
    hot().render();

    expect(getInlineStartClone().height()).toBe(200);
    expect(getMaster().height()).toBe(200);
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      // col header row: calcColHeaderHeight(t) + 1px top border
      classic.toBe(calcColHeaderHeight('classic') + 1);
      main.toBe(calcColHeaderHeight('main') + 1);
      horizon.toBe(calcColHeaderHeight('horizon') + 1);
    });
    expect(getBottomClone().height()).forThemes(({ classic, main, horizon }) => {
      // 1 fixed bottom row: calcRowHeight(t) + 1px extra border
      classic.toBe(calcRowHeight('classic') + 1);
      main.toBe(calcRowHeight('main') + 1);
      horizon.toBe(calcRowHeight('horizon') + 1);
    });
    expect(getBottomInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      // 1 fixed bottom row: calcRowHeight(t) + 1px extra border
      classic.toBe(calcRowHeight('classic') + 1);
      main.toBe(calcRowHeight('main') + 1);
      horizon.toBe(calcRowHeight('horizon') + 1);
    });

    await refreshDimensions();

    expect(getMaster().height()).toBe(200);
    expect(getInlineStartClone().height()).toBe(200);
    expect(getTopClone().height()).forThemes(({ classic, main, horizon }) => {
      // col header row: calcColHeaderHeight(t) + 1px top border
      classic.toBe(calcColHeaderHeight('classic') + 1);
      main.toBe(calcColHeaderHeight('main') + 1);
      horizon.toBe(calcColHeaderHeight('horizon') + 1);
    });
    expect(getBottomClone().height()).forThemes(({ classic, main, horizon }) => {
      // 1 fixed bottom row: calcRowHeight(t) + 1px extra border
      classic.toBe(calcRowHeight('classic') + 1);
      main.toBe(calcRowHeight('main') + 1);
      horizon.toBe(calcRowHeight('horizon') + 1);
    });
    expect(getBottomInlineStartClone().height()).forThemes(({ classic, main, horizon }) => {
      // 1 fixed bottom row: calcRowHeight(t) + 1px extra border
      classic.toBe(calcRowHeight('classic') + 1);
      main.toBe(calcRowHeight('main') + 1);
      horizon.toBe(calcRowHeight('horizon') + 1);
    });
  });
});
