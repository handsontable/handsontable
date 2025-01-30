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
    it.forTheme('classic')('should move the cell selection down by the height of the table viewport', () => {
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

    it.forTheme('main')('should move the cell selection down by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 126, // 126/29 (default cell height) rounding down is 4. So PageDown will move down one per 4 rows
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

    it('should move the cell selection down for oversized row', () => {
      handsontable({
        width: 180,
        height: 100,
        rowHeights: 200,
        navigableHeaders: false,
        startRows: 15,
        startCols: 3
      });

      selectCell(0, 0);
      keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);

      keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);

      keyDownUp('pagedown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
    });
  });
});
