describe('Selection using mouse interaction (cell deselect)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to deselect single cell (deselecting from top to bottom)', async() => {
    handsontable({
      data: createSpreadsheetData(9, 3),
      colHeaders: true,
      rowHeaders: true,
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
      'highlight: 3,1 from: 3,1 to: 3,1',
      'highlight: 5,1 from: 5,1 to: 5,1',
      'highlight: 7,1 from: 7,1 to: 7,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : A :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(3, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 5,1 from: 5,1 to: 5,1',
      'highlight: 7,1 from: 7,1 to: 7,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : A :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(5, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 7,1 from: 7,1 to: 7,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      | - ║   : # :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single cell (deselecting from bottom to top)', async() => {
    handsontable({
      data: createSpreadsheetData(9, 3),
      colHeaders: true,
      rowHeaders: true,
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
      'highlight: 1,1 from: 1,1 to: 1,1',
      'highlight: 3,1 from: 3,1 to: 3,1',
      'highlight: 5,1 from: 5,1 to: 5,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : A :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(5, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 1,1',
      'highlight: 3,1 from: 3,1 to: 3,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : A :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(3, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 1,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : # :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single cell that is partially hidden (cut off by hidden columns)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 5),
      colHeaders: true,
      rowHeaders: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    await render();
    await selectCells([
      [1, 1, 1, 3],
      [3, 1, 3, 3],
      [5, 1, 5, 3],
    ]);
    await keyDown('control/meta');
    await simulateClick(getCell(5, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,3 from: 1,1 to: 1,3',
      'highlight: 3,3 from: 3,1 to: 3,3',
    ]);
    expect(`
      |   ║ - :   |
      |===:===:===|
      |   ║   :   |
      | - ║ 0 :   |
      |   ║   :   |
      | - ║ A :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(3, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,3 from: 1,1 to: 1,3',
    ]);
    expect(`
      |   ║ - :   |
      |===:===:===|
      |   ║   :   |
      | - ║ A :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single cell that is partially hidden (cut off by hidden rows)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 6),
      colHeaders: true,
      rowHeaders: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    await render();
    await selectCells([
      [1, 1, 3, 1],
      [1, 3, 3, 3],
      [1, 5, 3, 5],
    ]);
    await keyDown('control/meta');
    await simulateClick(getCell(3, 5));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 3,1 from: 1,1 to: 3,1',
      'highlight: 3,3 from: 1,3 to: 3,3',
    ]);
    expect(`
      |   ║   : - :   : - :   :   |
      |===:===:===:===:===:===:===|
      | - ║   : 0 :   : A :   :   |
      |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(3, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 3,1 from: 1,1 to: 3,1',
    ]);
    expect(`
      |   ║   : - :   :   :   :   |
      |===:===:===:===:===:===:===|
      | - ║   : A :   :   :   :   |
      |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not reset the focus position of the previous selection after deselecting a cell', async() => {
    handsontable({
      data: createSpreadsheetData(7, 7),
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCell(1, 1, 3, 3);
    await keyDownUp('tab');
    await keyDownUp('enter');
    await keyDown('control/meta');
    await simulateClick(getCell(5, 5));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,2 from: 1,1 to: 3,3',
      'highlight: 5,5 from: 5,5 to: 5,5',
    ]);
    expect(`
      |   ║   : - : - : - :   : - :   |
      |===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   |
      | - ║   :   :   :   :   : A :   |
      |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

    await keyDown('control/meta');
    await simulateClick(getCell(5, 5));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,2 from: 1,1 to: 3,3',
    ]);
    expect(`
      |   ║   : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 :   :   :   |
      | - ║   : 0 : A : 0 :   :   :   |
      | - ║   : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect single cell when there is only one selection layer', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCell(1, 1);

    await keyDown('control/meta');
    await simulateClick(getCell(1, 1));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : # :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect single cell when there is only one selection layer and it is partially hidden (cut off by hidden columns)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    await render();
    await selectCells([
      [1, 1, 1, 3],
    ]);
    await keyDown('control/meta');
    await simulateClick(getCell(1, 3));
    await simulateClick(getCell(1, 3));
    await simulateClick(getCell(1, 3));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,3 from: 1,1 to: 1,3',
    ]);
    expect(`
      |   ║ - :   |
      |===:===:===|
      |   ║   :   |
      | - ║ A :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect single cell when there is only one selection layer and it is partially hidden (cut off by hidden rows)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);

    await render();
    await selectCells([
      [1, 1, 3, 1],
    ]);
    await keyDown('control/meta');
    await simulateClick(getCell(3, 1));
    await simulateClick(getCell(3, 1));
    await simulateClick(getCell(3, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 3,1 from: 1,1 to: 3,1',
    ]);
    expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : A :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect single cell for `selectionMode` set as `single`', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCell(1, 1);

    await keyDown('control/meta');
    await simulateClick(getCell(1, 1));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : # :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect single cell for `selectionMode` set as `range`', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      selectionMode: 'range',
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCell(1, 1);

    await keyDown('control/meta');
    await simulateClick(getCell(1, 1));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : # :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should be possible to deselect single cell when it is defined within a bigger selection', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCell(1, 1, 3, 3);

    await keyDown('control/meta');
    await simulateClick(getCell(2, 2));
    await simulateClick(getCell(2, 2));
    await simulateClick(getCell(2, 2));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 3,3',
      'highlight: 2,2 from: 2,2 to: 2,2',
    ]);
    expect(`
      |   ║   : - : - : - :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : B : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect selection when the range points to row headers only', async() => {
    handsontable({
      data: createSpreadsheetData(3, 0),
      navigableHeaders: true,
      colHeaders: true,
      rowHeaders: true,
    });

    await simulateClick(getCell(0, -1));
    await keyDown('control/meta');
    await simulateClick(getCell(1, -1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 0,-1 from: 0,-1 to: 0,-1',
      'highlight: 1,-1 from: 1,-1 to: 1,-1',
    ]);
    expect(`
      |   |
      |===|
      | * |
      | # |
      |   |
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(1, -1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 0,-1 from: 0,-1 to: 0,-1',
      'highlight: 1,-1 from: 1,-1 to: 1,-1',
      'highlight: 1,-1 from: 1,-1 to: 1,-1',
    ]);
    expect(`
      |   |
      |===|
      | * |
      | # |
      |   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not be possible to deselect selection when the range points to column headers only', async() => {
    handsontable({
      data: createSpreadsheetData(0, 3),
      columns: [{}, {}, {}],
      navigableHeaders: true,
      colHeaders: true,
      rowHeaders: true,
    });

    await simulateClick(getCell(-1, 0));
    await keyDown('control/meta');
    await simulateClick(getCell(-1, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: -1,0 from: -1,0 to: -1,0',
      'highlight: -1,1 from: -1,1 to: -1,1',
    ]);
    expect(`
      |   ║ * : # :   |
      |===:===:===:===|
      `).toBeMatchToSelectionPattern();

    await simulateClick(getCell(-1, 1));

    expect(getSelectedRange()).toEqualCellRange([
      'highlight: -1,0 from: -1,0 to: -1,0',
      'highlight: -1,1 from: -1,1 to: -1,1',
      'highlight: -1,1 from: -1,1 to: -1,1',
    ]);
    expect(`
      |   ║ * : # :   |
      |===:===:===:===|
      `).toBeMatchToSelectionPattern();
  });
});
