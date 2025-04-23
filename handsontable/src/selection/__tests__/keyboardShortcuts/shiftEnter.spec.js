describe('Selection navigation', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }
  function rowHeader(renderableRowIndex, TH) {
    const visualRowIndex = renderableRowIndex >= 0 ?
      this.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

    this.view.appendRowHeader(visualRowIndex, TH);
  }

  describe('"Shift + Enter"', () => {
    it('should move the selection up for single cell selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(2, 2);
      await keyDownUp(['shift', 'enter']); // opens editor
      await keyDownUp(['shift', 'enter']); // navigates up

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection up within a multiple selected cells only', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(1, 1, 2, 2);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,1 to: 2,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : A :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 2,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   : 0 : A :   :   |
        | - ║   : 0 : 0 :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 2,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : A : 0 :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,2']);
      expect(`
        |   ║   : - : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection up within a non-contiguous selection only for the last layer', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 0, 2, 2], [4, 2, 4, 4], [1, 1, 2, 2]]);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,2 from: 4,2 to: 4,4',
        'highlight: 2,2 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        | - ║ 0 : 1 : B :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,2 from: 4,2 to: 4,4',
        'highlight: 1,2 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : 1 : B :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,2 from: 4,2 to: 4,4',
        'highlight: 2,1 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        | - ║ 0 : B : 1 :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,2 from: 4,2 to: 4,4',
        'highlight: 1,1 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : B : 1 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection up within a column header selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 2,
        startCols: 5,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectColumns(2, 3, -2);
      await listen();
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : A :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : A :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : A : 0 :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection up within a row header selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 2,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      await selectRows(2, 3, -2);
      await listen();
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 2,-2 to: 3,1']);
      expect(`
        |   :   ║ - : - |
        |===:===:===:===|
        |   :   ║   :   |
        |   :   ║   :   |
        | * : * ║ 0 : 0 |
        | * : * ║ 0 : A |
        |   :   ║   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,-2 to: 3,1']);
      expect(`
        |   :   ║ - : - |
        |===:===:===:===|
        |   :   ║   :   |
        |   :   ║   :   |
        | * : * ║ 0 : A |
        | * : * ║ 0 : 0 |
        |   :   ║   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 2,-2 to: 3,1']);
      expect(`
        |   :   ║ - : - |
        |===:===:===:===|
        |   :   ║   :   |
        |   :   ║   :   |
        | * : * ║ 0 : 0 |
        | * : * ║ A : 0 |
        |   :   ║   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-2 to: 3,1']);
      expect(`
        |   :   ║ - : - |
        |===:===:===:===|
        |   :   ║   :   |
        |   :   ║   :   |
        | * : * ║ A : 0 |
        | * : * ║ 0 : 0 |
        |   :   ║   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 2,-2 to: 3,1']);
      expect(`
        |   :   ║ - : - |
        |===:===:===:===|
        |   :   ║   :   |
        |   :   ║   :   |
        | * : * ║ 0 : 0 |
        | * : * ║ 0 : A |
        |   :   ║   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection up ignoring hidden indexes', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      const rowHiddenMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');
      const columnHiddenMapper = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      rowHiddenMapper.setValueAtIndex(1, true);
      columnHiddenMapper.setValueAtIndex(2, true);
      await render();

      await selectCell(1, 1, 3, 3);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : 0 :   |
        |   : - ║   : 0 : A :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : A :   |
        |   : - ║   : 0 : 0 :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : 0 :   |
        |   : - ║   : A : 0 :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : A : 0 :   |
        |   : - ║   : 0 : 0 :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the selection up when there is no columns (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      await selectRows(1, 3, -1);
      await listen();
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 3,-1']);
      expect(`
        |   |
        | # |
        | * |
        | * |
        |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the selection up when all columns are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectRows(1, 3, -1);
      await listen();
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 3,4']);
      expect(`
        |   |
        | # |
        | * |
        | * |
        |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the selection up when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectColumns(1, 2, -2);
      await listen();
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -1,2']);
      expect(`
        |   : # : * :   :   |
        |   : * : * :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should not move the selection up when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectColumns(1, 2, -2);
      await listen();
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);
      await keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: 4,2']);
      expect(`
        |   : # : * :   :   |
        |   : * : * :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });
  });
});
