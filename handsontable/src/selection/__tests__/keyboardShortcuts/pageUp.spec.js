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

  describe('"PageUp"', () => {
    it('should move the cell selection up by the height of the table viewport', async() => {
      const height = 126;
      const pageSize = expectedVisibleRows(height, 0);
      const totalRows = 15;
      const startRow = 13;
      const expectedRows = [];
      let currentRow = startRow;

      for (let i = 0; i < 4; i++) {
        currentRow = Math.max(currentRow - pageSize, 0);
        expectedRows.push(currentRow);
      }

      function viewportSelectionPattern(rowIndex) {
        const lines = Array.from({ length: totalRows }, (_, i) => {
          const mid = i === rowIndex ? ' # ' : '   ';

          return `        |   :${mid}:   |`;
        });

        return `\n${lines.join('\n')}\n      `;
      }

      handsontable({
        width: 180,
        height,
        startRows: totalRows,
        startCols: 3,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
      });

      await selectCell(startRow, 1);

      for (let i = 0; i < expectedRows.length; i++) {
        await keyDownUp('pageup');

        const row = expectedRows[i];

        expect(viewportSelectionPattern(row)).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${row},1 from: ${row},1 to: ${row},1`]);
      }
    });

    it('should move the cell selection up to the first cell', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(3, 2);
      await keyDownUp('pageup');

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

      await keyDownUp('pageup');

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

    it('should move the cell selection up to the first cell and then to the last cell of the previous column (autoWrap on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
      });

      await selectCell(3, 2);
      await keyDownUp('pageup');

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

      await keyDownUp('pageup');

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

    it('should move the cell selection up to the first column header and then to the last cell of the previous column (autoWrap on, navigableHeaders on)', async() => {
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

      await selectCell(3, 2);
      await keyDownUp('pageup');

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

      await keyDownUp('pageup');

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

    it('should move the cell selection up to the first column header and scroll ' +
      'the viewport (navigableHeaders on)', async() => {
      const height = 252;
      const layout = getThemeLayout();
      const colHeaderRows = 3; // 1 default + 2 from afterGetColumnHeaderRenderers
      const headerHeight = colHeaderRows * (layout.defaultColumnHeaderHeight + layout.cellBorderWidth);
      const dataArea = height - headerHeight;
      const pageSize = Math.floor((dataArea - layout.cellBorderWidth) / layout.defaultDataRowHeight);

      handsontable({
        height,
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

      await selectCell(13, 1);

      await waitForNextAnimationFrames(2);

      // after selecting row 13, the first fully visible row is computed from the viewport size
      const firstVisibleAfterSelect = 13 - pageSize + 1;

      expect(tableView().getFirstFullyVisibleRow()).toBe(firstVisibleAfterSelect);

      await keyDownUp('pageup');

      await waitForNextAnimationFrames(2);

      // pageUp moves the cursor by pageSize + colHeaderRows, viewport follows
      const cursorAfterPage1 = 13 - (pageSize + colHeaderRows);

      expect(tableView().getFirstFullyVisibleRow()).toBe(Math.max(0, cursorAfterPage1));

      await keyDownUp('pageup');

      await waitForNextAnimationFrames(2);

      expect(tableView().getFirstFullyVisibleRow()).toBe(0);
    });

    it('should scroll the master viewport to the top when Page Up moves the selection into a top fixed row', async() => {
      const fixedRowsTop = 2;
      const totalRows = 50;

      handsontable({
        width: 300,
        height: containerHeightForRows(10),
        rowHeaders: true,
        colHeaders: true,
        startRows: totalRows,
        startCols: 5,
        fixedRowsTop,
      });

      await waitForNextAnimationFrames(1);

      // Use the actual page size so the math works across all themes
      const pageSize = hot().countVisibleRows();
      // After 2 x Page Up: startRow → fixedRowsTop+1 → 0 (in frozen area)
      const startRow = pageSize + fixedRowsTop + 1;

      await selectCell(startRow, 2);
      await waitForNextAnimationFrames(2);

      // First Page Up: moves to fixedRowsTop+1 (still non-frozen), viewport scrolls up
      await keyDownUp('pageup');
      await waitForNextAnimationFrames(2);

      // Second Page Up: moves to row 0 which is in the top frozen overlay
      await keyDownUp('pageup');
      await waitForNextAnimationFrames(2);

      // Selection must be inside the frozen area
      expect(getSelectedRange()[0].highlight.row).toBeLessThan(fixedRowsTop);
      // Master viewport must be scrolled back to top so frozen rows are aligned
      expect(tableView().getFirstFullyVisibleRow()).toBe(fixedRowsTop);
    });

    it('should scroll the master viewport to the top when Page Up moves the selection to a column header with top fixed rows', async() => {
      const fixedRowsTop = 2;

      handsontable({
        width: 300,
        height: containerHeightForRows(10),
        rowHeaders: true,
        colHeaders: true,
        startRows: 50,
        startCols: 5,
        fixedRowsTop,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await waitForNextAnimationFrames(1);

      // countColHeaders() = 2 (default + 1 extra); rowsStep = -(pageSize + 2).
      // From startRow = pageSize + fixedRowsTop the jump overshoots past row 0, so the
      // command clamps to the topmost column header (-2) in a single Page Up.
      const pageSize = hot().countVisibleRows();
      const startRow = pageSize + fixedRowsTop;

      await selectCell(startRow, 2);
      await waitForNextAnimationFrames(2);

      await keyDownUp('pageup');
      await waitForNextAnimationFrames(2);

      // Selection should be at the topmost column header (row < 0)
      expect(getSelectedRange()[0].highlight.row).toBeLessThan(0);
      // Master viewport must be scrolled to top even with fixedRowsTop set
      expect(tableView().getFirstFullyVisibleRow()).toBe(fixedRowsTop);
    });

    it('should scroll the master viewport to the top when Page Up moves the selection into a top fixed row with both top and bottom fixed rows', async() => {
      const fixedRowsTop = 2;
      const fixedRowsBottom = 2;

      handsontable({
        width: 300,
        height: containerHeightForRows(10),
        rowHeaders: true,
        colHeaders: true,
        startRows: 50,
        startCols: 5,
        fixedRowsTop,
        fixedRowsBottom,
      });

      await waitForNextAnimationFrames(1);

      const pageSize = hot().countVisibleRows();
      const startRow = pageSize + fixedRowsTop + 1;

      await selectCell(startRow, 2);
      await waitForNextAnimationFrames(2);

      await keyDownUp('pageup');
      await waitForNextAnimationFrames(2);
      await keyDownUp('pageup');
      await waitForNextAnimationFrames(2);

      expect(getSelectedRange()[0].highlight.row).toBeLessThan(fixedRowsTop);
      expect(tableView().getFirstFullyVisibleRow()).toBe(fixedRowsTop);
    });

    it('should move the cell selection up for oversized row', async() => {
      handsontable({
        width: 180,
        height: 100,
        rowHeights: 200,
        navigableHeaders: false,
        startRows: 15,
        startCols: 3
      });

      await selectCell(9, 0);
      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 8,0 to: 8,0']);

      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,0 from: 7,0 to: 7,0']);

      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 6,0']);
    });
  });
});
