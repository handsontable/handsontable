describe('Integration with other plugins', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Core `getColHeader` method', () => {
    it('should return column header values based on the nested headers configuration', () => {
      handsontable({
        data: [['1', '2', '3', '4', '5', '6']],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        nestedHeaders: [
          ['A1', { label: 'B1', colspan: 4 }, 'F1'],
          ['A2', { label: 'B2', colspan: 3 }, 'E2', 'F2'],
          ['A3', 'B3', { label: 'C3', colspan: 2 }, 'E3', 'F3'],
        ],
      });

      expect(getColHeader(0)).toBe('A3');
      expect(getColHeader(1)).toBe('B3');
      expect(getColHeader(2)).toBe('C3');
      expect(getColHeader(3)).toBe('C3');
      expect(getColHeader(4)).toBe('E3');
      expect(getColHeader(5)).toBe('F3');
      expect(getColHeader(6)).toBe('');
      expect(getColHeader(7)).toBe('');

      expect(getColHeader(1, -1)).toBe('B3');
      expect(getColHeader(1, -2)).toBe('B2');
      expect(getColHeader(1, -3)).toBe('B1');
      expect(getColHeader(1, -4)).toBe('');
      expect(getColHeader(1, -40)).toBe('');

      expect(getColHeader(1, 0)).toBe('B1');
      expect(getColHeader(1, 1)).toBe('B2');
      expect(getColHeader(1, 2)).toBe('B3');
      expect(getColHeader(1, 3)).toBe('');
      expect(getColHeader(1, 30)).toBe('');
    });
  });

  describe('DropdownMenu', () => {
    it('should not block the opening of the dropdown menu after clicking on its header button, when all the rows are' +
      ' trimmed', () => {
      const afterDropdownMenuShow = jasmine.createSpy('afterDropdownMenuShow');

      handsontable({
        data: [[null, null]],
        colHeaders: true,
        rowHeaders: true,
        dropdownMenu: true,
        trimRows: [0],
        nestedHeaders: [
          ['A', 'B']
        ],
        afterDropdownMenuShow,
      });

      getTopClone().find('thead tr th:eq(2) button')
        .simulate('mousedown')
        .simulate('mouseup')
        .simulate('click');

      expect(afterDropdownMenuShow).toHaveBeenCalledTimes(1);
    });
  });

  describe('CopyPaste', () => {
    beforeEach(() => {
      // Installing spy stabilizes the tests. Without that on CI and real browser there are some
      // differences in results.
      spyOn(document, 'execCommand');
    });

    it('should copy and paste cells and all column nested headers to the clipboard (single level)', () => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
          copyColumnGroupHeaders: true,
          copyColumnHeadersOnly: true,
        },
        nestedHeaders: [
          [{ label: 'a1', colspan: 3 }, 'b1'],
          [{ label: 'a2', colspan: 2 }, 'b2', 'c2'],
          [{ label: 'a3', colspan: 2 }, 'b3', 'c3'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyWithColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe([
        'a3\t\tb3\tc3',
        'A1\tB1\tC1\tD1',
        'A2\tB2\tC2\tD2',
      ].join('\n'));
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>',
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr><th colspan=2>a3</th><th>b3</th><th>c3</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><td>A1</td><td>B1</td><td>C1</td><td>D1</td></tr>',
            '<tr><td>A2</td><td>B2</td><td>C2</td><td>D2</td></tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>',
      ].join(''));
      /* eslint-enable */

      selectCell(0, 0);

      plugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['a3', '', 'b3', 'c3'],
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
      ]);
    });

    it('should copy and paste cells and all column nested headers to the clipboard (multi level)', () => {
      handsontable({
        data: createSpreadsheetData(2, 4),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
          copyColumnGroupHeaders: true,
          copyColumnHeadersOnly: true,
        },
        nestedHeaders: [
          [{ label: 'a1', colspan: 3 }, 'b1'],
          [{ label: 'a2', colspan: 2 }, 'b2', 'c2'],
          [{ label: 'a3', colspan: 2 }, 'b3', 'c3'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectAll();

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe([
        'a1\t\t\tb1',
        'a2\t\tb2\tc2',
        'a3\t\tb3\tc3',
        'A1\tB1\tC1\tD1',
        'A2\tB2\tC2\tD2',
      ].join('\n'));
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>',
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr><th colspan=3>a1</th><th>b1</th></tr>',
            '<tr><th colspan=2>a2</th><th>b2</th><th>c2</th></tr>',
            '<tr><th colspan=2>a3</th><th>b3</th><th>c3</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr><td>A1</td><td>B1</td><td>C1</td><td>D1</td></tr>',
            '<tr><td>A2</td><td>B2</td><td>C2</td><td>D2</td></tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>',
      ].join(''));
      /* eslint-enable */

      selectCell(0, 0);

      plugin.onPaste(copyEvent);

      expect(getData()).toEqual([
        ['a1', '', '', 'b1'],
        ['a2', '', 'b2', 'c2'],
        ['a3', '', 'b3', 'c3'],
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
      ]);
    });

    it('should copy part of nested header properly', () => {
      handsontable({
        data: createSpreadsheetData(2, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        copyPaste: {
          copyColumnHeaders: true,
          copyColumnGroupHeaders: true,
          copyColumnHeadersOnly: true,
        },
        nestedHeaders: [
          [{ label: 'a1', colspan: 4 }, 'c1'],
          [{ label: 'a2', colspan: 2 }, { label: 'b2', colspan: 2 }, 'c2', 'd2'],
          [{ label: 'a3', colspan: 2 }, { label: 'b3', colspan: 2 }, 'c3', 'd2'],
        ],
      });

      const copyEvent = getClipboardEvent();
      const plugin = getPlugin('CopyPaste');

      selectColumns(0, 1);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe([
        'a1\t',
        'a2\t',
        'a3\t',
        'A1\tB1',
        'A2\tB2',
      ].join('\n'));
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>',
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr><th colspan=2>a1</th></tr>',
            '<tr><th colspan=2>a2</th></tr>',
            '<tr><th colspan=2>a3</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr>',
              '<td>A1</td>',
              '<td>B1</td>',
            '</tr>',
            '<tr>',
              '<td>A2</td>',
              '<td>B2</td>',
            '</tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>',
      ].join(''));
      /* eslint-enable */

      selectColumns(2, 3);

      plugin.copyWithAllColumnHeaders();
      plugin.onCopy(copyEvent); // emulate native "copy" event

      expect(copyEvent.clipboardData.getData('text/plain')).toBe([
        'a1\t',
        'b2\t',
        'b3\t',
        'C1\tD1',
        'C2\tD2',
      ].join('\n'));
      /* eslint-disable indent */
      expect(copyEvent.clipboardData.getData('text/html')).toBe([
        '<meta name="generator" content="Handsontable"/>',
        '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
        '<table>',
        '<!--StartFragment-->',
          '<thead>',
            '<tr><th colspan=2>a1</th></tr>',
            '<tr><th colspan=2>b2</th></tr>',
            '<tr><th colspan=2>b3</th></tr>',
          '</thead>',
          '<tbody>',
            '<tr>',
              '<td>C1</td>',
              '<td>D1</td>',
            '</tr>',
            '<tr>',
              '<td>C2</td>',
              '<td>D2</td>',
            '</tr>',
          '</tbody>',
        '<!--EndFragment-->',
        '</table>',
      ].join(''));
      /* eslint-enable */
    });
  });
});
