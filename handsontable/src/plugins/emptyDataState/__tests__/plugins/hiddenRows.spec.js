describe('EmptyDataState with HiddenRows plugin', () => {
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

  it('should show emptyDataState when all rows are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
      hiddenRows: {
        rows: [0, 1, 2], // Hide all rows
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const hiddenRowsPlugin = getPlugin('hiddenRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement()).toBeDefined();
    expect(hiddenRowsPlugin.isHidden(0)).toBe(true);
    expect(hiddenRowsPlugin.isHidden(1)).toBe(true);
    expect(hiddenRowsPlugin.isHidden(2)).toBe(true);
  });

  it('should hide emptyDataState when some rows are shown', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
      hiddenRows: {
        rows: [0, 1, 2], // Start with all rows hidden
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const hiddenRowsPlugin = getPlugin('hiddenRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Show one row
    hiddenRowsPlugin.showRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
    expect(getEmptyDataStateContainerElement().style.display).toBe('none');
    expect(hiddenRowsPlugin.isHidden(1)).toBe(false);
  });

  it('should show emptyDataState when all remaining rows are hidden after showing some', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      emptyDataState: true,
      hiddenRows: {
        rows: [0, 1, 2, 3, 4], // Start with all rows hidden
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const hiddenRowsPlugin = getPlugin('hiddenRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Show one row
    hiddenRowsPlugin.showRow(2);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Hide that row again
    hiddenRowsPlugin.hideRow(2);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
  });

  it('should handle dynamic hiding/showing of rows', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      emptyDataState: true,
      hiddenRows: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const hiddenRowsPlugin = getPlugin('hiddenRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Hide all rows
    hiddenRowsPlugin.hideRows([0, 1, 2, 3]);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Show one row
    hiddenRowsPlugin.showRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Hide that row again
    hiddenRowsPlugin.hideRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
  });

  it('should work with hiddenRows updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Hide all rows via updateSettings
    await updateSettings({
      hiddenRows: {
        rows: [0, 1, 2],
      },
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Show all rows via updateSettings
    await updateSettings({
      hiddenRows: {
        rows: [],
      },
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
  });
});
