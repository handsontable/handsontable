describe('Focus selection scroll', () => {
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

  it('should scroll the viewport vertically', () => {
    handsontable({
      data: createSpreadsheetData(50, 5),
      width: 200,
      height: 130,
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

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      // 92 row heights - 104 viewport width + 15 scrollbart offset + + 1 selection offset + 1 header border offset
      classic.toBe(5);

      main.toBe(32);
    });

    keyDownUp('enter'); // B5

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(28);
      main.toBe(61);
    });

    keyDownUp('enter'); // B6

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(51);
      main.toBe(90);
    });

    keyDownUp(['shift', 'enter']); // B5
    keyDownUp(['shift', 'enter']); // B4

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(51);
      main.toBe(87);
    });

    keyDownUp(['shift', 'enter']); // B3

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(46);
      main.toBe(58);
    });

    keyDownUp(['shift', 'enter']); // B2

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });

    keyDownUp(['shift', 'enter']); // B1

    expect(topOverlay().getScrollPosition()).toBe(0);

    keyDownUp(['shift', 'enter']); // B50

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      // 1150 row heights - 104 viewport width + 15 scrollbart offset + 1 header border offset
      classic.toBe(1063);

      main.toBe(1366);
    });
  });

  it('should scroll the viewport horizontally', () => {
    handsontable({
      data: createSpreadsheetData(50, 5),
      width: 200,
      height: 130,
      navigableHeaders: true,
      rowHeaders: true,
      colHeaders: true,
    });

    selectRows(1, 1, -1);
    listen();
    keyDownUp('tab');
    keyDownUp('tab');
    keyDownUp('tab'); // C2

    // 150 column widths - 150 viewport width + 15 scrollbart offset + 1 header border offset
    expect(inlineStartOverlay().getScrollPosition()).toBe(16);

    keyDownUp('tab'); // D2

    expect(inlineStartOverlay().getScrollPosition()).toBe(66);

    keyDownUp('tab'); // E2

    expect(inlineStartOverlay().getScrollPosition()).toBe(116);

    keyDownUp(['shift', 'tab']); // D2
    keyDownUp(['shift', 'tab']); // C2

    expect(inlineStartOverlay().getScrollPosition()).toBe(100);

    keyDownUp(['shift', 'tab']); // B2

    expect(inlineStartOverlay().getScrollPosition()).toBe(50);

    keyDownUp(['shift', 'tab']); // A2

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);

    keyDownUp(['shift', 'tab']); // E2

    // 250 column widths - 150 viewport width + 15 scrollbart offset + 1 header border offset
    expect(inlineStartOverlay().getScrollPosition()).toBe(116);
  });
});
