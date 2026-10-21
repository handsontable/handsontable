describe('Selection cooperation with hidden rows', () => {
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

  it('should move down throughout the table when the last row is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoWrapCol: true,
      autoWrapRow: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);
    await render();

    await selectCell(0, 0); // Select cell "A1"

    await keyDownUp('arrowdown'); // Move selection down to the end of the table
    await keyDownUp('arrowdown'); // Move selection to the next column, to the cell "B1"

    expect(getSelected()).toEqual([[0, 1, 0, 1]]);
  });

  // The cases below prove that the core Selection module honors a `'hiding'` index map registered
  // directly on the row index mapper - the public path an external developer takes
  // (`hot.rowIndexMapper.createAndRegisterIndexMap(name, 'hiding')`) - with no HiddenRows plugin
  // present. The HiddenRows plugin suite keeps its own equivalents for the plugin integration; these
  // pin the same behavior at the core level (DEV-153).
  describe('cell range and non-contiguous selection', () => {
    it('should keep hidden rows in a mouse-dragged cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      const startCell = getCell(0, 0);
      const endCell = getCell(4, 0);

      await mouseDown(startCell, 'LMB');
      await mouseOver(endCell);
      await mouseUp(endCell);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,0']);
      // Only rows 0 and 4 render - the hidden rows collapse out of the DOM while staying in the range.
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select non-contiguous rows properly when there are some hidden rows', async() => {
      handsontable({
        data: createSpreadsheetData(8, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, false, false, false, false, false, false]);
      await render();

      const startRowHeader = getCell(4, -1);
      const endRowHeader = getCell(6, -1);

      await mouseDown(startRowHeader, 'LMB');
      await mouseUp(startRowHeader);

      await keyDown('control/meta');

      await mouseDown(endRowHeader, 'LMB');
      await mouseUp(endRowHeader);

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 4,0 from: 4,-1 to: 4,4',
        'highlight: 6,0 from: 6,-1 to: 6,4'
      ]);
      // Rows 0 and 1 are hidden, so the two selected row layers render collapsed above.
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('header highlighting', () => {
    it('should highlight proper headers when selection contains hidden rows', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, false, false]);
      await render();

      await selectCells([[0, 1, 3, 2]]);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 3,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight a column header when all rows are hidden and the selected cell is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();

      await selectCell(1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('API selection', () => {
    it('should select the entire table after `selectAll` when some rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, false, false, false]);
      await render();

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: -1,-1 to: 4,4']);
    });

    it('should select the entire table after `selectAll` when all rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
    });

    it('should select the entire column after `selectColumns` when the leading rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, false, false]);
      await render();

      await selectColumns(0);

      // The focus slides off the hidden rows 0-2 onto the first visible row (3).
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: -1,0 to: 4,0']);
    });

    it('should select a hidden row internally after the `selectRows` call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, false, false, false]);
      await render();

      await selectRows(1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 1,4']);
    });

    it('should select rows after `selectRows` when the range is partially hidden at the beginning', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectRows(1, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 1,-1 to: 4,4']);
    });

    it('should select rows after `selectRows` when the range is hidden at the start and at the end', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, false, true, false]);
      await render();

      await selectRows(1, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 3,4']);
    });
  });

  describe('keyboard navigation across hidden rows', () => {
    it('should move the selection down to the closest non-hidden cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectCell(0, 0);
      await keyDownUp('arrowdown');

      expect(getSelected()).toEqual([[4, 0, 4, 0]]);
    });

    it('should move the selection up to the closest non-hidden cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([false, true, true, true, false]);
      await render();

      await selectCell(4, 0);
      await keyDownUp('arrowup');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });

    it('should not throw when navigating with all rows hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      rowIndexMapper()
        .createAndRegisterIndexMap('my-hiding-map', 'hiding')
        .setValues([true, true, true, true, true]);
      await render();

      await selectCell(0, 0);

      // No visible cell to move to - the selection stays put and no error is thrown.
      await keyDownUp('arrowdown');
      await keyDownUp('arrowup');

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
    });
  });

  describe('redrawing the selection when the hiding map changes', () => {
    it('should keep a single-cell selection when a hidden row before it is shown', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

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

    it('should keep a row selection when a selected row is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      await render();
      await selectRows(1, 2);

      hidingMap.setValueAtIndex(1, true);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 2,4']);
    });
  });
});
