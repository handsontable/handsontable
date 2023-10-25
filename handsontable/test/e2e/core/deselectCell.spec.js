describe('Core.deselectCell', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call the `deselectCell` method of the Selection module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot.selection, 'deselect');
    deselectCell();

    expect(hot.selection.deselect).toHaveBeenCalled();
  });
});
