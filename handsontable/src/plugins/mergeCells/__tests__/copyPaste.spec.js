describe('MergeCells copy and paste', () => {
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

  it('should properly copy single merged cell', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectCell(1, 1);

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
        '<tbody>',
          '<tr>',
            '<td rowspan="2" colspan="2">B2</td>',
          '</tr>',
          '<tr>',
          '</tr>',
        '</tbody>',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });
});
