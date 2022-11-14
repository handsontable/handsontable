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

  describe('`beforeCopy` hook', () => {
    it('should be called before copy operation', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(2, 2),
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
        [['A1']],
        [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }],
        { columnHeadersCount: 0 }
      );
    });

    it('should be called before copy operation triggered by ``', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(2, 2),
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
        [['A1']],
        [{ startRow: 0, startCol: 0, endRow: 0, endCol: 0 }],
        { columnHeadersCount: 0 }
      );
    });

    it('should be possible to block copy operation', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy').and.returnValue(false);
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(2, 2),
        beforeCopy,
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(afterCopy.calls.count()).toBe(0);
    });

    it('should be possible to modify data during copy operation', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        beforeCopy(changes) {
          changes.splice(0, 1);
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 1, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toEqual('A2');
      expect(copyEvent.clipboardData.getData('text/html')).toEqual([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style><table>',
        '<tbody><tr><td>A2</td></tr></tbody></table>'].join(''));
    });
  });
});
