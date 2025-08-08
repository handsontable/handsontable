describe('Core.getActiveSelectionLayerIndex', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should alias the method to the selection instance', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
    });

    spyOn(selection(), 'getActiveSelectionLayerIndex').and.returnValue(5);

    expect(getActiveSelectionLayerIndex()).toBe(5);
  });
});
