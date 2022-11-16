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

  describe('`copyWithColumnGroupHeaders` method', () => {
    it('should copy cells with column group headers to the clipboard', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
          ['a2', { label: 'b2', colspan: 2 }, { label: 'c2', colspan: 2 }],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 0);

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\na2\nA2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a1</td></tr>',
        '<tr><td>a2</td></tr>',
        '<tr><td>A2</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy cells and column group headers to the clipboard when all cells and headers are selected', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        nestedHeaders: [
          [{ label: 'a1', colspan: 2 }],
          ['a2', 'b2'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      // eslint-disable-next-line no-useless-escape
      expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\t\n\a2\tb2\nA1\tB1\nA2\tB2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a1</td><td></td></tr>',
        '<tr><td>a2</td><td>b2</td></tr>',
        '<tr><td>A1</td><td>B1</td></tr>',
        '<tr><td>A2</td><td>B2</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy cells with group column headers to the clipboard when all rows are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        nestedHeaders: [
          [{ label: 'a1', colspan: 4 }, 'b1'],
          [{ label: 'a2', colspan: 2 }, { label: 'b2', colspan: 2 }, 'c2'],
        ],
      });

      selectCell(1, 1, 2, 3);

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\t\t\na2\tb2\t\nB2\tC2\tD2\nB3\tC3\tD3');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a1</td><td></td><td></td></tr>',
        '<tr><td>a2</td><td>b2</td><td></td></tr>',
        '<tr><td>B2</td><td>C2</td><td>D2</td></tr>',
        '<tr><td>B3</td><td>C3</td><td>D3</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy only cells to the clipboard when all rows are hidden and the `colHeaders` is disabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: false,
        copyPaste: true,
      });

      selectCell(1, 1, 2, 3);

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2\tC2\tD2\nB3\tC3\tD3');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>B2</td><td>C2</td><td>D2</td></tr>',
        '<tr><td>B3</td><td>C3</td><td>D3</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy cells with group column headers to the clipboard when all columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        copyPaste: {
          copyColumnGroupHeaders: true,
        },
        contextMenu: true,
        nestedHeaders: [
          [{ label: 'a1', colspan: 4 }, 'b1'],
          [{ label: 'a2', colspan: 2 }, { label: 'b2', colspan: 2 }, 'c2'],
        ],
      });

      selectCell(1, 1, 2, 3);

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\t\t\na2\tb2\t\nB2\tC2\tD2\nB3\tC3\tD3');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a1</td><td></td><td></td></tr>',
        '<tr><td>a2</td><td>b2</td><td></td></tr>',
        '<tr><td>B2</td><td>C2</td><td>D2</td></tr>',
        '<tr><td>B3</td><td>C3</td><td>D3</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy only cells to the clipboard when all columns are hidden and the `colHeaders` is disabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: false,
        rowHeaders: true,
        copyPaste: true,
      });

      selectCell(1, 1, 2, 3);

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B2\tC2\tD2\nB3\tC3\tD3');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>B2</td><td>C2</td><td>D2</td></tr>',
        '<tr><td>B3</td><td>C3</td><td>D3</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy column headers only to the clipboard when all rows are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
        nestedHeaders: [
          [{ label: 'a1', colspan: 4 }, 'b1'],
          [{ label: 'a2', colspan: 2 }, { label: 'b2', colspan: 2 }, 'c2'],
        ],
      });

      selectAll();

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\t\t\t\tb1\na2\t\tb2\t\tc2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>a1</td><td></td><td></td><td></td><td>b1</td></tr>',
        '<tr><td>a2</td><td></td><td>b2</td><td></td><td>c2</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy an empty string to the clipboard when all rows are trimmed and the `colHeaders` is disabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: false,
        copyPaste: true,
      });

      selectAll();

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table></table>',
      ].join(''));
    });

    it('should copy an empty string to the clipboard when all columns are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
      });

      selectAll();

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table></table>',
      ].join(''));
    });

    it('should copy an empty string to the clipboard when all columns are trimmed and the `colHeaders` is disabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: false,
        copyPaste: true,
      });

      selectAll();

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyWithColumnGroupHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table></table>',
      ].join(''));
    });
  });
});
