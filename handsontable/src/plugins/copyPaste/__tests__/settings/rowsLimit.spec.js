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

  describe('`rowsLimit` setting', () => {
    it('should be set to `Infinity` by default', () => {
      handsontable({
        copyPaste: true
      });

      expect(getPlugin('CopyPaste').rowsLimit).toBe(Infinity);
    });

    it('should be the same as limit provided in the settings', () => {
      handsontable({
        copyPaste: {
          rowsLimit: 100,
        }
      });

      expect(getPlugin('CopyPaste').rowsLimit).toBe(100);
    });

    it('should trim the selected cells without modifying column headers to the limit', () => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        rowHeaders: true,
        colHeaders: true,
        copyPaste: {
          rowsLimit: 2,
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
          renderers.push((renderedColumnIndex, TH) => {
            TH.innerText = this.getColHeader(renderedColumnIndex, 2);
          });
        },
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1, 8, 2);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe([
        'B-1-0\tC-2-0',
        'B-1-1\tC-2-1',
        'B-1-2\tC-2-2',
        'B2\tC2',
        'B3\tC3',
      ].join('\n'));
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
          '<thead>',
            '<tr><th>B-1-0</th><th>C-2-0</th></tr>',
            '<tr><th>B-1-1</th><th>C-2-1</th></tr>',
            '<tr><th>B-1-2</th><th>C-2-2</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><td>B2</td><td>C2</td></tr>',
            '<tr><td>B3</td><td>C3</td></tr>',
          '</tbody>',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });
  });
});
