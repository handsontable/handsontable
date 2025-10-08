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

  it('should be disabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    expect(getSettings().stretchH).toBe('none');
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(0)).toBe(50);
  });

  it('should be possible to change the stretch strategy via `updateSettings`', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      width: 200,
      height: 100,
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);

    await updateSettings({
      stretchH: 'all',
    });

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(67);
      main.toBe(67);
      horizon.toBe(62);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(67);
      main.toBe(67);
      horizon.toBe(62);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(66);
      main.toBe(66);
      horizon.toBe(61);
    });

    await updateSettings({
      stretchH: 'last',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(100);
      main.toBe(100);
      horizon.toBe(85);
    });

    await updateSettings({
      stretchH: 'none',
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
  });

  it('should not stretch the columns when the "none" is set', async() => {
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

  it('should correctly stretch columns after table size change', async() => {
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

    await updateSettings({
      width: 500,
    });

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(150);
      main.toBe(150);
      horizon.toBe(145);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(150);
      main.toBe(150);
      horizon.toBe(145);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(150);
      main.toBe(150);
      horizon.toBe(145);
    });
  });

  it.forTheme('classic')(`should correctly stretch columns after vertical scroll appears
 (defined table size)`, async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 142,
      stretchH: 'all',
    });

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });

    await updateSettings({
      height: 141,
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(85);
    expect(getColWidth(2)).toBe(85);

    await updateSettings({
      height: 142,
    });

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
    expect(getColWidth(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(90);
      horizon.toBe(85);
    });
  });

  it.forTheme('main')(`should correctly stretch columns after vertical scroll appears
 (defined table size)`, async() => {
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

    await updateSettings({
      height: 165,
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(85);
    expect(getColWidth(2)).toBe(85);

    await updateSettings({
      height: 179,
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);
  });

  it.forTheme('horizon')(`should correctly stretch columns after vertical scroll appears
 (defined table size)`, async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 228,
      stretchH: 'all',
    });

    expect(getColWidth(0)).toBe(90);
    expect(getColWidth(1)).toBe(90);
    expect(getColWidth(2)).toBe(90);

    await updateSettings({
      height: 211,
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(85);
    expect(getColWidth(2)).toBe(85);

    await updateSettings({
      height: 228,
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

  it('should correctly stretch columns after window size change', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      stretchH: 'all',
    });

    const approxWidth = Math.floor(window.innerWidth / 3) - 4;

    expect(getColWidth(0)).toBeAroundValue(approxWidth, 1);
    expect(getColWidth(1)).toBeAroundValue(getColWidth(0), 1);
    expect(getColWidth(2)).toBeAroundValue(getColWidth(0), 1);
  });

  it('should correctly stretch columns when there are some rows with multi-line text', async() => {
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

    expect(getColWidth(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(404);
      main.toBe(418);
      horizon.toBe(420);
    });
    expect(getColWidth(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(96);
      main.toBe(82);
      horizon.toBe(80);
    });
  });

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "all")', async() => {
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

  it('should not stretch the columns when the sum of columns widths is wider than the viewport (stretch "last")', async() => {
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

  it('should correctly stretch the column after changing the cell value (#dev-1727)', async() => {
    const data = createSpreadsheetData(1, 5);

    data[0][4] = 'very long text is here to make the column wider';

    handsontable({
      data,
      width: 400,
      height: 300,
      stretchH: 'all',
    });

    expect(getColWidth(4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(259);
      main.toBe(311);
      horizon.toBe(319);
    });

    await setDataAtCell(0, 4, 'text');

    expect(getColWidth(4)).toBe(80);

    await setDataAtCell(0, 4, 'very long text is here to make the column wider');

    expect(getColWidth(4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(259);
      main.toBe(311);
      horizon.toBe(319);
    });
  });

  it('should stretch the table to the entirety of the container when autoRowSize is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(1, 5),
      autoRowSize: true,
      width: '680',
      height: 'auto',
      stretchH: 'all',
      contextMenu: true,
      rowHeaders: true,
      colHeaders: true,
    });

    await sleep(50);

    expect($('.handsontable .ht_master table').outerWidth()).toBe(680);
  });
});
