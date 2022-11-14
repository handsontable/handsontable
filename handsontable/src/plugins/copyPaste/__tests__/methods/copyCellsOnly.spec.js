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

  describe('`copyCellsOnly` method', () => {
    xit('should be possible to copy data by keyboard shortcut', () => {
      // simulated keyboard shortcuts doesn't run the true events
    });

    xit('should be possible to copy data by contextMenu option', () => {
      // simulated mouse events doesn't run the true browser event
    });

    it('should copy only cells to the clipboard', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: {
          copyColumnHeadersOnly: true,
          copyColumnGroupHeaders: true,
          copyColumnHeaders: true,
        },
        nestedHeaders: [
          ['a1', { label: 'b1', colspan: 4 }],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A2');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>A2</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy special characters to the clipboard', () => {
      handsontable({
        data: [
          ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~']
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 0, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('!@#$%^&*()_+-={[\t]};:\'"\\|,<.>/?~');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>!@#$%^&*()_+-={[</td><td>]};:\'"\\|,&lt;.&gt;/?~</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy text in quotes to the clipboard', () => {
      handsontable({
        data: [
          ['{"test": "value"}'],
          ['{"test2": {"testtest": ""}}'],
          ['{"test3": ""}'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 2, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain'))
        .toBe('{"test": "value"}\n{"test2": {"testtest": ""}}\n{"test3": ""}');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>{"test":&nbsp;"value"}</td></tr>',
        '<tr><td>{"test2":&nbsp;{"testtest":&nbsp;""}}</td></tr>',
        '<tr><td>{"test3":&nbsp;""}</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy 0 and false values to the clipboard', () => {
      handsontable({
        data: [
          [''],
          [0],
          [false],
          [undefined],
          [null],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 4, 0);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('\n0\nfalse\n\n');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td></td></tr>',
        '<tr><td>0</td></tr>',
        '<tr><td>false</td></tr>',
        '<tr><td></td></tr>',
        '<tr><td></td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy hidden rows to the clipboard', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1, 2, 3);

      plugin.copyCellsOnly();
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

    it('should enable the item when all columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1, 2, 3);

      plugin.copyCellsOnly();
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

    // The current behavior is probably a bug. An empty string should be copied into the clipboard.
    it('should disable the item when all rows are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('\t\t\t\t');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td></td><td></td><td></td><td></td><td></td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    // The current behavior is probably a bug. An empty string should be copied into the clipboard.
    it('should disable the item when all columns are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      // trim all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A1\nA2\nA3\nA4\nA5');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>A1</td></tr>',
        '<tr><td>A2</td></tr>',
        '<tr><td>A3</td></tr>',
        '<tr><td>A4</td></tr>',
        '<tr><td>A5</td></tr>',
        '</tbody></table>',
      ].join(''));
    });
  });
});
