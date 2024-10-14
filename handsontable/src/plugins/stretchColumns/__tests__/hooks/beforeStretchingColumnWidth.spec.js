describe('StretchColumns with `beforeStretchingColumnWidth` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be triggered once per column', () => {
    const beforeStretchingColumnWidth = jasmine.createSpy('beforeStretchingColumnWidth');

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
      beforeStretchingColumnWidth,
    });

    expect(beforeStretchingColumnWidth).toHaveBeenCalledTimes(3);
    expect(beforeStretchingColumnWidth.calls.allArgs()).toEqual([
      [90, 0],
      [90, 1],
      [90, 2],
    ]);
  });

  it('should be possible to change the stretched column width for stretching all strategy', () => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'all',
      beforeStretchingColumnWidth(width, index) {
        return index === 1 ? 100 : width;
      },
    });

    expect(getColWidth(0)).toBe(85);
    expect(getColWidth(1)).toBe(100);
    expect(getColWidth(2)).toBe(85);
  });

  it('should not be possible to change the stretched column width for stretching last strategy', () => {
    const beforeStretchingColumnWidth = jasmine.createSpy('beforeStretchingColumnWidth')
      .and.callFake(() => 120);

    handsontable({
      data: createSpreadsheetData(5, 3),
      colHeaders: true,
      rowHeaders: true,
      width: 320,
      height: 200,
      stretchH: 'last',
      beforeStretchingColumnWidth,
    });

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(170);
    expect(beforeStretchingColumnWidth).toHaveBeenCalledTimes(0);
  });
});
