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
    it('should be called with coords and dataset points to the cells only', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
        [['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']],
        [{ startRow: 1, startCol: 2, endRow: 3, endCol: 4 }],
        { columnHeadersCount: 0 },
      );
    });

    it('should be called with coords and dataset points to the cells and the first column headers ' +
       'nearest the cells (single-line column headers configuration)', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
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
      const beforeCopy = jasmine.createSpy('beforeCopy');

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
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
        [['C', 'D', 'E'], ['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']],
        [
          { startRow: -1, startCol: 2, endRow: -1, endCol: 4 },
          { startRow: 1, startCol: 2, endRow: 3, endCol: 4 },
        ],
        { columnHeadersCount: 1 },
      );
    });

    it('should be called with coords and dataset points to the cells and all column header layers', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');

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
        beforeCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 3);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopy.calls.count()).toBe(1);
      expect(beforeCopy).toHaveBeenCalledWith(
        [['C', 'D'], ['C', 'D'], ['C', 'D'], ['C2', 'D2'], ['C3', 'D3'], ['C4', 'D4']],
        [
          { startRow: -3, startCol: 2, endRow: -1, endCol: 3 },
          { startRow: 1, startCol: 2, endRow: 3, endCol: 3 },
        ],
        { columnHeadersCount: 3 },
      );
    });

    it('should be possible to block copy operation', () => {
      const beforeCopy = jasmine.createSpy('beforeCopy');
      const afterCopy = jasmine.createSpy('afterCopy');

      handsontable({
        data: createSpreadsheetData(2, 2),
        copyPaste: true,
        beforeCopy,
        afterCopy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A1');

      beforeCopy.calls.reset();
      afterCopy.calls.reset();
      beforeCopy.and.returnValue(false);

      selectCell(1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A1');
      expect(beforeCopy.calls.count()).toBe(1);
      expect(afterCopy.calls.count()).toBe(0);
    });

    it('should be possible to modify data during copy operation', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        copyPaste: true,
        beforeCopy(changes) {
          changes.splice(2, 1); // remove the first selected cells
          changes.splice(1, 1); // remove the most-bottom column header
        },
        modifyColumnHeaderValue(value, columnIndex, headerLevel) {
          if (headerLevel < 0) {
            headerLevel = headerLevel + this.view.getColumnHeadersCount();
          }

          return `${value}-${columnIndex}-${headerLevel}`;
        },
        afterGetColumnHeaderRenderers(renderers) {
          renderers.length = 0;
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 0);
          });
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 1);
          });
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 1, 0);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A-0-0\nA2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>A-0-0</td></tr>',
        '<tr><td>A2</td></tr>',
        '</tbody></table>'
      ].join(''));
    });
  });
});
