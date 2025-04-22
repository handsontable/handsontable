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

  describe('`afterCopyLimit` hook', () => {
    it('should not be called when the rows limit is not reached', () => {
      const afterCopyLimit = jasmine.createSpy('afterCopyLimit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: {
          rowsLimit: 5,
          columnsLimit: Infinity,
        },
        afterCopyLimit,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopyLimit).not.toHaveBeenCalledWith();
    });

    it('should not be called when the columns limit is not reached', () => {
      const afterCopyLimit = jasmine.createSpy('afterCopyLimit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: {
          rowsLimit: Infinity,
          columnsLimit: 5,
        },
        afterCopyLimit,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopyLimit).not.toHaveBeenCalledWith();
    });

    it('should be called when the rows limit is reached', () => {
      const afterCopyLimit = jasmine.createSpy('afterCopyLimit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: {
          rowsLimit: Infinity,
          columnsLimit: 4,
        },
        afterCopyLimit,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();
      afterCopyLimit.calls.reset();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopyLimit.calls.count()).toBe(1);
      expect(afterCopyLimit).toHaveBeenCalledWith(5, 4, Infinity, 4);
    });

    it('should be called when the columns limit is reached', () => {
      const afterCopyLimit = jasmine.createSpy('afterCopyLimit');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: {
          rowsLimit: 4,
          columnsLimit: Infinity,
        },
        afterCopyLimit,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();
      afterCopyLimit.calls.reset();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopyLimit.calls.count()).toBe(1);
      expect(afterCopyLimit).toHaveBeenCalledWith(4, 5, 4, Infinity);
    });
  });
});
