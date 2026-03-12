describe('MultipleSelectionHandles (customBorders overlap)', () => {
  const id = 'testContainer';
  const desktopBrowserMeta = {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
    vendor: 'Google Inc.',
  };
  const mobileBrowserMeta = {
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
    vendor: 'Google Inc.',
  };

  beforeEach(function() {
    Handsontable.helper.setBrowserMeta(mobileBrowserMeta);
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    Handsontable.helper.setBrowserMeta(desktopBrowserMeta);

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render selection handles above custom borders', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      width: 400,
      height: 300,
      customBorders: true,
    });

    await selectCell(3, 3);

    getPlugin('customBorders').setBorders([[3, 3, 3, 3]], {
      top: { width: 30, color: '#f00' },
      bottom: { width: 30, color: '#f00' },
      start: { width: 30, color: '#f00' },
      end: { width: 30, color: '#f00' },
    });

    await sleep(100);

    const topHandle = spec().$container.find('.ht_master .topSelectionHandle')[0];
    const bottomHandle = spec().$container.find('.ht_master .bottomSelectionHandle')[0];
    const topRect = topHandle?.getBoundingClientRect();
    const bottomRect = bottomHandle?.getBoundingClientRect();
    const topX = topRect ? Math.floor(topRect.left + (topRect.width / 2)) : null;
    const topY = topRect ? Math.floor(topRect.top + (topRect.height / 2)) : null;
    const bottomX = bottomRect ? Math.floor(bottomRect.left + (bottomRect.width / 2)) : null;
    const bottomY = bottomRect ? Math.floor(bottomRect.top + (bottomRect.height / 2)) : null;
    const topElement = topRect ?
      document.elementFromPoint(topX, topY) :
      null;
    const bottomElement = bottomRect ?
      document.elementFromPoint(bottomX, bottomY) :
      null;

    expect(topHandle).toBeDefined();
    expect(bottomHandle).toBeDefined();
    expect(topElement?.classList.contains('wtBorder')).toBe(false);
    expect(bottomElement?.classList.contains('wtBorder')).toBe(false);
    expect(
      topElement === topHandle || topElement?.classList.contains('topSelectionHandle-HitArea')
    ).toBe(true);
    expect(
      bottomElement === bottomHandle || bottomElement?.classList.contains('bottomSelectionHandle-HitArea')
    ).toBe(true);
  });

  it('should render selection handles above custom borders for fixed rows and columns', async() => {
    handsontable({
      data: createSpreadsheetData(20, 20),
      width: 400,
      height: 300,
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
      customBorders: true,
    });

    await selectCell(1, 1);

    getPlugin('customBorders').setBorders([[1, 1, 1, 1]], {
      top: { width: 30, color: '#0a0' },
      bottom: { width: 30, color: '#0a0' },
      start: { width: 30, color: '#0a0' },
      end: { width: 30, color: '#0a0' },
    });

    await sleep(100);

    const topHandle = spec().$container.find('.ht_master .topSelectionHandle')[0];
    const bottomHandle = spec().$container.find('.ht_master .bottomSelectionHandle')[0];
    const topRect = topHandle?.getBoundingClientRect();
    const bottomRect = bottomHandle?.getBoundingClientRect();
    const topX = topRect ? Math.floor(topRect.left + (topRect.width / 2)) : null;
    const topY = topRect ? Math.floor(topRect.top + (topRect.height / 2)) : null;
    const bottomX = bottomRect ? Math.floor(bottomRect.left + (bottomRect.width / 2)) : null;
    const bottomY = bottomRect ? Math.floor(bottomRect.top + (bottomRect.height / 2)) : null;
    const topElement = topRect ?
      document.elementFromPoint(topX, topY) :
      null;
    const bottomElement = bottomRect ?
      document.elementFromPoint(bottomX, bottomY) :
      null;

    expect(topHandle).toBeDefined();
    expect(bottomHandle).toBeDefined();
    expect(topElement?.classList.contains('wtBorder')).toBe(false);
    expect(bottomElement?.classList.contains('wtBorder')).toBe(false);
  });
});
