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

  it('should paste the leading clipboard rows when the paste starts mid-page', async() => {
    // Unique clipboard rows are required: identical letters make keep-prefix and
    // keep-suffix truncation look the same, which is how DEV-1119 shipped green.
    handsontable({
      data: createSpreadsheetData(15, 3),
      pagination: {
        pageSize: 10,
      },
      copyPaste: true,
    });

    await selectCell(7, 1);

    getPlugin('CopyPaste').paste([
      'Summit Boots',
      'Zenith Hoodie',
      'Eclipse Scarf',
      'Horizon Cap',
      'Pulsar Socks',
      'Velocity Hat',
      'Aether Jacket',
      'Nimbus Gloves',
      'Quasar Belt',
      'Orbit Scarf',
    ].join('\n'));

    expect(getData()).toEqual([
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
      ['A4', 'B4', 'C4'],
      ['A5', 'B5', 'C5'],
      ['A6', 'B6', 'C6'],
      ['A7', 'B7', 'C7'],
      ['A8', 'Summit Boots', 'C8'],
      ['A9', 'Zenith Hoodie', 'C9'],
      ['A10', 'Eclipse Scarf', 'C10'],
      ['A11', 'B11', 'C11'],
      ['A12', 'B12', 'C12'],
      ['A13', 'B13', 'C13'],
      ['A14', 'B14', 'C14'],
      ['A15', 'B15', 'C15'],
    ]);
  });
});
