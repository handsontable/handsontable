describe('`modifySinglePassLayout` hook', () => {
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

  // The hook resolves the Walkontable `singlePassLayout` setting, so it is read from there.
  const isSinglePassLayout = hot => hot.view._wt.wtSettings.getSetting('singlePassLayout');

  it('should enable single-pass layout by default', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      colHeaders: true,
      rowHeaders: true,
      width: 200,
      height: 200,
    });

    expect(isSinglePassLayout(hot)).toBe(true);
  });

  it('should let a returned `false` force the legacy measure-then-render path', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      width: 200,
      height: 200,
      modifySinglePassLayout: () => false,
    });

    expect(isSinglePassLayout(hot)).toBe(false);
  });

  it('should receive the current value and keep it when the hook returns nothing', async() => {
    const received = [];
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      width: 200,
      height: 200,
      modifySinglePassLayout: (value) => {
        received.push(value);
      },
    });

    expect(isSinglePassLayout(hot)).toBe(true);
    expect(received).toContain(true);
  });

  it('should be disabled while `mergeCells` is enabled and re-enabled after it is turned off', async() => {
    const hot = handsontable({
      data: createSpreadsheetData(10, 10),
      width: 200,
      height: 200,
      mergeCells: true,
    });

    expect(isSinglePassLayout(hot)).toBe(false);

    await updateSettings({ mergeCells: false });

    expect(isSinglePassLayout(hot)).toBe(true);
  });
});
