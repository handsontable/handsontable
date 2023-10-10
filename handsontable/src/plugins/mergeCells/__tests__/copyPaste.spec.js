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

  it('should properly change copied values using `beforeCopy` hook (removing a part of merge areas)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(8, 8),
      rowHeaders: true,
      colHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 3, rowspan: 3, colspan: 3 }
      ],
      beforeCopy(actionInfo) {
        actionInfo.remove({ rows: [2], columns: [4] });
      }
    });

    const copyEvent = getClipboardEvent();
    const plugin = getPlugin('CopyPaste');

    selectAll();

    plugin.copy();
    plugin.onCopy(copyEvent); // emulate native "copy" event

    /* eslint-disable indent */
    expect(copyEvent.clipboardData.getData('text/html')).toEqual([
      '<meta name="generator" content="Handsontable"/>',
      '<style type="text/css">td{white-space:normal}br{mso-data-placement:same-cell}</style>',
      '<table>',
        '<tbody>',
          '<tr>',
            '<td>A1</td>',
            '<td>B1</td>',
            '<td>C1</td>',
            '<td>D1</td>',
            '<td>F1</td>',
            '<td>G1</td>',
            '<td>H1</td>',
          '</tr>',
          '<tr>',
            '<td>A2</td>',
            '<td colspan="2">B2</td>',
            '<td>D2</td>',
            '<td>F2</td>',
            '<td>G2</td>',
            '<td>H2</td>',
          '</tr>',
          '<tr>',
            '<td>A4</td>',
            '<td>B4</td>',
            '<td>C4</td>',
            '<td rowspan="3" colspan="2">D4</td>',
            '<td>G4</td>',
            '<td>H4</td>',
          '</tr>',
          '<tr>',
            '<td>A5</td>',
            '<td>B5</td>',
            '<td>C5</td>',
            '<td>G5</td>',
            '<td>H5</td>',
          '</tr>',
          '<tr>',
            '<td>A6</td>',
            '<td>B6</td>',
            '<td>C6</td>',
            '<td>G6</td>',
            '<td>H6</td>',
          '</tr>',
          '<tr>',
            '<td>A7</td>',
            '<td>B7</td>',
            '<td>C7</td>',
            '<td>D7</td>',
            '<td>F7</td>',
            '<td>G7</td>',
            '<td>H7</td>',
          '</tr>',
          '<tr>',
            '<td>A8</td>',
            '<td>B8</td>',
            '<td>C8</td>',
            '<td>D8</td>',
            '<td>F8</td>',
            '<td>G8</td>',
            '<td>H8</td>',
          '</tr>',
        '</tbody>',
      '</table>',
    ].join(''));
    /* eslint-enable */
  });
});
