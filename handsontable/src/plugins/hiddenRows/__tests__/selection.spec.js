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
    it('should select entire row by header if first column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0],
        },
      });

      const header = getCell(-1, 0);

      simulateClick(header, 'LMB');

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

    it('should select entire row by header if last column is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
        },
      });

      const header = getCell(-1, 0);

      simulateClick(header, 'LMB');

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

    it('should select entire row by header if any column in the middle is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      const header = getCell(-1, 0);

      simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire row by header if all rows are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      const header = $('.ht_clone_inline_start .htCore thead tr th').eq(0); // The corner

      simulateClick(header, 'LMB');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should keep hidden rows in cell range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      const startCell = getCell(0, 0);
      const endCell = getCell(4, 0);

      mouseDown(startCell, 'LMB');
      mouseOver(endCell);
      mouseUp(endCell);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 4,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select non-contiguous rows properly when there are some hidden rows', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(8, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      const startColumn = getCell(4, -1);
      const endColumn = getCell(6, -1);

      mouseDown(startColumn, 'LMB');
      mouseUp(startColumn);

      keyDown('control/meta');

      mouseDown(endColumn, 'LMB');
      mouseUp(endColumn);

      keyUp('control/meta');

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

    it('should select cells by using two layers when CTRL key is pressed and some rows are hidden', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 12,
        startCols: 8,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      mouseDown(getCell(3, 1));
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

      keyDown('control/meta');

      mouseDown(getCell(5, 3));
      $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

      keyUp('control/meta');

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

    it('should properly render selection if mouse moved over hidden row', () => {
      spec().$container.css({ margin: '35px' });

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(2, 1),
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
      expect($leftBorderArea.height()).forThemes(({ classic, main }) => {
        classic.toBe(23);
        main.toBe(29);
      });
      expect($topBorderArea.width()).toBe(49);
    });

    describe('should select entire table after the corner was clicked and', () => {
      it('just some rows were hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore thead th').eq(0);

        simulateClick(corner, 'LMB');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: -1,-1 to: 4,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          | - ║ A : 0 : 0 : 0 : 0 |
          | - ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      });

      it('all rows were hidden', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2, 3, 4],
          },
        });

        const corner = $('.ht_clone_top_inline_start_corner .htCore thead th').eq(0);

        simulateClick(corner, 'LMB');

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
    it('should not throw any errors, when selecting a whole row with the last column hidden', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        hiddenRows: {
          rows: [3]
        },
        rowHeaders: true,
      });

      expect(() => {
        hot.selectCell(0, 2, 3, 2);
      }).not.toThrow();
    });

    it('should highlight a proper headers when selection contains hidden rows', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2],
        },
      });

      selectCells([[0, 1, 3, 2]]);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 3,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight a proper headers when selection contains hidden columns', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenColumns: {
          columns: [1, 2],
        },
      });

      selectCells([[1, 0, 2, 3]]);

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

    it('should highlight a column header when all rows are hidden and selected cell is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();

      selectCell(1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should highlight a column header when all rows are hidden and selected cell is hidden (`single` selection mode)', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        selectionMode: 'single',
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      selectCell(0, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();

      selectCell(1, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire table after call selectAll if some rows are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1],
        },
      });

      selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: -1,-1 to: 4,4']);
      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire table after call selectAll if all of rows are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      selectAll();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should select entire column after call selectColumns if the first row is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0],
        },
      });

      selectColumns(0);

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

    it('should select entire column after call selectColumns if the last row is hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [4],
        },
      });

      selectColumns(0);

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

    it('should select entire column after call selectColumns if rows between the first and the last are hidden', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectColumns(0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
        | - ║ 0 :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select hidden row internally after the `selectRows` call', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1],
        },
      });

      selectRows(1);

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

    it('should select rows after the `selectRows` call if range is partially hidden at the beginning of selection #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectRows(1, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 1,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the beginning of selection #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectRows(2, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 2,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the end of selection #1', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectRows(0, 2);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 2,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after the `selectRows` call if range is partially hidden at the end of selection #2', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectRows(0, 3);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 3,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after call selectRows if range is partially hidden in the middle of selection', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 2, 3],
        },
      });

      selectRows(0, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 4,4']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should select rows after call selectRows if range is partially hidden at the start and at the end of the range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 3],
        },
      });

      selectRows(1, 3);

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
      it('single cell was selected', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        selectCell(3, 3);
        getPlugin('hiddenRows').showRows([0]);
        render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').showRows([1, 2]);
        render();

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
        it('rows at the start had been hidden and were showed', () => {
          handsontable({
            data: Handsontable.helper.createSpreadsheetData(5, 5),
            rowHeaders: true,
            colHeaders: true,
            hiddenRows: {
              rows: [0, 1],
            },
          });

          selectColumns(0);

          getPlugin('hiddenRows').showRows([1]);
          render();

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
          render();

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

      it('non-contiguous selection', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 12,
          startCols: 8,
          hiddenRows: {
            rows: [0, 1, 2],
          },
        });

        mouseDown(getCell(3, 1));
        $(getCell(6, 4)).simulate('mouseover').simulate('mouseup');

        keyDown('control/meta');

        mouseDown(getCell(5, 3));
        $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

        mouseDown(getCell(6, 3));
        $(getCell(9, 6)).simulate('mouseover').simulate('mouseup');

        keyUp('control/meta');

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
        render();

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
        render();

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
      it('single cell was selected', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 5,
          startCols: 5,
          hiddenRows: true,
        });

        selectCell(3, 3);

        getPlugin('hiddenRows').hideRows([1, 2]);
        render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();

        getPlugin('hiddenRows').hideRows([0]);
        render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 3,3']);
        expect(`
          |   ║   :   :   : - :   |
          |===:===:===:===:===:===|
          | - ║   :   :   : # :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('non-contiguous selection', () => {
        handsontable({
          rowHeaders: true,
          colHeaders: true,
          startRows: 12,
          startCols: 8,
          hiddenRows: true,
        });

        mouseDown(getCell(3, 1));
        $(getCell(6, 4)).simulate('mouseover').simulate('mouseup');

        keyDown('control/meta');

        mouseDown(getCell(5, 3));
        $(getCell(8, 5)).simulate('mouseover').simulate('mouseup');

        mouseDown(getCell(6, 3));
        $(getCell(9, 6)).simulate('mouseover').simulate('mouseup');

        keyUp('control/meta');

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
        render();

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
        render();

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
      it('selected rows', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1, 2],
          },
        });

        selectRows(1, 2);

        getPlugin('hiddenRows').showRows([2]);
        render();

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
        render();

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

      it('selected cell', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1],
          },
        });

        selectCell(1, 3);

        getPlugin('hiddenRows').showRows([1]);
        render();

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

      it('selected cells (just a few)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [1],
          },
        });

        selectCells([[1, 3], [1, 0], [1, 0]]);

        getPlugin('hiddenRows').showRows([1]);
        render();

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

      it('selected cells (all of them)', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: {
            rows: [0, 1, 2, 3, 4],
          },
        });

        selectAll();

        getPlugin('hiddenRows').showRows([0, 1, 2, 3, 4]);
        render();

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

    it('by showing rows from a selection containing hidden rows at the start and at the end of the range', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [1, 3],
        },
      });

      selectRows(1, 3);

      getPlugin('hiddenRows').showRows([3]);
      render();

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
      render();

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
      it('selected rows', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        selectRows(1, 2);

        getPlugin('hiddenRows').hideRows([1]);
        render();

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
        render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 1,-1 to: 2,4']);
        expect(`
          |   ║ - : - : - : - : - |
          |===:===:===:===:===:===|
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
          |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      });

      it('selected cell', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        selectCell(1, 3);

        getPlugin('hiddenRows').hideRows([1]);
        render();

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

      it('selected cells', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        selectCells([[1, 3], [1, 0], [1, 0]]);

        getPlugin('hiddenRows').hideRows([1]);
        render();

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

      it('all selected cells', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          hiddenRows: true,
        });

        selectAll();

        getPlugin('hiddenRows').hideRows([0, 1, 2, 3, 4]);
        render();

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
        expect(`
          | * ║ * : * : * : * : * |
          |===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
      });
    });

    it('showed rows on a table with all rows hidden and with selected entire column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        hiddenRows: {
          rows: [0, 1, 2, 3, 4],
        },
      });

      selectColumns(0);

      getPlugin('hiddenRows').showRows([4]);
      render();

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: -1,0 to: 4,0']);
      expect(`
        |   ║ * :   :   :   :   |
        |===:===:===:===:===:===|
        | - ║ A :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      getPlugin('hiddenRows').showRows([1, 2, 3]);
      render();

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
      render();

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
