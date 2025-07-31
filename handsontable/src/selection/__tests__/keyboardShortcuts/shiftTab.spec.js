describe('Selection navigation', () => {
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

  describe('"Shift + Tab"', () => {
    it('should move the selection left for single cell selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(2, 2);
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,1']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left within a multiple selected cells only', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(1, 1, 2, 2);
      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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

    it('should move the selection left within a non-contiguous selection and jump to the previous layers (selected multiple cells)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 0, 2, 2], [4, 2, 4, 4], [1, 1, 2, 2]]);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,4 from: 4,2 to: 4,4',
        'highlight: 1,1 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : A |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 0,0 to: 2,2',
        'highlight: 4,2 from: 4,2 to: 4,4',
        'highlight: 1,1 from: 1,1 to: 2,2',
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

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

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

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 4,4 from: 4,2 to: 4,4',
        'highlight: 1,1 from: 1,1 to: 2,2',
      ]);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        | - ║ 0 : 1 : 1 :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : 0 : 0 : A |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left within a non-contiguous selection and jump to the previous layers (selected multiple single cells)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 0, 1, 1], [4, 4, 4, 4], [2, 2, 2, 2], [4, 1, 4, 1]]);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 4,4 from: 4,4 to: 4,4',
        'highlight: 2,2 from: 2,2 to: 2,2',
        'highlight: 4,1 from: 4,1 to: 4,1',
      ]);
      expect(`
        |   ║ - : - : - :   : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        | - ║   :   : A :   :   |
        |   ║   :   :   :   :   |
        | - ║   : 0 :   :   : 0 |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 4,4 from: 4,4 to: 4,4',
        'highlight: 2,2 from: 2,2 to: 2,2',
        'highlight: 4,1 from: 4,1 to: 4,1',
      ]);
      expect(`
        |   ║ - : - : - :   : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        | - ║   :   : 0 :   :   |
        |   ║   :   :   :   :   |
        | - ║   : 0 :   :   : A |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,1 from: 0,0 to: 1,1',
        'highlight: 4,4 from: 4,4 to: 4,4',
        'highlight: 2,2 from: 2,2 to: 2,2',
        'highlight: 4,1 from: 4,1 to: 4,1',
      ]);
      expect(`
        |   ║ - : - : - :   : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : A :   :   :   |
        | - ║   :   : 0 :   :   |
        |   ║   :   :   :   :   |
        | - ║   : 0 :   :   : 0 |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // moves focus to the previous layer

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 4,4 from: 4,4 to: 4,4',
        'highlight: 2,2 from: 2,2 to: 2,2',
        'highlight: 4,1 from: 4,1 to: 4,1',
      ]);
      expect(`
        |   ║ - : - : - :   : - |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        | - ║   :   : 0 :   :   |
        |   ║   :   :   :   :   |
        | - ║   : A :   :   : 0 |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left within a column header selection', async() => {
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
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : A :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : A : 0 :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : A :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : A : 0 :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -2,2 to: 1,3']);
      expect(`
        |   ║   :   : * : * :   |
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : A :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left within a row header selection', async() => {
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
      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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

      await keyDownUp(['shift', 'tab']);

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
    });

    it('should move the selection left ignoring hidden indexes', async() => {
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
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : 0 :   |
        |   : - ║   : 0 : A :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,1 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : 0 :   |
        |   : - ║   : A : 0 :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 1,1 to: 3,3']);
      expect(`
        |   :   ║   : - : - :   |
        |===:===:===:===:===:===|
        |   :   ║   :   :   :   |
        |   : - ║   : 0 : A :   |
        |   : - ║   : 0 : 0 :   |
        |   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

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

    it('should move the selection left when there is no columns (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapRow: true,
        autoWrapCol: true,
      });

      await selectRows(3, 1, -1);
      await listen();
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
      expect(`
        |   |
        |   |
        | # |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      expect(`
        |   |
        | # |
        |   |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left when all columns are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
        autoWrapRow: true,
        autoWrapCol: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectRows(3, 1, -1);
      await listen();
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
      expect(`
        |   |
        |   |
        | # |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      expect(`
        |   |
        | # |
        |   |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectColumns(2, 3, -2);
      await listen();
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      expect(`
        |   : # :   :   :   |
        |   :   :   :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);
      expect(`
        | # :   :   :   :   |
        |   :   :   :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });

    it('should move the selection left when all rows are hidden (navigableHeaders on)', async() => {
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

      await selectColumns(2, 3, -2);
      await listen();
      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: -2,1']);
      expect(`
        |   : # :   :   :   |
        |   :   :   :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();

      await keyDownUp(['shift', 'tab']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);
      expect(`
        | # :   :   :   :   |
        |   :   :   :   :   |
        |===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
    });
  });
});
