describe('Core.selectColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call the `selectColumns` method of the Selection module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot.selection, 'selectColumns').and.returnValue('return value');

    expect(selectColumns()).toBe('return value');
    expect(hot.selection.selectColumns).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(hot.selection.selectColumns).toHaveBeenCalledTimes(1);

    hot.selection.selectColumns.calls.reset();

    expect(selectColumns(4)).toBe('return value');
    expect(hot.selection.selectColumns).toHaveBeenCalledWith(4, 4, undefined);
    expect(hot.selection.selectColumns).toHaveBeenCalledTimes(1);

    hot.selection.selectColumns.calls.reset();

    expect(selectColumns(2, 3)).toBe('return value');
    expect(hot.selection.selectColumns).toHaveBeenCalledWith(2, 3, undefined);
    expect(hot.selection.selectColumns).toHaveBeenCalledTimes(1);

    hot.selection.selectColumns.calls.reset();

    expect(selectColumns(2, 3, -1)).toBe('return value');
    expect(hot.selection.selectColumns).toHaveBeenCalledWith(2, 3, -1);
    expect(hot.selection.selectColumns).toHaveBeenCalledTimes(1);

    hot.selection.selectColumns.calls.reset();

    expect(selectColumns(2, 3, -1, 1)).toBe('return value');
    expect(hot.selection.selectColumns).toHaveBeenCalledWith(2, 3, -1);
    expect(hot.selection.selectColumns).toHaveBeenCalledTimes(1);
  });
});
