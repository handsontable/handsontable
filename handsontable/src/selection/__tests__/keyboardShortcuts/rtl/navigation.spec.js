describe('Selection navigation (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

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

  describe('"ArrowRight"', () => {
    it('should move the cell selection to the right', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });

    it('should move the header selection to the right (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp('arrowright');

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
        keyDownUp('arrowright');

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
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(1, 0);
        keyDownUp('arrowright');

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
        keyDownUp('arrowright');

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
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      });

      it('should move the cell selection to the bottom-left corner, if the most top-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-left corner, if the most top-right cell is selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(0, 0);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-left corner, if the most top-right cell is selected (with headers, navigableHeaders on)', () => {
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
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the corner range, if the most top-right cell is selected (with headers, navigableHeaders on)', () => {
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
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the most right cell in a row (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   :   :   :   : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   : # ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most right column header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 3);
      keyDownUp(['control/meta', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
    });

    it('should move the header selection to the left (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(1, 4);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(1, 4);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(1, 4);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
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

        selectCell(1, -3);
        keyDownUp('arrowright');

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
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected (with header)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected (with header, navigableHeaders on)', () => {
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
        keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the most left cell in a row (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,4 from: 3,4 to: 3,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectRows(2);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: 2,4 to: 2,4']);
      expect(`
        | - :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        | # :   :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the header selection to the most left header in a row (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,4 from: -1,4 to: -1,4']);
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
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   : # :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   : # :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   : # :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the first cell (first row) in a column (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(3, 3);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      expect(`
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   : # :   :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 1, 1, 3]]);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   : # :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   : # :   :   ║ - |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
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
        |   :   :   : - :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   : # :   ║ - |
      `).toBeMatchToSelectionPattern();

      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 4,3 to: 4,3']);
      expect(`
        |   : - :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   : # :   :   :   ║ - |
      `).toBeMatchToSelectionPattern();

      selectColumns(2);
      keyDownUp(['control/meta', 'arrowdown']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
      expect(`
        |   :   : - :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   : # :   :   ║ - |
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
  });
});
