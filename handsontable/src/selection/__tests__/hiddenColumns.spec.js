describe('Selection cooperation with hidden columns', () => {
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

  it('should scroll viewport properly when selecting singe cell beyond the table boundaries (when some columns are hidden)', async() => {
    handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    await render();

    await selectCell(0, 15);

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting multiple cells beyond the table boundaries (when some columns are hidden)', async() => {
    handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    await render();

    await selectCells([[0, 4], [0, 15]]);

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should scroll viewport properly when selecting singe column beyond the table boundaries (when some columns are hidden)', async() => {
    handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(1, true);
    hidingMap.setValueAtIndex(2, true);
    await render();

    await selectColumns(15);

    expect(tableView()._wt.wtTable.getLastVisibleColumn()).toBe(12);
  });

  it('should move to the right throughout the table when the last column is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoWrapCol: true,
      autoWrapRow: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);
    await render();

    await selectCell(0, 0); // Select cell "A1"

    await keyDownUp('arrowright'); // Move selection to the right edge of the table
    await keyDownUp('arrowright'); // Move selection to first column, to the cell "A2"

    expect(getSelected()).toEqual([[1, 0, 1, 0]]);
  });

  it('should not throw an error after hiding already selected column when visual selection is disabled (#dev-2084)', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      disableVisualSelection: true,
    });

    await selectColumns(1);

    expect(() => {
      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValueAtIndex(2, true);
    }).not.toThrow();
  });

  // The cases below prove that the core Selection module honors a `'hiding'` index map registered
  // directly on the column index mapper - the public path an external developer takes
  // (`hot.columnIndexMapper.createAndRegisterIndexMap(name, 'hiding')`) - with no HiddenColumns plugin
  // present. The HiddenColumns plugin suite keeps its own equivalents for the plugin integration; these
  // pin the same behavior at the core level (DEV-153).
  describe('cell range and non-contiguous selection', () => {
    it('should keep hidden columns in a mouse-dragged cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      const startCell = getCell(0, 0);
      const endCell = getCell(0, 4);

      await mouseDown(startCell, 'LMB');
      await mouseOver(endCell);
      await mouseUp(endCell);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,4']);
      // Only columns 0 and 4 render - the hidden columns collapse out of the DOM while staying in the range.
      expect(`
        |   ║ - : - |
        |===:===:===|
        | - ║ A : 0 |
        |   ║   :   |
        |   ║   :   |
        |   ║   :   |
        |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select non-contiguous columns properly when there are some hidden columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 8),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, false, false, false, false, false, false]);
      await render();

      const startColumnHeader = getCell(-1, 4);
      const endColumnHeader = getCell(-1, 6);

      await mouseDown(startColumnHeader, 'LMB');
      await mouseUp(startColumnHeader);

      await keyDown('control/meta');

      await mouseDown(endColumnHeader, 'LMB');
      await mouseUp(endColumnHeader);

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,4 from: -1,4 to: 4,4',
        'highlight: 0,6 from: -1,6 to: 4,6'
      ]);
      // Columns 0 and 1 are hidden, so the two selected column layers render collapsed to the left.
      expect(`
        |   ║   :   : * :   : * :   |
        |===:===:===:===:===:===:===|
        | - ║   :   : 0 :   : A :   |
        | - ║   :   : 0 :   : 0 :   |
        | - ║   :   : 0 :   : 0 :   |
        | - ║   :   : 0 :   : 0 :   |
        | - ║   :   : 0 :   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('header highlighting', () => {
    it('should highlight proper headers when selection contains hidden columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, false, false]);
      await render();

      await selectCells([[1, 0, 2, 3]]);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 2,3']);
      expect(`
        |   ║ - : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        | - ║ A : 0 :   |
        | - ║ 0 : 0 :   |
        |   ║   :   :   |
        |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight a row header when all columns are hidden and the selected cell is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      // No column renders, yet the selected row's header stays marked.
      expect(`
        |   |
        |===|
        | - |
        |   |
        |   |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();

      await selectCell(2, 1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
      expect(`
        |   |
        |===|
        |   |
        |   |
        | - |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('API selection', () => {
    it('should select the entire table after `selectAll` when some columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, false, false, false]);
      await render();

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,-1 to: 4,4']);
    });

    it('should select the entire table after `selectAll` when all columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
    });

    it('should select the entire row after `selectRows` when the leading columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, false, false]);
      await render();

      await selectRows(0);

      // The focus slides off the hidden columns 0-2 onto the first visible column (3).
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,-1 to: 0,4']);
    });

    it('should select a hidden column internally after the `selectColumns` call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, false, false, false]);
      await render();

      await selectColumns(1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,1']);
    });

    it('should select columns after `selectColumns` when the range is partially hidden at the beginning', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectColumns(1, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,1 to: 4,4']);
    });

    it('should select columns after `selectColumns` when the range is hidden at the start and at the end', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, false, true, false]);
      await render();

      await selectColumns(1, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,3']);
    });
  });

  describe('keyboard navigation across hidden columns', () => {
    it('should move the selection right to the closest non-hidden cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectCell(0, 0);
      await keyDownUp('arrowright');

      expect(getSelected()).toEqual([[0, 4, 0, 4]]);
    });

    it('should move the selection left to the closest non-hidden cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectCell(0, 4);
      await keyDownUp('arrowleft');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not throw when navigating with all columns hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      columnIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectCell(0, 0);

      // No visible cell to move to - the selection stays put and no error is thrown.
      await keyDownUp('arrowright');
      await keyDownUp('arrowleft');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('redrawing the selection when the hiding map changes', () => {
    it('should keep a single-cell selection when a hidden column before it is shown', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValues([true, true, true, false, false]);
      await render();

      await selectCell(3, 3);

      hidingMap.setValueAtIndex(0, false);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);

      hidingMap.setValueAtIndex(1, false);
      hidingMap.setValueAtIndex(2, false);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
    });

    it('should keep a column selection when a selected column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      await render();
      await selectColumns(1, 2);

      hidingMap.setValueAtIndex(1, true);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,2']);
    });
  });
});
