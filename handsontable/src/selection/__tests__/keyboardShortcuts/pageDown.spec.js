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

  describe('"PageDown"', () => {
    it('should move the cell selection down by the height of the table viewport', async() => {
      const height = 126;
      const pageSize = expectedVisibleRows(height, 0);
      const totalRows = 15;
      const startRow = 1;
      const expectedRows = [];
      let currentRow = startRow;

      for (let i = 0; i < 4; i++) {
        currentRow = Math.min(currentRow + pageSize, totalRows - 1);
        expectedRows.push(currentRow);
      }

      handsontable({
        width: 180,
        height,
        startRows: totalRows,
        startCols: 3,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
      });

      function viewportSelectionPattern(rowIndex, rowCount) {
        const lines = Array.from({ length: rowCount }, (_, i) => {
          const mid = i === rowIndex ? ' # ' : '   ';

          return `        |   :${mid}:   |`;
        });

        return `\n${lines.join('\n')}\n      `;
      }

      await selectCell(startRow, 1);

      for (let i = 0; i < expectedRows.length; i++) {
        await keyDownUp('pagedown');

        const row = expectedRows[i];
        const masterCore = hot().rootElement.querySelector('.ht_master .htCore');
        const visibleRowCount = masterCore.rows.length;

        expect(viewportSelectionPattern(row, visibleRowCount)).toBeMatchToSelectionPattern();
        expect(getSelectedRange()).toEqualCellRange([`highlight: ${row},1 from: ${row},1 to: ${row},1`]);
      }
    });

    it('should move the cell selection down to the last cell', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp('pagedown');

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

      await keyDownUp('pagedown');

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

    it('should move the cell selection down to the last cell and then to the first cell of the next column (autoWrap on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
      });

      await selectCell(1, 2);
      await keyDownUp('pagedown');

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

      await keyDownUp('pagedown');

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

    it('should move the cell selection down to the last row and then to the first column header of the next column (autoWrap on, navigableHeaders on)', async() => {
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

      await selectCell(1, 2);
      await keyDownUp('pagedown');

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

      await keyDownUp('pagedown');

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

    it('should move the cell selection down for oversized row', async() => {
      handsontable({
        width: 180,
        height: 100,
        rowHeights: 200,
        navigableHeaders: false,
        startRows: 15,
        startCols: 3
      });

      await selectCell(0, 0);
      await keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);

      await keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);

      await keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
    });
  });
});
