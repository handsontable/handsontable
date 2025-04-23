describe('CopyPaste', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  describe('`paste` method', () => {
    it('should be possible to paste a value', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      await selectCell(1, 1);
      getPlugin('CopyPaste').paste('test');

      expect(getDataAtCell(1, 1)).toBe('test');
    });

    it('should be possible to paste a value when `outsideClickDeselects` is disabled (#dev-1935)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        outsideClickDeselects: false,
      });

      await selectCell(1, 1);
      getPlugin('CopyPaste').paste('test');

      expect(getDataAtCell(1, 1)).toBe('test');
    });
  });
});
