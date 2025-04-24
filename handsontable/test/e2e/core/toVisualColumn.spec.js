describe('Core.toVisualColumn', () => {
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

  it('should return valid visual column index', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5)
    });

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

    expect(toVisualColumn(0)).toBe(4);
    expect(toVisualColumn(1)).toBe(3);
    expect(toVisualColumn(2)).toBe(2);
  });

  // Predicting how user would like to change index mapper's length would be hard.
  it('should reset visual indexes when `columns` changed data length', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);
    await updateSettings({ columns: [{}, {}] });

    expect(toVisualColumn(0)).toBe(0);
    expect(toVisualColumn(1)).toBe(1);
    expect(toVisualColumn(2)).toBe(null);
  });

  describe('should reset visual indexes when user load new data', () => {
    it('by calling the `loadData` function', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

      await loadData(createSpreadsheetData(2, 2));

      expect(toVisualColumn(0)).toBe(0);
      expect(toVisualColumn(1)).toBe(1);
      expect(toVisualColumn(2)).toBe(null);
    });
  });

  describe('should NOT reset visual indexes when user updates data', () => {
    it('by updating settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

      await updateSettings({ data: createSpreadsheetData(2, 2) });

      expect(toVisualColumn(0)).toBe(1);
      expect(toVisualColumn(1)).toBe(0);
      expect(toVisualColumn(2)).toBe(null);
    });

    it('by calling the `updateData` function', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper().setIndexesSequence([4, 3, 2, 1, 0]);

      await updateData(createSpreadsheetData(2, 2));

      expect(toVisualColumn(0)).toBe(1);
      expect(toVisualColumn(1)).toBe(0);
      expect(toVisualColumn(2)).toBe(null);
    });
  });
});
