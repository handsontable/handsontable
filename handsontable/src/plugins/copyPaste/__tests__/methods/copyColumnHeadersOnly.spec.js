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

  describe('`copyColumnHeadersOnly` method', () => {
    it('should copy only column headers to the clipboard', () => {
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

      selectCell(1, 1);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('b1');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>b1</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy special characters to the clipboard', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: ['!@#$%^&*()_+-={[', ']};:\'"\\|,<.>/?~'],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(3, 0, 4, 1);

      plugin.copyColumnHeadersOnly();
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
        data: createSpreadsheetData(5, 5),
        colHeaders: [
          '{"test": "value"}',
          '{"test2": {"testtest": ""}}',
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(3, 0, 4, 1);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('{"test": "value"}\t{"test2": {"testtest": ""}}');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>{"test":&nbsp;"value"}</td><td>{"test2":&nbsp;{"testtest":&nbsp;""}}</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    it('should copy 0 and false values to the clipboard', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: ['', 0, false, undefined, null],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(0, 0, 4, 4);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      // Handsontable replaces undefined values with letters
      expect(copyEvent.clipboardData.getData('text/plain')).toBe('\t0\tfalse\tD\t');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td></td><td>0</td><td>false</td><td>D</td><td></td></tr>',
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

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B\tC\tD');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>B</td><td>C</td><td>D</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    // TODO
    it('should enable the item when all columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true, // there is a bug when the colHeaders is false
        contextMenu: true,
      });

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1, 2, 3);

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('B\tC\tD');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>B</td><td>C</td><td>D</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

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

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('A\tB\tC\tD\tE');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table><tbody>',
        '<tr><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td></tr>',
        '</tbody></table>',
      ].join(''));
    });

    // TODO
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

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      // expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      // expect(copyEvent.clipboardData.getData('text/html')).toBe([
      //   '<meta name="generator" content="Handsontable"/>' +
      //     '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      //   '<table><tbody>',
      //     '<tr><td>A1</td></tr>',
      //     '<tr><td>A2</td></tr>',
      //     '<tr><td>A3</td></tr>',
      //     '<tr><td>A4</td></tr>',
      //     '<tr><td>A5</td></tr>',
      //   '</tbody></table>',
      // ].join(''));
    });
  });
});
