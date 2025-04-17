describe('Core.unlisten', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('#rootWrapper');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
  });

  it('should make the table inactive', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    listen();

    expect(isListening()).toBe(true);

    unlisten();

    expect(isListening()).toBe(false);
  });
});
