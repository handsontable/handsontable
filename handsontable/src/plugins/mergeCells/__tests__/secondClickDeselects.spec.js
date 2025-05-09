describe('MergeCells selection using mouse interaction (cell deselect)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to deselect single merged cell (deselecting from top to bottom)', async() => {
    handsontable({
      data: createSpreadsheetData(9, 4),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
        { row: 7, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCells([
      [1, 1, 1, 1],
      [3, 1, 3, 1],
      [5, 1, 5, 1],
      [7, 1, 7, 1],
    ]);

    await keyDown('control/meta');
    await simulateClick(getCell(1, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 3,1 from: 3,1 to: 4,2',
      'highlight: 5,1 from: 5,1 to: 6,2',
      'highlight: 7,1 from: 7,1 to: 8,2',
    ]);
    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :       :   |
      |   ║   :       :   |
      | - ║   : 0     :   |
      | - ║   :       :   |
      | - ║   : 1     :   |
      | - ║   :       :   |
      | - ║   : A     :   |
      | - ║   :       :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(3, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 5,1 from: 5,1 to: 6,2',
      'highlight: 7,1 from: 7,1 to: 8,2',
    ]);
    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      | - ║   : 0     :   |
      | - ║   :       :   |
      | - ║   : A     :   |
      | - ║   :       :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(5, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 7,1 from: 7,1 to: 8,2',
    ]);
    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      | - ║   : #     :   |
      | - ║   :       :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single merged cell (deselecting from bottom to top)', async() => {
    handsontable({
      data: createSpreadsheetData(9, 4),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 2 },
        { row: 3, col: 1, rowspan: 2, colspan: 2 },
        { row: 5, col: 1, rowspan: 2, colspan: 2 },
        { row: 7, col: 1, rowspan: 2, colspan: 2 },
      ],
    });

    await selectCells([
      [1, 1, 1, 1],
      [3, 1, 3, 1],
      [5, 1, 5, 1],
      [7, 1, 7, 1],
    ]);

    await keyDown('control/meta');
    await simulateClick(getCell(7, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 2,2',
      'highlight: 3,1 from: 3,1 to: 4,2',
      'highlight: 5,1 from: 5,1 to: 6,2',
    ]);

    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : 0     :   |
      | - ║   :       :   |
      | - ║   : 1     :   |
      | - ║   :       :   |
      | - ║   : A     :   |
      | - ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(5, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 2,2',
      'highlight: 3,1 from: 3,1 to: 4,2',
    ]);
    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : 0     :   |
      | - ║   :       :   |
      | - ║   : A     :   |
      | - ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(3, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 2,2',
    ]);
    expect(`
      |   ║   : - : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   : #     :   |
      | - ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      |   ║   :       :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single merged cell that is partially hidden (cut off by hidden columns)', async() => {
    handsontable({
      data: createSpreadsheetData(7, 5),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 2, colspan: 3 },
        { row: 3, col: 1, rowspan: 2, colspan: 3 },
        { row: 5, col: 1, rowspan: 2, colspan: 3 },
        { row: 7, col: 1, rowspan: 2, colspan: 3 },
      ],
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);

    await render();
    await selectCells([
      [1, 1, 1, 3],
      [3, 1, 3, 3],
      [5, 1, 5, 3],
    ]);

    await keyDown('control/meta');
    await simulateClick(getCell(5, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,2 from: 1,1 to: 2,3',
      'highlight: 3,2 from: 3,1 to: 4,3',
    ]);
    expect(`
      |   ║ - : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║ 0     :   |
      | - ║       :   |
      | - ║ A     :   |
      | - ║       :   |
      |   ║       :   |
      |   ║       :   |
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(3, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,2 from: 1,1 to: 2,3',
    ]);
    expect(`
      |   ║ - : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║ #     :   |
      | - ║       :   |
      |   ║       :   |
      |   ║       :   |
      |   ║       :   |
      |   ║       :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single merged cell that is partially hidden (cut off by hidden rows)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 7),
      colHeaders: true,
      rowHeaders: true,
      mergeCells: [
        { row: 1, col: 1, rowspan: 3, colspan: 2 },
        { row: 1, col: 3, rowspan: 3, colspan: 2 },
        { row: 1, col: 5, rowspan: 3, colspan: 2 },
        { row: 1, col: 7, rowspan: 3, colspan: 2 },
      ],
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);

    await render();
    await selectCells([
      [1, 1, 3, 1],
      [1, 3, 3, 3],
      [1, 5, 3, 5],
    ]);
    await keyDown('control/meta');
    await simulateClick(getCell(3, 5));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,1 from: 1,1 to: 3,2',
      'highlight: 2,3 from: 1,3 to: 3,4',
    ]);
    expect(`
      |   ║   : - : - : - : - :   :   |
      |===:===:===:===:===:===:===:===|
      | - ║   : 0     : A     :       |
      | - ║   :                       |
      |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(3, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,1 from: 1,1 to: 3,2',
    ]);
    expect(`
      |   ║   : - : - :   :   :   :   |
      |===:===:===:===:===:===:===:===|
      | - ║   : #     :       :       |
      | - ║   :                       |
      |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });
});
