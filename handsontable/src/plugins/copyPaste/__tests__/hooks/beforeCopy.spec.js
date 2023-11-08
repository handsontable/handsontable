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
    it('should be not possible to modify copied data by the reference', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforeCopy: beforeCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 1);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      beforeCopySpy.calls.argsFor(0)[0].getData()[0][0] = 'AAA';

      expect(beforeCopySpy.calls.argsFor(0)[0].getData()).toEqual([['B2']]);
      expect(beforeCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
        data: [['B2']],
      });
    });

    it('should be called with coords and dataset points to the cells only', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforeCopy: beforeCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyCellsOnly();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe(
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>' +
        '<table>' +
        '<!--StartFragment-->' +
          '<tbody>' +
            '<tr>' +
              '<td>C2</td>' +
              '<td>D2</td>' +
              '<td>E2</td>' +
            '</tr>' +
            '<tr>' +
              '<td>C3</td>' +
              '<td>D3</td>' +
              '<td>E3</td>' +
            '</tr>' +
            '<tr>' +
              '<td>C4</td>' +
              '<td>D4</td>' +
              '<td>E4</td>' +
            '</tr>' +
          '</tbody>' +
        '<!--EndFragment-->' +
        '</table>',
      );
      /* eslint-enable */
      expect(beforeCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
        data: [['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']]
      });
    });

    it('should be called with coords and dataset points to the cells and the first column headers ' +
      'nearest the cells (single-line column headers configuration)', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');

      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        copyPaste: true,
        beforeCopy: beforeCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
        colHeaders: ['C', 'D', 'E'],
        data: [
          ['C2', 'D2', 'E2'],
          ['C3', 'D3', 'E3'],
          ['C4', 'D4', 'E4']
        ]
      });
    });

    it('should be called with coords and dataset points to the cells and the first column headers ' +
      'nearest the cells (multi-line column headers configuration)', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');

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
        beforeCopy: beforeCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 4);

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/html')).toBe(
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>' +
        '<table>' +
        '<!--StartFragment-->' +
          '<thead>' +
            '<tr>' +
              '<th>C</th>' +
              '<th>D</th>' +
              '<th>E</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            '<tr>' +
              '<td>C2</td>' +
              '<td>D2</td>' +
              '<td>E2</td>' +
            '</tr>' +
            '<tr>' +
              '<td>C3</td>' +
              '<td>D3</td>' +
              '<td>E3</td>' +
            '</tr>' +
            '<tr>' +
              '<td>C4</td>' +
              '<td>D4</td>' +
              '<td>E4</td>' +
            '</tr>' +
          '</tbody>' +
        '<!--EndFragment-->' +
        '</table>',
      );
      expect(beforeCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
        colHeaders: ['C', 'D', 'E'],
        data: [['C2', 'D2', 'E2'], ['C3', 'D3', 'E3'], ['C4', 'D4', 'E4']]
      });
    });

    it('should be called with coords and dataset points to the cells and all column header layers', () => {
      const beforeCopySpy = jasmine.createSpy('beforeCopy');

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
        beforeCopy: beforeCopySpy,
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectCell(1, 2, 3, 3);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(beforeCopySpy.calls.argsFor(0)[0].getMetaInfo()).toEqual({
        nestedHeaders: [
          ['C', 'D'],
          ['C', 'D'],
          ['C', 'D']
        ],
        data: [
          ['C2', 'D2'],
          ['C3', 'D3'],
          ['C4', 'D4']
        ]
      });
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

    it('should be possible to remove part of data during copy operation', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        copyPaste: true,
        beforeCopy(clipboardData) {
          clipboardData.removeRows([0, -1]);
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
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
          '<!--StartFragment-->',
          '<thead>',
            '<tr>' +
              '<th>A-0-0</th>' +
            '</tr>',
          '</thead>',
          '<tbody>',
            '<tr>',
              '<td>A2</td>',
            '</tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>'
      ].join(''));
      /* eslint-enable */
    });

    it('should be possible to change data during copy operation (LTR)', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        copyPaste: true,
        beforeCopy(clipboardData) {
          clipboardData.setCellAt(-2, 0, 'hello world');
          clipboardData.setCellAt(1, 1, 'hello world2');
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

      selectAll();

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('hello world\tB-1-0\n' +
        'A-0-1\tB-1-1\n' +
        'A1\tB1\n' +
        'A2\thello world2');
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr>' +
              '<th>hello world</th>' +
              '<th>B-1-0</th>' +
            '</tr>',
            '<tr>' +
              '<th>A-0-1</th>' +
              '<th>B-1-1</th>' +
            '</tr>',
          '</thead>',
          '<tbody>',
            '<tr>',
              '<td>A1</td>',
              '<td>B1</td>',
            '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td>hello world2</td>',
          '</tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>'
      ].join(''));
      /* eslint-enable */
    });

    it('should store data during copy operation in RTL mode as LTR table (the same as `getData` and similar methods' +
      'work - the direction is only for visualization)', () => {
      handsontable({
        data: createSpreadsheetData(2, 2),
        colHeaders: true,
        copyPaste: true,
        layoutDirection: 'rtl',
        beforeCopy(clipboardData) {
          clipboardData.setCellAt(-2, 0, 'hello world');
          clipboardData.setCellAt(1, 1, 'hello world2');
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

      selectAll();

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe('hello world\tB-1-0\n' +
        'A-0-1\tB-1-1\n' +
        'A1\tB1\n' +
        'A2\thello world2');
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>' +
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr>' +
              '<th>hello world</th>' +
              '<th>B-1-0</th>' +
            '</tr>',
            '<tr>' +
              '<th>A-0-1</th>' +
              '<th>B-1-1</th>' +
            '</tr>',
          '</thead>',
          '<tbody>',
            '<tr>',
              '<td>A1</td>',
              '<td>B1</td>',
            '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td>hello world2</td>',
          '</tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>'
      ].join(''));
      /* eslint-enable */
    });
  });
});
