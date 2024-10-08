describe('StretchColumns cooperation with hidden columns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should stretch only visible columns (ignore hidden ones)', () => {
    handsontable({
      data: createSpreadsheetData(5, 9),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
    });

    const columnMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    columnMapper.setValueAtIndex(0, true);
    columnMapper.setValueAtIndex(3, true);
    columnMapper.setValueAtIndex(4, true);
    columnMapper.setValueAtIndex(6, true);
    columnMapper.setValueAtIndex(8, true);
    render();
    hot().view.adjustElementsSize();

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(68);
    expect(getColWidth(2)).toBe(68);
    expect(getColWidth(3)).toBe(50);
    expect(getColWidth(4)).toBe(50);
    expect(getColWidth(5)).toBe(68);
    expect(getColWidth(6)).toBe(50);
    expect(getColWidth(7)).toBe(66);
    expect(getColWidth(8)).toBe(50);
  });
});
