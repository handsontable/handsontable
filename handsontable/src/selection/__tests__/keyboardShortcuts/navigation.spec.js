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

  it('should not throw an error when dataset is empty', () => {
    handsontable({
      data: [],
      rowHeaders: true,
      colHeaders: true,
    });

    selectAll();
    listen();

    expect(() => keyDownUp('home')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'home'])).not.toThrow();
    expect(() => keyDownUp('end')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'end'])).not.toThrow();
    expect(() => keyDownUp('arrowtop')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowtop'])).not.toThrow();
    expect(() => keyDownUp('arrowbottom')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowbottom'])).not.toThrow();
    expect(() => keyDownUp('arrowright')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowright'])).not.toThrow();
    expect(() => keyDownUp('arrowleft')).not.toThrow();
    expect(() => keyDownUp(['control/meta', 'arrowleft'])).not.toThrow();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: -1,-1']);
  });

  describe('"ArrowRight"', () => {
    it('should move the cell selection to the right', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(0, 0);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should move the header selection to the right (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the right when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the right from the corner when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      keyDownUp('arrowright');

      expect(`
        |   ║ # :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the right when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers, navigableHeaders off)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders off)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
      });

      it('should traverse whole table by constantly selecting next cell in row', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);

        for (let row = 0, rlen = countRows(); row < rlen; row++) {
          for (let col = 0, clen = countCols(); col < clen; col++) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            keyDownUp('arrowright');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });
    });
  });

  describe('"ArrowRight + Ctrl/Cmd"', () => {
    it('should move the cell selection to the most right cell in a row', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      expect(`
        |   ║   :   :   :   : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   :   :   :   : # |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
      expect(`
        |   ║   :   :   :   : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   :   :   : # |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      expect(`
        |   ║   :   :   :   : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   :   :   : # |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most right column header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
    });

    it('should move the header selection to the most right column header in a row when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
    });

    it('should move the header selection to the most right column header in a row when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
    });

    it('should move the header selection to the most right row header in a row when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCell(1, -3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
    });

    it('should move the header selection to the most right row header in a row when all columns are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(1, -3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
    });
  });

  describe('"ArrowLeft"', () => {
    it('should move the cell selection to the left', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });

    it('should move the header selection to the left (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the left when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the left to the corner when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 0);
      keyDownUp('arrowleft');

      expect(`
        | # ║   :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });

    it('should move the header selection to the left when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 3);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row above, if the first column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last column of the row above, if the first column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(1, -3);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the row headers range (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(1, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left header is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(-3, -3);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the corner range, if the most top-left cell is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(0, 0);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
      });

      it('should traverse whole table by constantly selecting previous cell in row', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);

        for (let row = countRows() - 1; row >= 0; row--) {
          for (let col = countCols() - 1; col >= 0; col--) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            keyDownUp('arrowleft');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });
    });
  });

  describe('"ArrowLeft + Ctrl/Cmd"', () => {
    it('should move the cell selection to the most left cell in a row', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most left header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left header in a row when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left header in a row when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left row header in a row when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
    });

    it('should move the header selection to the most left row header in a row when all columns are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
    });
  });

  describe('"ArrowUp"', () => {
    it('should move the cell selection above', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should move the header selection up (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(3, -1);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    it('should move the header selection up when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(3, -1);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    it('should move the header selection up to the corner when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], []],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(0, -1);
      keyDownUp('arrowup');

      expect(`
        | # |
        |===|
        |   |
        |   |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });

    it('should move the header selection up when all columns are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(3, -1);
      keyDownUp('arrowup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the previous column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: false
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last row of the previous column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
      });

      it('should move the cell selection to the last row of the previous column, if the first row is already selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
      });

      it('should move the cell selection to the last row of the previous column, if the first row is already selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(-3, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
      });

      it('should move the cell selection to the column headers range (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(0, 1);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 0);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        selectCell(0, 0);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(-3, -3);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the corner range, if the most top-left cell is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(0, 0);
        keyDownUp('arrowup');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
      });

      it('should traverse whole table by constantly selecting previous cell in column', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 4);

        for (let col = countCols() - 1; col >= 0; col--) {
          for (let row = countRows() - 1; row >= 0; row--) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            keyDownUp('arrowup');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });
    });
  });

  describe('"ArrowUp + Ctrl/Cmd"', () => {
    it('should move the cell selection to the first cell (first row) in a column', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(3, 3);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : # :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most top header in a column (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(3, -1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top header in a column when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(3, -1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top header in a column when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(3, -1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top column header in a column when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
    });

    it('should move the header selection to the most top column header in a column when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
    });
  });

  describe('"ArrowDown"', () => {
    it('should move the cell selection below', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should move the header selection down (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    it('should move the header selection down when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    it('should move the header selection down from the corner when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], []],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      keyDownUp('arrowdown');

      expect(`
        |   |
        |===|
        | # |
        |   |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection down when all columns are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(1, -1);
      keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column, if the last row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: false
        });

        selectCell(4, 0);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first row of the next column, if the first row is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 1);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      });

      it('should move the cell selection to the first row of the next column, if the first row is already selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        selectCell(4, 1);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      });

      it('should move the cell selection to the first row of the next column, if the first row is already selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(4, 1);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(4, 4);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        selectCell(4, 4);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders on)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true,
          navigableHeaders: true,
          afterGetColumnHeaderRenderers(headerRenderers) {
            headerRenderers.push(columnHeader.bind(this));
            headerRenderers.push(columnHeader.bind(this));
          },
          afterGetRowHeaderRenderers(headerRenderers) {
            headerRenderers.push(rowHeader.bind(this));
            headerRenderers.push(rowHeader.bind(this));
          },
        });

        selectCell(4, 4);
        keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
      });

      it('should traverse whole table by constantly selecting next cell in column', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        selectCell(0, 0);

        for (let col = 0, clen = countCols(); col < clen; col++) {
          for (let row = 0, rlen = countRows(); row < rlen; row++) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            keyDownUp('arrowdown');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });
    });
  });

  describe('"ArrowDown + Ctrl/Cmd"', () => {
    it('should move the cell selection to the last cell (last row) in a column', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 4,3']);
      expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   :   : # :   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most bottom header in a column (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,-1 from: 4,-1 to: 4,-1']);
    });

    it('should move the header selection to the most bottom header in a column when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,-1 from: 4,-1 to: 4,-1']);
    });

    it('should move the header selection to the most bottom header in a column when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(1, -1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,-1 from: 4,-1 to: 4,-1']);
    });

    it('should move the header selection to the most bottom column header in a column when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCell(-3, 1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should move the header selection to the most bottom column header in a column when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-3, 1);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });
  });

  describe('"PageUp"', () => {
    it('should move the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will move up one per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(13, 1);
      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);

      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 5,1 to: 5,1']);

      keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      keyDownUp('pageup');

      expect(`
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should move the cell selection up to the first cell', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 2);
      keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should move the cell selection up to the first cell and then to the last cell of the previous column (autoWrap on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
      });

      selectCell(3, 2);
      keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      keyDownUp('pageup');

      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    });

    it('should move the cell selection up to the first column header and then to the last cell of the previous column (autoWrap on, navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCell(3, 2);
      keyDownUp('pageup');

      expect(`
        |   :   :   ║   :   : # :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);

      keyDownUp('pageup');

      expect(`
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   : - :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   : - ║   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    });

    it('should move the cell selection up to the first column header and scroll the viewport (navigableHeaders on)', async() => {
      const hot = handsontable({
        height: 200,
        rowHeaders: true,
        colHeaders: true,
        startRows: 15,
        startCols: 3,
        autoWrapCol: true,
        autoWrapRow: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCell(13, 1);

      expect(hot.view.getFirstFullyVisibleRow()).toBe(9);

      keyDownUp('pageup');
      await sleep(100);

      expect(hot.view.getFirstFullyVisibleRow()).toBe(5);

      keyDownUp('pageup');
      await sleep(100);

      expect(hot.view.getFirstFullyVisibleRow()).toBe(0);
    });
  });

  describe('"PageDown"', () => {
    it('should move the cell selection down by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageDown will move down one per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(1, 1);
      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 5,1 to: 5,1']);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 13,1 from: 13,1 to: 13,1']);

      keyDownUp('pagedown');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 14,1 from: 14,1 to: 14,1']);
    });

    it('should move the cell selection down to the last cell', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 2);
      keyDownUp('pagedown');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

      keyDownUp('pagedown');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
    });

    it('should move the cell selection down to the last cell and then to the first cell of the next column (autoWrap on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
      });

      selectCell(1, 2);
      keyDownUp('pagedown');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

      keyDownUp('pagedown');

      expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : # :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
    });

    it('should move the cell selection down to the last row and then to the first column header of the next column (autoWrap on, navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCell(1, 2);
      keyDownUp('pagedown');

      expect(`
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   : - :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   : - ║   :   : # :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);

      keyDownUp('pagedown');

      expect(`
        |   :   :   ║   :   :   : # :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,3 from: -3,3 to: -3,3']);
    });
  });

  describe('"Home"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the first non-fixed cell in a row', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(3, 3);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
        });

        it('while the currently selected cell is in the main table (with headers)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
          });

          selectCell(3, 3);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
        });

        it('while the currently selected cell is in the main table (with headers, navigableHeaders on)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, 3);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
        });

        it('while the currently selected cell is in the column header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(-2, 3);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);
        });

        it('while the currently selected cell is in the row header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, -2);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 2);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp('home');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
        });
      });
    });
  });

  describe('"Home + Ctrl/Cmd"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the first non-fixed cell of the table', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(3, 3);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('while the currently selected cell is in the main table (with headers)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
          });

          selectCell(3, 3);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('while the currently selected cell is in the main table (with headers, navigableHeaders on)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, 3);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('while the currently selected cell is in the column header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(-2, 3);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('while the currently selected cell is in the row header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, -2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);

          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'home']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
        });
      });
    });
  });

  describe('"End"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the last non-fixed cell in a row', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
        });

        it('while the currently selected cell is in the main table (with headers)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
        });

        it('while the currently selected cell is in the main table (with headers, navigableHeaders on)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
        });

        it('while the currently selected cell is in the column header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(-2, 3);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: -2,4 from: -2,4 to: -2,4']);
        });

        it('while the currently selected cell is in the row header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, -2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp('end');

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
        });
      });
    });
  });

  describe('"End + Ctrl/Cmd"', () => {
    using('document layout direction', [
      { htmlDir: 'ltr' },
      { htmlDir: 'rtl' },
    ], ({ htmlDir }) => {
      beforeEach(() => {
        $('html').attr('dir', htmlDir);
      });

      afterEach(() => {
        $('html').attr('dir', 'ltr');
      });

      describe('should move the selection to the last non-fixed cell of the table', () => {
        it('while the currently selected cell is in the main table', () => {
          handsontable({
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the main table (with headers)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the main table (with headers, navigableHeaders on)', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the column header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(-2, 3);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the row header', () => {
          handsontable({
            startRows: 5,
            startCols: 5,
            colHeaders: true,
            rowHeaders: true,
            navigableHeaders: true,
            afterGetColumnHeaderRenderers(headerRenderers) {
              headerRenderers.push(columnHeader.bind(this));
              headerRenderers.push(columnHeader.bind(this));
            },
            afterGetRowHeaderRenderers(headerRenderers) {
              headerRenderers.push(rowHeader.bind(this));
              headerRenderers.push(rowHeader.bind(this));
            },
          });

          selectCell(3, -2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the top-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
        });

        it('while the currently selected cell is in the bottom-left overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 5
          });

          selectCell(4, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
        });

        it('when there is at least one cell visible in the viewport and belongs to the main table overlay', () => {
          handsontable({
            fixedColumnsStart: 2,
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            startRows: 5,
            startCols: 3
          });

          selectCell(0, 0);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);

          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });
      });

      describe('should not move the selection at all', () => {
        it('when the top overlay covers all table viewport', () => {
          handsontable({
            fixedRowsTop: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the bottom overlay covers all table viewport', () => {
          handsontable({
            fixedRowsBottom: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when the left overlay covers all table viewport', () => {
          handsontable({
            fixedColumnsStart: 5,
            startRows: 5,
            startCols: 5
          });

          selectCell(2, 2);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
        });

        it('when all overlays cover all table viewport', () => {
          handsontable({
            fixedRowsTop: 2,
            fixedRowsBottom: 2,
            fixedColumnsStart: 3,
            startRows: 4,
            startCols: 3
          });

          selectCell(1, 1);
          keyDownUp(['control/meta', 'end']);

          expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
        });
      });
    });
  });
});
