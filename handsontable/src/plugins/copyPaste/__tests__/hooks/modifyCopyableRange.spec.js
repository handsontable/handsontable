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

  describe('`modifyCopyableRange` hook', () => {
    it('should be called with the ranges that are about to be copied', async() => {
      const modifyCopyableRange = jasmine.createSpy('modifyCopyableRange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        copyPaste: true,
        modifyCopyableRange,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 2, 3, 4);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(modifyCopyableRange).toHaveBeenCalledWith(
        [{ startRow: 1, startCol: 2, endRow: 3, endCol: 4 }],
      );
    });

    it('should narrow down what gets copied to the clipboard when a smaller range is returned', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        copyPaste: true,
        modifyCopyableRange(copyableRanges) {
          return copyableRanges.map(({ startRow, endRow, startCol, endCol }) => ({
            startRow,
            endRow,
            startCol: Math.max(startCol, endCol),
            endCol,
          }));
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      await selectCell(1, 2, 3, 4);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('E2\nE3\nE4');
    });
  });
});
