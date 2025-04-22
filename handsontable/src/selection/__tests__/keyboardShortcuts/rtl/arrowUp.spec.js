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
});
