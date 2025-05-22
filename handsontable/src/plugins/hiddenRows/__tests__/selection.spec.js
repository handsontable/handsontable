describe('HiddenRows', () => {
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
        hiddenRows: {
          rows: [0],
        },
      });

      const header = getCell(-1, 0);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if last column is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
        },
      });

      const header = getCell(-1, 0);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if any column in the middle is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      const header = getCell(-1, 0);

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if all rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      const header = $('.ht_clone_inline_start .htCore thead tr th').eq(0); // The corner

      await simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should keep hidden rows in cell range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      const startCell = getCell(0, 0);
      const endCell = getCell(4, 0);

      await mouseDown(startCell, 'LMB');
      await mouseOver(endCell);
      await mouseUp(endCell);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,0']);
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
        hiddenRows: {
          rows: [0, 1],
        },
      });

      const startColumn = getCell(4, -1);
      const endColumn = getCell(6, -1);

      await mouseDown(startColumn, 'LMB');
      await mouseUp(startColumn);

      await keyDown('control/meta');

      await mouseDown(endColumn, 'LMB');
      await mouseUp(endColumn);

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 4,0 from: 4,-1 to: 4,4',
        'highlight: 6,0 from: 6,-1 to: 6,4'
      ]);
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

    it('should select cells by using two layers when CTRL key is pressed and some rows are hidden', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 12,
        startCols: 8,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      await mouseDown(getCell(3, 1));

      $(getCell(6, 4)).simulate('mouseover').simulate('mouseup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 3,1 to: 6,4']);
      expect(`
        |   ║   : - : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : A : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDown('control/meta');
      await mouseDown(getCell(5, 3));

      $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

      await keyUp('control/meta');

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 3,1 from: 3,1 to: 6,4',
        'highlight: 5,3 from: 5,3 to: 8,5',
      ]);
      expect(`
        |   ║   : - : - : - : - : - :   :   |
        |===:===:===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : 0 : 0 :   :   :   |
        | - ║   : 0 : 0 : B : 1 : 0 :   :   |
        | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   |
        | - ║   :   :   : 0 : 0 : 0 :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should properly render selection if mouse moved over hidden row', async() => {
      spec().$container.css({ margin: '35px' });

      handsontable({
        data: createSpreadsheetData(2, 1),
        colHeaders: true,
        contextMenu: true,
        hiddenRows: {
          rows: [0],
        },
      });

      const $cellA2 = $(getCell(1, 0));
      const $headerA = $(getCell(-1, 0));

      $cellA2.simulate('mousedown');
      $headerA.simulate('mouseover');
      $headerA.simulate('mouseup');

      const $wtBorderAreas = spec().$container.find('.wtBorder.area');
      const $topBorderArea = $wtBorderAreas.eq(0);
      const $leftBorderArea = $wtBorderAreas.eq(1);

      expect(getSelected()).toEqual([[1, 0, 0, 0]]);
      expect(`
      | - |
      |===|
      | A |
      `).toBeMatchToSelectionPattern();
      expect($leftBorderArea.height()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(24);
        main.toBe(30);
        horizon.toBe(38);
      });
      expect($topBorderArea.width()).toBe(50);
    });

    describe('should select entire table after the corner was clicked and', () => {
      it('just some rows were hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore thead th').eq(0);

        await simulateClick(corner, 'LMB');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: -1,-1 to: 4,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          | - ║ A : 0 : 0 : 0 : 0 |
          | - ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('all rows were hidden', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2, 3, 4],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore thead th').eq(0);

        await simulateClick(corner, 'LMB');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
      });
    });
  });

  describe('cell selection (API)', () => {
    // Do we need this test case?
    it('should not throw any errors, when selecting a whole row with the last column hidden', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        hiddenRows: {
          rows: [3]
        },
        rowHeaders: true,
      });

      expect(() => {
        // eslint-disable-next-line handsontable/require-await
        selectCell(0, 2, 3, 2);
      }).not.toThrow();
    });

    it('should highlight a proper headers when selection contains hidden rows', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2],
        },
      });

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

    it('should highlight a column header when all rows are hidden and selected cell is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

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

    it('should highlight a column header when all rows are hidden and selected cell is hidden (`single` selection mode)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        selectionMode: 'single',
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

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

    it('should select entire table after call selectAll if some rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: -1,-1 to: 4,4']);
      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire table after call selectAll if all of rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      await selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire column after call selectColumns if the first row is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0],
        },
      });

      await selectColumns(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire column after call selectColumns if the last row is hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
        },
      });

      await selectColumns(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire column after call selectColumns if rows between the first and the last are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectColumns(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select hidden row internally after the `selectRows` call', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
        },
      });

      await selectRows(1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 1,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the beginning of selection #1', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectRows(1, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 1,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the beginning of selection #2', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 2,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the end of selection #1', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectRows(0, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the end of selection #2', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectRows(0, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 3,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after call selectRows if range is partially hidden in the middle of selection', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      await selectRows(0, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after call selectRows if range is partially hidden at the start and at the end of the range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 3],
        },
      });

      await selectRows(1, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 3,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });

  describe('redrawing rendered selection when the selected range has been changed', () => {
    describe('by showing rows placed before the current selection', () => {
      it('single cell was selected', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        await selectCell(3, 3);
        getPlugin('hiddenRows').showRows([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').showRows([1, 2]);
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

      describe('entire column was selected and', () => {
        it('rows at the start had been hidden and were showed', async() => {
          handsontable({
            data: createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            hiddenRows: {
              rows: [0, 1],
            },
          });

          await selectColumns(0);

          getPlugin('hiddenRows').showRows([1]);
          await render();

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,0 to: 4,0']);
          expect(`
            |   ║ * :   :   :   :   |
            |===:===:===:===:===:===|
            | - ║ A :   :   :   :   |
            | - ║ 0 :   :   :   :   |
            | - ║ 0 :   :   :   :   |
            | - ║ 0 :   :   :   :   |
          `).toBeMatchToSelectionPattern();

          getPlugin('hiddenRows').showRows([0]);
          await render();

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
          expect(`
            |   ║ * :   :   :   :   |
            |===:===:===:===:===:===|
            | - ║ A :   :   :   :   |
            | - ║ 0 :   :   :   :   |
            | - ║ 0 :   :   :   :   |
            | - ║ 0 :   :   :   :   |
            | - ║ 0 :   :   :   :   |
          `).toBeMatchToSelectionPattern();
        });
      });

      it('non-contiguous selection', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 12,
          startCols: 8,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        await mouseDown(getCell(3, 1));

        $(getCell(6, 4)).simulate('mouseover').simulate('mouseup');

        await keyDown('control/meta');
        await mouseDown(getCell(5, 3));

        $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

        await mouseDown(getCell(6, 3));

        $(getCell(9, 6)).simulate('mouseover').simulate('mouseup');

        await keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').showRows([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          |   ║   :   :   :   :   :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').showRows([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by hiding rows placed before the current selection', () => {
      it('single cell was selected', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenRows: true,
        });

        await selectCell(3, 3);

        getPlugin('hiddenRows').hideRows([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').hideRows([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('non-contiguous selection', async() => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 12,
          startCols: 8,
          hiddenRows: true,
        });

        await mouseDown(getCell(3, 1));

        $(getCell(6, 4)).simulate('mouseover').simulate('mouseup');

        await keyDown('control/meta');
        await mouseDown(getCell(5, 3));

        $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

        await mouseDown(getCell(6, 3));

        $(getCell(9, 6)).simulate('mouseover').simulate('mouseup');

        await keyUp('control/meta');

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').hideRows([1, 2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          |   ║   :   :   :   :   :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').hideRows([0]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 3,1 from: 3,1 to: 6,4',
          'highlight: 5,3 from: 5,3 to: 8,5',
          'highlight: 6,3 from: 6,3 to: 9,6',
        ]);
        expect(`
          |   ║   : - : - : - : - : - : - :   |
          |===:===:===:===:===:===:===:===:===|
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 0 : 0 :   :   :   |
          | - ║   : 0 : 0 : 1 : 1 : 0 :   :   |
          | - ║   : 0 : 0 : C : 2 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 1 : 1 : 1 : 0 :   |
          | - ║   :   :   : 0 : 0 : 0 : 0 :   |
          |   ║   :   :   :   :   :   :   :   |
          |   ║   :   :   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });
    });

    describe('by showing hidden, ', () => {
      it('selected rows', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1, 2],
          },
        });

        await selectRows(1, 2);

        getPlugin('hiddenRows').showRows([2]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 2,4']);
        expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').showRows([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 2,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | * ║ A : 0 : 0 : 0 : 0 |
          | * ║ 0 : 0 : 0 : 0 : 0 |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1],
          },
        });

        await selectCell(1, 3);

        getPlugin('hiddenRows').showRows([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (just a few)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1],
          },
        });

        await selectCells([[1, 3], [1, 0], [1, 0]]);

        getPlugin('hiddenRows').showRows([1]);
        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 1,3',
          'highlight: 1,0 from: 1,0 to: 1,0',
          'highlight: 1,0 from: 1,0 to: 1,0',
        ]);
        expect(`
          |   ║ - :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║ B :   :   : 0 :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells (all of them)', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2, 3, 4],
          },
        });

        await selectAll();

        getPlugin('hiddenRows').showRows([0, 1, 2, 3, 4]);

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

    it('by showing rows from a selection containing hidden rows at the start and at the end of the range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 3],
        },
      });

      await selectRows(1, 3);

      getPlugin('hiddenRows').showRows([3]);

      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 3,4']);
      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenRows').showRows([1]);

      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 3,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    describe('by hiding', () => {
      it('selected rows', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        await selectRows(1, 2);

        getPlugin('hiddenRows').hideRows([1]);

        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 2,4']);
        expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').hideRows([2]);

        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 2,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        await selectCell(1, 3);

        getPlugin('hiddenRows').hideRows([1]);

        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cells', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        await selectCells([[1, 3], [1, 0], [1, 0]]);

        getPlugin('hiddenRows').hideRows([1]);

        await render();

        expect(getSelectedRange()).toEqualCellRange([
          'highlight: 1,3 from: 1,3 to: 1,3',
          'highlight: 1,0 from: 1,0 to: 1,0',
          'highlight: 1,0 from: 1,0 to: 1,0',
        ]);
        expect(`
          |   ║ - :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('all selected cells', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        await selectAll();

        getPlugin('hiddenRows').hideRows([0, 1, 2, 3, 4]);

        await render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
          | * ║ * : * : * : * : * |
          |===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
      });
    });

    it('showed rows on a table with all rows hidden and with selected entire column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      await selectColumns(0);

      getPlugin('hiddenRows').showRows([4]);

      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenRows').showRows([1, 2, 3]);

      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenRows').showRows([0]);

      await render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });
  });
});
