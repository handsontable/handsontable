describe('Focus selection scroll', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
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

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      // 92 row heights - 104 viewport width + 15 scrollbart offset + + 1 selection offset + 1 header border offset
      classic.toBe(5);

      main.toBe(32);
      horizon.toBe(72);
    });

    keyDownUp('enter'); // B5

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(28);
      main.toBe(61);
      horizon.toBe(109);
    });

    keyDownUp('enter'); // B6

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(51);
      main.toBe(90);
      horizon.toBe(146);
    });

    keyDownUp(['shift', 'enter']); // B5
    keyDownUp(['shift', 'enter']); // B4

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(51);
      main.toBe(87);
      horizon.toBe(111);
    });

    keyDownUp(['shift', 'enter']); // B3

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(46);
      main.toBe(58);
      horizon.toBe(74);
    });

    keyDownUp(['shift', 'enter']); // B2

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });

    keyDownUp(['shift', 'enter']); // B1

    expect(topOverlay().getScrollPosition()).toBe(0);

    keyDownUp(['shift', 'enter']); // B50

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      // 1150 row heights - 104 viewport width + 15 scrollbar offset + 1 header border offset
      classic.toBe(1063);

      main.toBe(1366);
      horizon.toBe(1774);
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

    // 150 column widths - 150 viewport width + 15 scrollbar offset + 1 header border offset
    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(16);
      main.toBe(16);
      horizon.toBe(20);
    });

    keyDownUp('tab'); // D2

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(66);
      main.toBe(66);
      horizon.toBe(72);
    });

    keyDownUp('tab'); // E2

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(116);
      horizon.toBe(123);
    });

    keyDownUp(['shift', 'tab']); // D2
    keyDownUp(['shift', 'tab']); // C2

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(100);
      main.toBe(100);
      horizon.toBe(102);
    });

    keyDownUp(['shift', 'tab']); // B2

    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(50);
      main.toBe(50);
      horizon.toBe(51);
    });

    keyDownUp(['shift', 'tab']); // A2

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);

    keyDownUp(['shift', 'tab']); // E2

    // 250 column widths - 150 viewport width + 15 scrollbart offset + 1 header border offset
    expect(inlineStartOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(116);
      main.toBe(116);
      horizon.toBe(123);
    });
  });
});
