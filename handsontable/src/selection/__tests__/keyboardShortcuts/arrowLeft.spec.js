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

  describe('"ArrowLeft"', () => {
    it('should move the cell selection to the left', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });

    it('should move the header selection to the left (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 3);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the left when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 3);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the left to the corner when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 0);
      await keyDownUp('arrowleft');

      expect(`
        | # ║   :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });

    it('should move the header selection to the left when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectCell(-1, 3);
      await keyDownUp('arrowleft');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row above, if the first column is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        await selectCell(1, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the last column of the row above, if the first column is already selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        await selectCell(1, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already' +
        ' selected (navigableHeaders: on -> navigableHeaders: off)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          rowHeaders: true,
          navigableHeaders: true,
          autoWrapRow: true
        });

        await selectCell(1, 0);
        await keyDownUp('arrowleft');

        await updateSettings({ navigableHeaders: false });

        await selectCell(1, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already selected (with headers)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
        });

        await selectCell(1, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });

      it('should move the cell selection to the last column of the row above, if the first column is already selected (with headers, navigableHeaders on)', async() => {
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
        await keyDownUp('arrowleft');

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
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        await selectCell(0, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left cell is selected (with headers)', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        await selectCell(0, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the bottom-right corner, if the most top-left header is selected (with headers, navigableHeaders on)', async() => {
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

        await selectCell(-3, -3);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });

      it('should move the cell selection to the corner range, if the most top-left cell is selected (with headers, navigableHeaders on)', async() => {
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

        await selectCell(0, 0);
        await keyDownUp('arrowleft');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
      });

      it('should traverse whole table by constantly selecting previous cell in row', async() => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        await selectCell(4, 4);

        for (let row = countRows() - 1; row >= 0; row--) {
          for (let col = countCols() - 1; col >= 0; col--) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            await keyDownUp('arrowleft');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 4,4 to: 4,4']);
      });
    });
  });
});
