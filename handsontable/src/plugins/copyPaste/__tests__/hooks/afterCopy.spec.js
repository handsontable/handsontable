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
    it('should be called with coords and dataset points to the cells only', () => {
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopy.calls.count()).toBe(1);
      expect(afterCopy).toHaveBeenCalledWith(
        [['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']],
        [{ startRow: 1, startCol: 2, endRow: 3, endCol: 4 }],
        { columnHeadersCount: 0 },
      );
    });

    it('should be called with coords and dataset points to the cells and the first column headers ' +
       'nearest the cells (single-line column headers configuration)', () => {
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopy.calls.count()).toBe(1);
      expect(afterCopy).toHaveBeenCalledWith(
        [['C', 'D', 'E'], ['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']],
        [
          { startRow: -1, startCol: 2, endRow: -1, endCol: 4 },
          { startRow: 1, startCol: 2, endRow: 3, endCol: 4 },
        ],
        { columnHeadersCount: 1 },
      );
    });

    it('should be called with coords and dataset points to the cells and the first column headers ' +
       'nearest the cells (multi-line column headers configuration)', () => {
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
        },
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopy.calls.count()).toBe(1);
      expect(afterCopy).toHaveBeenCalledWith(
        [['C', 'D', 'E'], ['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']],
        [
          { startRow: -1, startCol: 2, endRow: -1, endCol: 4 },
          { startRow: 1, startCol: 2, endRow: 3, endCol: 4 },
        ],
        { columnHeadersCount: 1 },
      );
    });

    it('should be called with coords and dataset points to the cells and all column header layers', () => {
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 2);
          });
        },
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 3);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(afterCopy.calls.count()).toBe(1);
      expect(afterCopy).toHaveBeenCalledWith(
        [['C', 'D'], ['C', 'D'], ['C', 'D'], ['C2', 'D2'], ['C3', 'D3'], ['C4', 'D4']],
        [
          { startRow: -3, startCol: 2, endRow: -1, endCol: 3 },
          { startRow: 1, startCol: 2, endRow: 3, endCol: 3 },
        ],
        { columnHeadersCount: 3 },
      );
    });
  });
});
