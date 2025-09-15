describe('StretchColumns cooperation with hidden rows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should calculate stretching only for visible rows (should detect vertical scroll correctly)', async() => {
    handsontable({
      data: createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
      width: 500,
      height: getDefaultRowHeight() * 5,
      stretchH: 'last',
    });

    const columnMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(3, true);
    columnMapper.setValueAtIndex(4, true);
    columnMapper.setValueAtIndex(6, true);
    columnMapper.setValueAtIndex(8, true);
    hot().view.adjustElementsSize();
    await render();

    expect(getColWidth(6)).toBe(150);
  });
});
