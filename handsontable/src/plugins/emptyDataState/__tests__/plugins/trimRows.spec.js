describe('EmptyDataState with TrimRows plugin', () => {
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

  it('should show emptyDataState when all rows are trimmed', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
      trimRows: [0, 1, 2], // Trim all rows
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const trimRowsPlugin = getPlugin('trimRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement()).toBeDefined();
    expect(trimRowsPlugin.isTrimmed(0)).toBe(true);
    expect(trimRowsPlugin.isTrimmed(1)).toBe(true);
    expect(trimRowsPlugin.isTrimmed(2)).toBe(true);
  });

  it('should hide emptyDataState when some rows are untrimmed', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
      trimRows: [0, 1, 2], // Start with all rows trimmed
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const trimRowsPlugin = getPlugin('trimRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Untrim one row
    trimRowsPlugin.untrimRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
    expect(getEmptyDataStateContainerElement().style.display).toBe('none');
    expect(trimRowsPlugin.isTrimmed(1)).toBe(false);
  });

  it('should show emptyDataState when all remaining rows are trimmed after untrimming some', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      emptyDataState: true,
      trimRows: [0, 1, 2, 3, 4], // Start with all rows trimmed
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const trimRowsPlugin = getPlugin('trimRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Untrim one row
    trimRowsPlugin.untrimRow(2);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Trim that row again
    trimRowsPlugin.trimRow(2);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
  });

  it('should handle dynamic trimming/untrimming of rows', async() => {
    handsontable({
      data: createSpreadsheetData(4, 3),
      emptyDataState: true,
      trimRows: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');
    const trimRowsPlugin = getPlugin('trimRows');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Trim all rows
    trimRowsPlugin.trimRows([0, 1, 2, 3]);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Untrim one row
    trimRowsPlugin.untrimRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Trim that row again
    trimRowsPlugin.trimRow(1);

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
  });

  it('should work with trimRows updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Trim all rows via updateSettings
    await updateSettings({
      trimRows: [0, 1, 2],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Untrim all rows via updateSettings
    await updateSettings({
      trimRows: [],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
  });
});
