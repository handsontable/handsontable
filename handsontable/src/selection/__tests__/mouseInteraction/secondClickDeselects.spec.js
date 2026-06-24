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

  it('should keep the re-clicked cell as the active focus when ctrl+clicking (first cell)', async() => {
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

    // Ctrl+clicking an already-selected cell adds a new layer making it the active focus.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 1,1',
      'highlight: 3,1 from: 3,1 to: 3,1',
      'highlight: 5,1 from: 5,1 to: 5,1',
      'highlight: 7,1 from: 7,1 to: 7,1',
      'highlight: 1,1 from: 1,1 to: 1,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : B :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should keep the re-clicked cell as the active focus when ctrl+clicking (last cell)', async() => {
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
      'highlight: 7,1 from: 7,1 to: 7,1',
      'highlight: 7,1 from: 7,1 to: 7,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : 0 :   |
      |   ║   :   :   |
      | - ║   : B :   |
      |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should keep the re-clicked cell as the active focus when ctrl+clicking a partially hidden range (cut off by hidden columns)', async() => {
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

    // Ctrl+clicking an already-selected range adds a new single-cell layer at the clicked point.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,3 from: 1,1 to: 1,3',
      'highlight: 3,3 from: 3,1 to: 3,3',
      'highlight: 5,3 from: 5,1 to: 5,3',
      'highlight: 5,3 from: 5,3 to: 5,3',
    ]);
    expect(`
      |   ║ - :   |
      |===:===:===|
      |   ║   :   |
      | - ║ 0 :   |
      |   ║   :   |
      | - ║ 0 :   |
      |   ║   :   |
      | - ║ B :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should keep the re-clicked cell as the active focus when ctrl+clicking a partially hidden range (cut off by hidden rows)', async() => {
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
      'highlight: 3,5 from: 1,5 to: 3,5',
      'highlight: 3,5 from: 3,5 to: 3,5',
    ]);
    expect(`
      |   ║   : - :   : - :   : - |
      |===:===:===:===:===:===:===|
      | - ║   : 0 :   : 0 :   : B |
      |   ║   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not reset the focus position of the previous selection after ctrl+clicking a cell', async() => {
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

    await simulateClick(getCell(5, 5));

    // Ctrl+clicking (5,5) again keeps it as the active focus; the first range's focus
    // position (2,2) is preserved because we never remove the first range.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 2,2 from: 1,1 to: 3,3',
      'highlight: 5,5 from: 5,5 to: 5,5',
      'highlight: 5,5 from: 5,5 to: 5,5',
    ]);
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

    // With a single layer, ctrl+click adds a duplicate layer. The cell stays selected.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 1,1',
      'highlight: 1,1 from: 1,1 to: 1,1',
    ]);
    expect(`
      |   ║   : - :   |
      |===:===:===:===|
      |   ║   :   :   |
      | - ║   : B :   |
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

    // Each ctrl+click adds a duplicate; the cell stays selected and active.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,3 from: 1,1 to: 1,3',
      'highlight: 1,3 from: 1,3 to: 1,3',
      'highlight: 1,3 from: 1,3 to: 1,3',
      'highlight: 1,3 from: 1,3 to: 1,3',
    ]);
    expect(`
      |   ║ - :   |
      |===:===:===|
      |   ║   :   |
      | - ║ D :   |
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
      'highlight: 3,1 from: 3,1 to: 3,1',
      'highlight: 3,1 from: 3,1 to: 3,1',
      'highlight: 3,1 from: 3,1 to: 3,1',
    ]);
    expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : D :   :   :   |
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

  it('should keep the re-clicked cell as the active focus when it is defined within a bigger selection', async() => {
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

    // Each ctrl+click on (2,2) adds it as a layer. After 3 clicks we have 4 ranges total.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 1,1 from: 1,1 to: 3,3',
      'highlight: 2,2 from: 2,2 to: 2,2',
      'highlight: 2,2 from: 2,2 to: 2,2',
      'highlight: 2,2 from: 2,2 to: 2,2',
    ]);
    expect(`
      |   ║   : - : - : - :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : D : 0 :   |
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

  describe('with `disableVisualSelection` enabled', () => {
    it('should skip the dedup behavior when `disableVisualSelection: true`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: true,
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      // Ctrl+click on an already-selected cell adds a new layer; no dedup runs,
      // so the just-clicked cell stays as the active selection.
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });

    it('should skip the dedup behavior when `disableVisualSelection: \'current\'`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: 'current',
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });

    it('should skip the dedup behavior when `disableVisualSelection` is passed as an array', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: ['current', 'area'],
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });

    it('should skip the dedup behavior when `disableVisualSelection: \'area\'`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: 'area',
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });

    it('should not run dedup when `disableVisualSelection` is an empty array', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: [],
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      // No dedup runs for any value of disableVisualSelection — the duplicate layer is kept.
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });

    it('should not run dedup when `disableVisualSelection` is `false`', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        disableVisualSelection: false,
      });

      await selectCells([
        [0, 0, 0, 0],
        [1, 0, 1, 0],
        [1, 1, 1, 1],
      ]);

      await keyDown('control/meta');
      await simulateClick(getCell(1, 0));
      await keyUp('control/meta');

      // The duplicate layer is kept regardless of disableVisualSelection value.
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 1,0 from: 1,0 to: 1,0',
        'highlight: 1,1 from: 1,1 to: 1,1',
        'highlight: 1,0 from: 1,0 to: 1,0',
      ]);
    });
  });

  it('should not scroll the viewport when ctrl+clicking a cell that is already selected', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      colHeaders: true,
      rowHeaders: true,
      width: 200,
      height: 200,
    });

    await selectCells([
      [0, 0, 0, 0],
      [40, 0, 40, 0],
    ]);

    await scrollViewportTo({
      row: 40,
      col: 0,
    });

    const scrollTopBefore = topOverlay().getScrollPosition();
    const scrollLeftBefore = inlineStartOverlay().getScrollPosition();

    await keyDown('control/meta');
    await simulateClick(getCell(40, 0));

    expect(topOverlay().getScrollPosition()).toBe(scrollTopBefore);
    expect(inlineStartOverlay().getScrollPosition()).toBe(scrollLeftBefore);
    // The duplicate layer is kept; both layers for (40,0) remain.
    expect(getSelectedRange()).toEqualCellRange([
      'highlight: 0,0 from: 0,0 to: 0,0',
      'highlight: 40,0 from: 40,0 to: 40,0',
      'highlight: 40,0 from: 40,0 to: 40,0',
    ]);
  });
});
