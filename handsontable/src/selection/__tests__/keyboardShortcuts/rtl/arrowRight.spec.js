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
});
