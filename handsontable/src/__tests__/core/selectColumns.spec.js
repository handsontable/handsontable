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

  it('should call the `selectColumns` method of the Selection module internally', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(selection(), 'selectColumns').and.returnValue('return value');

    expect(await selectColumns()).toBe('return value');
    expect(selection().selectColumns).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(selection().selectColumns).toHaveBeenCalledTimes(1);

    selection().selectColumns.calls.reset();

    expect(await selectColumns(4)).toBe('return value');
    expect(selection().selectColumns).toHaveBeenCalledWith(4, 4, undefined);
    expect(selection().selectColumns).toHaveBeenCalledTimes(1);

    selection().selectColumns.calls.reset();

    expect(await selectColumns(2, 3)).toBe('return value');
    expect(selection().selectColumns).toHaveBeenCalledWith(2, 3, undefined);
    expect(selection().selectColumns).toHaveBeenCalledTimes(1);

    selection().selectColumns.calls.reset();

    expect(await selectColumns(2, 3, -1)).toBe('return value');
    expect(selection().selectColumns).toHaveBeenCalledWith(2, 3, -1);
    expect(selection().selectColumns).toHaveBeenCalledTimes(1);

    selection().selectColumns.calls.reset();

    expect(await selectColumns(2, 3, -1, 1)).toBe('return value');
    expect(selection().selectColumns).toHaveBeenCalledWith(2, 3, -1);
    expect(selection().selectColumns).toHaveBeenCalledTimes(1);
  });
});
