describe('Pagination integration with CopyPaste', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should paste data only for the currently selected page', async() => {
    handsontable({
      data: createSpreadsheetData(7, 7),
      pagination: {
        pageSize: 5,
      },
      copyPaste: true,
    });

    await selectCell(0, 0);

    getPlugin('CopyPaste').paste('a\na\na\na\na\na\na\na\na\na');

    await selectCell(2, 2);

    getPlugin('CopyPaste').paste('b\nb\nb\nb\nb\nb\nb\nb\nb\nb');

    await selectCell(4, 4);

    getPlugin('CopyPaste').paste('c\nc\nc\nc\nc\nc\nc\nc\nc\nc');

    await selectCell(6, 6);

    getPlugin('CopyPaste').paste('d\nd\nd\nd\nd\nd\nd\nd\nd\nd');

    expect(getData()).toEqual([
      ['a', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
      ['a', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
      ['a', 'B3', 'b', 'D3', 'E3', 'F3', 'G3'],
      ['a', 'B4', 'b', 'D4', 'E4', 'F4', 'G4'],
      ['a', 'B5', 'b', 'D5', 'c', 'F5', 'G5'],
      ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6'],
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'],
    ]);
  });
});
