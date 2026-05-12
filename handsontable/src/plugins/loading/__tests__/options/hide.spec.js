describe('Loading - hide method', () => {
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

  it('should hide the loading dialog when dialog is visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    loadingPlugin.hide();

    expect(loadingPlugin.isVisible()).toBe(false);
  });

  it('should not hide the loading dialog when dialog is not visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: false,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.hide();

    expect(loadingPlugin.isVisible()).toBe(false);
  });

  it('should preserve scroll position when hiding the loading overlay with no prior cell selection', async() => {
    handsontable({
      data: createSpreadsheetData(100, 5),
      height: 300,
      width: 400,
      loading: true,
    });

    await scrollViewportTo({ row: 50, verticalSnap: 'top' });

    const firstVisibleRow = getFirstFullyVisibleRow();

    expect(getSelected()).toBeUndefined();

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();
    loadingPlugin.hide();

    expect(getFirstFullyVisibleRow()).toBe(firstVisibleRow);
  });

  it('should preserve scroll position when hiding the loading overlay after updateData() with no prior cell selection', async() => {
    const initialData = createSpreadsheetData(50, 5);
    const moreData = createSpreadsheetData(100, 5);

    handsontable({
      data: initialData,
      height: 300,
      width: 400,
      loading: true,
    });

    await scrollViewportTo({ row: 30, verticalSnap: 'top' });

    const firstVisibleRow = getFirstFullyVisibleRow();

    expect(getSelected()).toBeUndefined();

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();
    await updateData(moreData);
    loadingPlugin.hide();

    expect(getFirstFullyVisibleRow()).toBe(firstVisibleRow);
  });

  it('should preserve scroll position across repeated show/hide cycles with no prior cell selection', async() => {
    handsontable({
      data: createSpreadsheetData(100, 5),
      height: 300,
      width: 400,
      loading: true,
    });

    await scrollViewportTo({ row: 50, verticalSnap: 'top' });

    const firstVisibleRow = getFirstFullyVisibleRow();

    expect(getSelected()).toBeUndefined();

    const loadingPlugin = getPlugin('loading');

    // First cycle (simulates first data load)
    loadingPlugin.show();
    loadingPlugin.hide();

    // Second cycle (simulates second data load - was scrolling to row 0)
    loadingPlugin.show();
    loadingPlugin.hide();

    expect(getFirstFullyVisibleRow()).toBe(firstVisibleRow);
    expect(getSelected()).toBeUndefined();
  });
});
