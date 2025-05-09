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

  describe('"ArrowLeft"', () => {
    it('should move the cell selection to the left', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
    });

    it('should move the header selection to the left (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        await selectCell(1, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,4 from: 1,4 to: 1,4']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        await selectCell(1, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        await selectCell(1, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers, navigableHeaders on)', async() => {
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

        await selectCell(1, -3);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the row headers range (with headers, navigableHeaders on)', async() => {
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

        await selectCell(1, 0);
        await keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        await selectCell(4, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected (with header)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        await selectCell(4, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-right corner, if the most bottom-left cell is selected (with header, navigableHeaders on)', async() => {
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

        await selectCell(4, 4);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
      });
    });
  });
});
