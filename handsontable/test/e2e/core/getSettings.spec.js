describe('Core.getSettings', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to retrieve core-specific as well custom-specific setting and hooks', async() => {
    const afterChanges = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      customOption: 'customValue',
      rowHeaders: true,
      colHeaders: false,
      afterChanges,
    });

    expect(getSettings().customOption).toBe('customValue');
    expect(getSettings().rowHeaders).toBe(true);
    expect(getSettings().colHeaders).toBe(false);
    expect(getSettings().afterChanges).toBe(afterChanges);
  });

  it('should reflect the new changes passed to `updateSettings` method', async() => {
    const afterChanges = () => {};
    const afterChangesMod = () => {};

    handsontable({
      data: createSpreadsheetData(5, 5),
      customOption: 'customValue',
      rowHeaders: true,
      colHeaders: false,
      afterChanges,
    });

    await updateSettings({
      customOption: 'updatedValue',
      rowHeaders: false,
      colHeaders: true,
      afterChanges: afterChangesMod,
    });

    expect(getSettings().customOption).toBe('updatedValue');
    expect(getSettings().rowHeaders).toBe(false);
    expect(getSettings().colHeaders).toBe(true);
    expect(getSettings().afterChanges).toBe(afterChangesMod);
  });
});
