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
        copyPaste: true,
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

    // fit('should copy only column headers added by the `', () => {
    //   const headers = [
    //     ['a1', 'a2', 'a3', 'a4'],
    //     ['b1', 'b2', 'b3', 'b4'],
    //   ];
    //   handsontable({
    //     data: createSpreadsheetData(2, 4),
    //     copyPaste: true,
    //     modifyColumnHeaderValue(value, visualColumnIndex, headerLevel) {
    //       const zeroBasedHeaderLevel = headerLevel >= 0 ? headerLevel : headerLevel + 2; // 2 number of headers

    //       return headers[zeroBasedHeaderLevel][visualColumnIndex];
    //     },
    //     afterGetColumnHeaderRenderers(renderers) {
    //       renderers.length = 0;
    //       renderers.push((renderedColumnIndex, TH) => {
    //         TH.innerText = this.getColHeader(renderedColumnIndex, 0);
    //       });
    //       renderers.push((renderedColumnIndex, TH) => {
    //         TH.innerText = this.getColHeader(renderedColumnIndex, 1);
    //       });
    //     }
    //   });

    //   const copyEvent = getClipboardEvent();
    //   const plugin = getPlugin('CopyPaste');

    //   selectAll();

    //   plugin.copyColumnHeadersOnly();
    //   plugin.onCopy(copyEvent); // emulate native "copy" event

    //   // expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\tb1\t\t\t\na2\tb2\t\tc2\t\t');
    //   expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\ta2\ta3\ta4\nb1\tb2\tb3\tb4');
    //   // expect(copyEvent.clipboardData.getData('text/html')).toBe([
    //   //   '<meta name="generator" content="Handsontable"/>' +
    //   //     '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
    //   //   '<table><tbody>',
    //   //   '<tr><td>a1</td><td></td></tr>',
    //   //   '</tbody></table>',
    //   // ].join(''));
    // });

    // it('should copy only column headers to the clipboard when all cells and headers are selected', () => {
    //   handsontable({
    //     data: createSpreadsheetData(2, 5),
    //     rowHeaders: true,
    //     colHeaders: true,
    //     copyPaste: true,
    //     nestedHeaders: [
    //       ['a1', { label: 'b1', colspan: 4 }],
    //       ['a2', { label: 'b2', colspan: 2 }, { label: 'c2', colspan: 2 }],
    //     ],
    //   });

    //   const copyEvent = getClipboardEvent();
    //   const plugin = getPlugin('CopyPaste');

    //   selectAll();

    //   plugin.copyColumnHeadersOnly();
    //   plugin.onCopy(copyEvent); // emulate native "copy" event

    //   expect(copyEvent.clipboardData.getData('text/plain')).toBe('a1\tb1\t\t\t\na2\tb2\t\tc2\t\t');
    //   expect(copyEvent.clipboardData.getData('text/html')).toBe([
    //     '<meta name="generator" content="Handsontable"/>' +
    //       '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
    //     '<table><tbody>',
    //     '<tr><td>a1</td><td></td></tr>',
    //     '</tbody></table>',
    //   ].join(''));
    // });

    it('should copy column headers to the clipboard when all rows are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        copyPaste: true,
      });

      selectCell(1, 1, 2, 3);

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

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

    it('should copy an empty string to the clipboard when all rows are hidden and the `colHeaders` is disabled', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: false,
        rowHeaders: true,
        copyPaste: true,
      });

      selectCell(1, 1, 2, 3);

      // hide all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table></table>',
      ].join(''));
    });

    it('should copy hidden column headers to the clipboard when all columns are hidden', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        copyPaste: true,
      });

      selectCell(1, 1, 2, 3);

      // hide all columns
      hot.columnIndexMapper.createAndRegisterIndexMap('map', 'hiding', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

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

    it('should copy an empty string to the clipboard when all columns are hidden and the `colHeaders` is disabled', () => {
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

      plugin.copyColumnHeadersOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('');
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
          '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table></table>',
      ].join(''));
    });

    it('should copy column headers to the clipboard when all rows are trimmed', () => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: true,
      });

      selectAll();

      // trim all rows
      hot.rowIndexMapper.createAndRegisterIndexMap('map', 'trimming', true);
      render();

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

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

      plugin.copyColumnHeadersOnly();
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

      plugin.copyColumnHeadersOnly();
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

      plugin.copyColumnHeadersOnly();
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
