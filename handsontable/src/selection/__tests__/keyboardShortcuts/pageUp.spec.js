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
      const layout = getThemeLayout();
      const height = layout.e2ePickForDensity({ compact: 100, default: 126, comfortable: 161 });
      const compact = layout.densityLevel === 'compact';
      const expectedRows = compact ? [10, 7, 4, 1, 0] : [9, 5, 1, 0];

      function viewportSelectionPattern(rowIndex) {
        const lines = Array.from({ length: 15 }, (_, i) => {
          const mid = i === rowIndex ? ' # ' : '   ';

          return `        |   :${mid}:   |`;
        });

        return `\n${lines.join('\n')}\n      `;
      }

      handsontable({
        width: 180,
        height,
        startRows: 15,
        startCols: 3,
        viewportRowRenderingOffset: 10,
        viewportColumnRenderingOffset: 10,
      });

      await selectCell(13, 1);

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
      const layout = getThemeLayout();
      const height = layout.e2ePickForDensity({ compact: 200, default: 252, comfortable: 322 });
      const firstVisibleAfterSelect = layout.e2ePickForDensity({ compact: 10, default: 9, comfortable: 9 });
      const firstVisibleAfterPage1 = layout.e2ePickForDensity({ compact: 6, default: 5, comfortable: 5 });

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

      expect(tableView().getFirstFullyVisibleRow()).toBe(firstVisibleAfterSelect);

      await keyDownUp('pageup');

      await waitForNextAnimationFrames(2);

      expect(tableView().getFirstFullyVisibleRow()).toBe(firstVisibleAfterPage1);

      await keyDownUp('pageup');

      await waitForNextAnimationFrames(2);

      expect(tableView().getFirstFullyVisibleRow()).toBe(0);
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
