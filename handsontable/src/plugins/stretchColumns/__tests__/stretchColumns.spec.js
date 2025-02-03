describe('StretchColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be disabled by default', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(getSettings().stretchH).toBe('none');
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
  });

  it('should be possible to change the stretch strategy via `updateSettings`', () => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      width: 200,
      height: 100,
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);

    updateSettings({
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(67);
    expect(getColWidth(1)).toBe(67);
    expect(getColWidth(2)).toBe(66);

    updateSettings({
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(100);

    updateSettings({
      stretchH: 'none',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
  });

  it('should not stretch the columns when the "none" is set', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 220,
      height: 200,
      stretchH: 'none',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
  });

  it('should correctly stretch columns after table size change', () => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);

    updateSettings({
      width: 500,
    });

    expect(getColWidth(0)).toBe(150);
    expect(getColWidth(1)).toBe(150);
    expect(getColWidth(2)).toBe(150);
  });

  it.forTheme('classic')('should correctly stretch columns after vertical scroll appears (defined table size)', () => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 142,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);

    updateSettings({
      height: 141,
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(85);
    expect(getColWidth(2)).toBe(85);

    updateSettings({
      height: 142,
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);
  });

  it.forTheme('main')('should correctly stretch columns after vertical scroll appears (defined table size)', () => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 179,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);

    updateSettings({
      height: 165,
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(85);
    expect(getColWidth(2)).toBe(85);

    updateSettings({
      height: 179,
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);
  });

  it('should correctly stretch columns after vertical scroll appears (window as scrollable element)', async() => {
    document.body.style.overflowY = 'hidden';

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: false,
      rowHeaders: false,
      stretchH: 'all',
    });

    {
      const columnWidth = window.innerWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(window.innerWidth);
    }

    await sleep(50);
    document.body.style.overflowY = 'scroll';
    await sleep(50);

    {
      const columnWidth = (window.innerWidth - 15) / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(window.innerWidth - 15);
    }
  });

  it('should correctly stretch columns after vertical scroll disappears (window as scrollable element)', async() => {
    document.body.style.overflowY = 'scroll';

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: false,
      rowHeaders: false,
      stretchH: 'all',
    });

    {
      const columnWidth = (window.innerWidth - 15) / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(window.innerWidth - 15);
    }

    await sleep(50);
    document.body.style.overflowY = 'hidden';
    await sleep(50);

    {
      const columnWidth = window.innerWidth / 3;

      expect(getColWidth(0)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(1)).toBeAroundValue(columnWidth, 1);
      expect(getColWidth(2)).toBeAroundValue(columnWidth, 1);
      expect(getMaster().find('.wtHider').width()).toBe(window.innerWidth);
    }

    document.body.style.overflowY = 'scroll';
  });

  it('should correctly stretch columns after window size change', () => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      stretchH: 'all',
    });

    const approxWidth = Math.floor(window.innerWidth / 3) - 4;

    expect(getColWidth(0)).toBeAroundValue(approxWidth, 1);
    expect(getColWidth(1)).toBeAroundValue(getColWidth(0), 1);
    expect(getColWidth(2)).toBeAroundValue(getColWidth(0), 1);
  });

  it('should correctly stretch columns when there are some rows with multi-line text', () => {
    const data = createSpreadsheetData(5, 2);

    for (let i = 0; i < data.length; i++) {
      if (i % 2) {
        data[i][0] += ' \nthis is a cell that contains a lot of text, \nwhich will make it multi-line';
      }
    }

    handsontable({
      data,
      width: 500,
      height: 200,
      stretchH: 'all',
    });

    expect(getColWidth(0)).forThemes(({ classic, main }) => {
      classic.toBe(404);
      main.toBe(418);
    });
    expect(getColWidth(1)).forThemes(({ classic, main }) => {
      classic.toBe(96);
      main.toBe(82);
    });
  });

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "all")', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      width: 220,
      height: 200,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
  });

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "last")', () => {
    handsontable({
      data: createSpreadsheetData(5, 6),
      width: 220,
      height: 200,
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
  });

  it('should correctly stretch the column after changing the cell value (#dev-1727)', () => {
    const data = createSpreadsheetData(1, 5);

    data[0][4] = 'very long text is here to make the column wider';

    handsontable({
      data,
      width: 400,
      height: 300,
      stretchH: 'all',
    });

    expect(getColWidth(4)).forThemes(({ classic, main }) => {
      classic.toBe(259);
      main.toBe(311);
    });

    setDataAtCell(0, 4, 'text');

    expect(getColWidth(4)).toBe(80);

    setDataAtCell(0, 4, 'very long text is here to make the column wider');

    expect(getColWidth(4)).forThemes(({ classic, main }) => {
      classic.toBe(259);
      main.toBe(311);
    });
  });
});
