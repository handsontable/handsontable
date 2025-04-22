describe('HiddenColumns', () => {
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

  describe('cell selection UI', () => {
    it('should select entire row by header if first column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      const header = getCell(0, -1);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if last column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      const header = getCell(0, -1);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if any column in the middle is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const header = getCell(0, -1);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - |
      |===:===:===|
      | * ║ A : 0 |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if all columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      const header = $('.ht_clone_inline_start .htCore')
        .find('tbody')
        .find('th')
        .eq(0);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   |
      |===|
      | * |
      |   |
      |   |
      |   |
      |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should keep hidden columns in cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      const startCell = getCell(0, 0);
      const endCell = getCell(0, 4);

      await mouseDown(startCell, 'LMB');
      await mouseOver(endCell);
      await mouseUp(endCell);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,4']);
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
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      const startColumn = getCell(-1, 4);
      const endColumn = getCell(-1, 6);

      await mouseDown(startColumn, 'LMB');
      await mouseUp(startColumn);

      await keyDown('control/meta');

      await mouseDown(endColumn, 'LMB');
      await mouseUp(endColumn);

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,4 from: -1,4 to: 4,4',
        'highlight: 0,6 from: -1,6 to: 4,6',
      ]);
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

    it('should select cells by using two layers when CTRL key is pressed and some columns are hidden', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 8,
        startCols: 12,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      await mouseDown(getCell(1, 3));
      await mouseOver(getCell(4, 6));
      await mouseUp(getCell(4, 6));

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 4,6']);
      expect(`
      |   ║   : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : A : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDown('control/meta');

      await mouseDown(getCell(3, 5));
      await mouseOver(getCell(5, 8));
      await mouseUp(getCell(5, 8));

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,3 from: 1,3 to: 4,6',
        'highlight: 3,5 from: 3,5 to: 5,8',
      ]);
      expect(`
      |   ║   : - : - : - : - : - : - :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
      | - ║   : 0 : 0 : B : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 0 : 1 : 1 : 0 : 0 :   :   :   |
      | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('should select entire table after the corner was clicked and', () => {
      it('just some columns were hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);

        await simulateClick(corner, 'LMB');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,-1 to: 4,4']);
        expect(`
        |   ║ - : - |
        |===:===:===|
        | - ║ A : 0 |
        | - ║ 0 : 0 |
        | - ║ 0 : 0 |
        | - ║ 0 : 0 |
        | - ║ 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('all columns were hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore')
          .find('thead')
          .find('th')
          .eq(0);

        await simulateClick(corner, 'LMB');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
        |   |
        |===|
        | - |
        | - |
        | - |
        | - |
        | - |
        `).toBeMatchToSelectionPattern();
      });
    });

    it('should move selection to the next visible cell on left' +
       'if column between is hidden even if afterSelection call updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(1, 3),
        hiddenColumns: {
          columns: [1],
        },
        afterSelection() {
          this.updateSettings({});
        },
      });

      await selectCell(0, 2);

      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      expect(`
      | # :   |
        `).toBeMatchToSelectionPattern();
    });
  });

  describe('cell selection (API)', () => {
    // Do we need this test case?
    it('should not throw any errors, when selecting a whole row with the last column hidden', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        hiddenColumns: {
          columns: [3]
        },
        rowHeaders: true,
      });

      let errorThrown = false;

      try {
        await selectCell(2, 0, 2, 3);

      } catch (err) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(false);
    });

    it('should highlight a proper headers when selection contains hidden columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2],
        },
      });

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

    it('should highlight a row header when all columns are hidden and selected cell is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
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

    it('should highlight a row header when all columns are hidden and selected cell is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
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

    it('should highlight a row header when all columns are hidden and selected cell is hidden (`single` selection mode)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        selectionMode: 'single',
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
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

      expect(getSelected()).toEqual([[2, 1, 2, 1]]);
      expect(getSelectedRangeLast().highlight.row).toBe(2);
      expect(getSelectedRangeLast().highlight.col).toBe(1);
      expect(getSelectedRangeLast().from.row).toBe(2);
      expect(getSelectedRangeLast().from.col).toBe(1);
      expect(getSelectedRangeLast().to.row).toBe(2);
      expect(getSelectedRangeLast().to.col).toBe(1);
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

    it('should select entire table after call selectAll if some columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1],
        },
      });

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,-1 to: 4,4']);
      expect(`
      | * ║ * : * : * |
      |===:===:===:===|
      | * ║ A : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire table after call selectAll if all of columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
      expect(`
      | * |
      |===|
      | * |
      | * |
      | * |
      | * |
      | * |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row after call selectRows if the first column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0],
        },
      });

      await selectRows(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row after call selectRows if the last column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [4],
        },
      });

      await selectRows(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row after call selectRows if columns between the first and the last are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectRows(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - |
      |===:===:===|
      | * ║ A : 0 |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      |   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select hidden column internally after the `selectColumns` call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
        },
      });

      await selectColumns(1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,1']);
      expect(`
      |   ║   :   :   :   |
      |===:===:===:===:===|
      | - ║   :   :   :   |
      | - ║   :   :   :   |
      | - ║   :   :   :   |
      | - ║   :   :   :   |
      | - ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the beginning of selection #1', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectColumns(1, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,1 to: 4,4']);
      expect(`
      |   ║   : * |
      |===:===:===|
      | - ║   : A |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the beginning of selection #2', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectColumns(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: -1,2 to: 4,4']);
      expect(`
      |   ║   : * |
      |===:===:===|
      | - ║   : A |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      | - ║   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the end of selection #1', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectColumns(0, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,2']);
      expect(`
      |   ║ * :   |
      |===:===:===|
      | - ║ A :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after the `selectColumns` call if range is partially hidden at the end of selection #2', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectColumns(0, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,3']);
      expect(`
      |   ║ * :   |
      |===:===:===|
      | - ║ A :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      | - ║ 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after call selectColumns if range is partially hidden in the middle of selection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2, 3],
        },
      });

      await selectColumns(0, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,4']);
      expect(`
      |   ║ * : * |
      |===:===:===|
      | - ║ A : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      | - ║ 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select columns after call selectColumns if range is partially hidden at the start and at the end of the range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      await selectColumns(1, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,3']);
      expect(`
      |   ║   : * :   |
      |===:===:===:===|
      | - ║   : A :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      | - ║   : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should regenerate the selection after hiding and showing columns it was in using `updateSettings`, ' +
      'without throwing any errors (#dev-2293)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        hiddenColumns: {
          columns: []
        },
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCell(0, 0);

      let errorThrown = false;

      try {
        await updateSettings({
          hiddenColumns: {
            columns: [0]
          },
        });

        await updateSettings({
          hiddenColumns: {
            columns: []
          },
        });

      } catch (err) {
        errorThrown = true;
      }

      expect(getSelected()).toEqual([[0, 0, 0, 0]]);
      expect(getCell(0, 0, true)).toHaveClass('current');
      expect(errorThrown).toBe(false);
    });
  });

  describe('redrawing rendered selection when the selected range has been changed', () => {
    describe('by showing columns placed before the current selection', () => {
      it('single cell was selected', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        await selectCell(3, 3);

        getPlugin('hiddenColumns').showColumns([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   : # :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   :   : # :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      describe('entire row was selected and', () => {
        it('columns at the start had been hidden and were showed', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            hiddenColumns: {
              columns: [0, 1],
            },
          });

          await selectRows(0);

          getPlugin('hiddenColumns').showColumns([1]);
          await render();

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,-1 to: 0,4']);
          expect(`
          |   ║ - : - : - : - |
          |===:===:===:===:===|
          | * ║ A : 0 : 0 : 0 |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          |   ║   :   :   :   |
          `).toBeMatchToSelectionPattern();

          getPlugin('hiddenColumns').showColumns([0]);
          await render();

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
          expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          | * ║ A : 0 : 0 : 0 : 0 |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });

      it('non-contiguous selection', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 8,
          startCols: 12,
          hiddenColumns: {
            columns: [0, 1, 2],
          },
        });

        await mouseDown(getCell(1, 3));
        await mouseOver(getCell(4, 6));
        await mouseUp(getCell(4, 6));

        await keyDown('control/meta');

        await mouseDown(getCell(3, 5));
        await mouseOver(getCell(5, 8));
        await mouseUp(getCell(5, 8));

        await mouseDown(getCell(3, 6));
        await mouseOver(getCell(6, 9));
        await mouseUp(getCell(6, 9));

        await keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║ - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║ 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║   :   :   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by hiding columns placed before the current selection', () => {
      it('single cell was selected', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenColumns: true,
        });

        await selectCell(3, 3);

        getPlugin('hiddenColumns').hideColumns([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
        |   ║   : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   : # :   |
        |   ║   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
        |   ║ - :   |
        |===:===:===|
        |   ║   :   |
        |   ║   :   |
        |   ║   :   |
        | - ║ # :   |
        |   ║   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('non-contiguous selection', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 8,
          startCols: 12,
          hiddenColumns: true,
        });

        await mouseDown(getCell(1, 3));
        await mouseOver(getCell(4, 6));
        await mouseUp(getCell(4, 6));

        await keyDown('control/meta');

        await mouseDown(getCell(3, 5));
        await mouseOver(getCell(5, 8));
        await mouseUp(getCell(5, 8));

        await mouseDown(getCell(3, 6));
        await mouseOver(getCell(6, 9));
        await mouseUp(getCell(6, 9));

        await keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║   :   :   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   :   :   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║   : - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║   : 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║   : 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 4,6',
          'highlight: 3,5 from: 3,5 to: 5,8',
          'highlight: 3,6 from: 3,6 to: 6,9',
        ]);
        expect(`
        |   ║ - : - : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   :   :   :   |
        | - ║ 0 : 0 : 1 : C : 1 : 1 : 0 :   :   |
        | - ║ 0 : 0 : 1 : 2 : 1 : 1 : 0 :   :   |
        | - ║   :   : 0 : 1 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by showing hidden,', () => {
      it('selected columns', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1, 2],
          },
        });

        await selectColumns(1, 2);

        getPlugin('hiddenColumns').showColumns([2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,2']);
        expect(`
        |   ║   : * :   :   |
        |===:===:===:===:===|
        | - ║   : A :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').showColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,2']);
        expect(`
        |   ║   : * : * :   :   |
        |===:===:===:===:===:===|
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1],
          },
        });

        await selectCell(3, 1);

        getPlugin('hiddenColumns').showColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 3,1']);
        expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (just a few)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [1],
          },
        });

        await selectCells([[3, 1], [0, 1], [0, 1]]);

        getPlugin('hiddenColumns').showColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 3,1',
          'highlight: 0,1 from: 0,1 to: 0,1',
          'highlight: 0,1 from: 0,1 to: 0,1',
        ]);
        expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : B :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : 0 :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (all of them)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: {
            columns: [0, 1, 2, 3, 4],
          },
        });

        await selectAll();

        getPlugin('hiddenColumns').showColumns([0, 1, 2, 3, 4]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });
    });

    it('by showing columns from a selection containing hidden columns at the start and at the end of the range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 3],
        },
      });

      await selectColumns(1, 3);

      getPlugin('hiddenColumns').showColumns([3]);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,3']);
      expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([1]);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,3']);
      expect(`
      |   ║   : * : * : * :   |
      |===:===:===:===:===:===|
      | - ║   : A : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('by hiding', () => {
      it('selected columns', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        await selectColumns(1, 2);

        getPlugin('hiddenColumns').hideColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,2']);
        expect(`
        |   ║   : * :   :   |
        |===:===:===:===:===|
        | - ║   : A :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenColumns').hideColumns([2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,1 to: 4,2']);
        expect(`
        |   ║   :   :   |
        |===:===:===:===|
        | - ║   :   :   |
        | - ║   :   :   |
        | - ║   :   :   |
        | - ║   :   :   |
        | - ║   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        await selectCell(3, 1);

        getPlugin('hiddenColumns').hideColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 3,1']);
        expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        await selectCells([[3, 1], [0, 1], [0, 1]]);

        getPlugin('hiddenColumns').hideColumns([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 3,1',
          'highlight: 0,1 from: 0,1 to: 0,1',
          'highlight: 0,1 from: 0,1 to: 0,1',
        ]);
        expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        | - ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('all selected cells', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenColumns: true,
        });

        await selectAll();

        getPlugin('hiddenColumns').hideColumns([0, 1, 2, 3, 4]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
        | * |
        |===|
        | * |
        | * |
        | * |
        | * |
        | * |
        `).toBeMatchToSelectionPattern();
      });
    });

    it('showed columns on a table with all columns hidden and with selected entire row', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [0, 1, 2, 3, 4],
        },
      });

      await selectRows(0);

      getPlugin('hiddenColumns').showColumns([4]);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - |
      |===:===|
      | * ║ A |
      |   ║   |
      |   ║   |
      |   ║   |
      |   ║   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([1, 2, 3]);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenColumns').showColumns([0]);
      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });
});
