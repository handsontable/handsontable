describe('CopyPaste', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    // Installing spy stabilizes the tests. Without that on CI and real browser there are some
    // differences in results.
    spyOn(document, 'execCommand');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('`afterCopy` hook', () => {
    it('should be called after copy operation', () => {
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(2, 2),
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopy.calls.count()).toBe(1);
      expect(afterCopy).toHaveBeenCalledWith(
        [['A1']],
        [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }],
        { columnHeadersCount: 0 },
      );
    });
  });
});
