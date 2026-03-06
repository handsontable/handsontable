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

  describe('"ArrowDown"', () => {
    it('should move the cell selection below', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should move the header selection down (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      await keyDownUp('arrowdown');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the next column, if the last row is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: false
        });

        await selectCell(4, 0);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,0 from: 4,0 to: 4,0']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first row of the next column, if the first row is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        await selectCell(4, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      });

      it('should move the cell selection to the first row of the next column, if the first row is already selected (with headers)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        await selectCell(4, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      });

      it('should move the cell selection to the first row of the next column, if the first row is already selected (with headers, navigableHeaders on)', async() => {
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

        await selectCell(4, 1);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        await selectCell(4, 4);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapCol: true
        });

        await selectCell(4, 4);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders on)', async() => {
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

        await selectCell(4, 4);
        await keyDownUp('arrowdown');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
      });

      it('should traverse whole table by constantly selecting next cell in column', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapCol: true
        });

        await selectCell(0, 0);

        for (let col = 0, clen = countCols(); col < clen; col++) {
          for (let row = 0, rlen = countRows(); row < rlen; row++) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            await keyDownUp('arrowdown');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });
    });
  });
});
