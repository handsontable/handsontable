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

  describe('"Ctrl/Cmd + Home"', () => {
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
});
