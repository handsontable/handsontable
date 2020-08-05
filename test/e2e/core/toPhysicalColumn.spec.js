describe('Core.toPhysicalColumn', () => {
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

  it('should return valid physical column index', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.columnIndexMapper.setIndexesSequence([3, 4, 5, 6, 7]);

    expect(hot.toPhysicalColumn(0)).toBe(3);
    expect(hot.toPhysicalColumn(1)).toBe(4);
    expect(hot.toPhysicalColumn(2)).toBe(5);
  });

  // Predicting how user would like to change index mapper's length would be hard.
  it('should reset physical indexes when `columns` changed data length', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
    });

    hot.columnIndexMapper.setIndexesSequence([3, 4, 5, 6, 7]);
    hot.updateSettings({ columns: [{}, {}] });

    expect(hot.toPhysicalColumn(0)).toBe(0);
    expect(hot.toPhysicalColumn(1)).toBe(1);
    expect(hot.toPhysicalColumn(2)).toBe(null);
  });

  describe('should reset physical indexes when user load new data', () => {
    it('by updating settings', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      updateSettings({ data: Handsontable.helper.createSpreadsheetData(2, 2) });

      expect(hot.toPhysicalColumn(0)).toBe(0);
      expect(hot.toPhysicalColumn(1)).toBe(1);
      expect(hot.toPhysicalColumn(2)).toBe(null);
    });

    it('by calling the `loadData` function', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
      });

      hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
      hot.loadData(Handsontable.helper.createSpreadsheetData(2, 2));

      expect(hot.toPhysicalColumn(0)).toBe(0);
      expect(hot.toPhysicalColumn(1)).toBe(1);
      expect(hot.toPhysicalColumn(2)).toBe(null);
    });
  });
});
