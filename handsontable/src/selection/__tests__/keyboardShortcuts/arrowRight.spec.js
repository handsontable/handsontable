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

  describe('"ArrowRight"', () => {
    it('should move the cell selection to the right', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(0, 0);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should move the header selection to the right (navigableHeaders on)', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the right when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should move the header selection to the right from the corner when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      keyDownUp('arrowright');

      expect(`
        |   ║ # :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the right when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    describe('with autoWrap disabled', () => {
      it('should NOT move the cell selection to the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: false
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,4 from: 0,4 to: 0,4']);
      });
    });

    describe('with autoWrap enabled', () => {
      it('should move the cell selection to the first column of the row below, if the last column is already selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers, navigableHeaders off)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true
        });

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      });

      it('should move the cell selection to the first column of the row below, if the last column is already selected (with headers, navigableHeaders on)', () => {
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

        selectCell(0, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders off)', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          colHeaders: true,
          rowHeaders: true,
          autoWrapRow: true,
        });

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });

      it('should move the cell selection to the top-left corner, if the most bottom-right cell is selected (with headers, navigableHeaders on)', () => {
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

        selectCell(4, 4);
        keyDownUp('arrowright');

        expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -3,-3']);
      });

      it('should traverse whole table by constantly selecting next cell in row', () => {
        handsontable({
          startRows: 5,
          startCols: 5,
          autoWrapRow: true
        });

        selectCell(0, 0);

        for (let row = 0, rlen = countRows(); row < rlen; row++) {
          for (let col = 0, clen = countCols(); col < clen; col++) {
            expect(getSelectedRange()).toEqualCellRange([
              `highlight: ${row},${col} from: ${row},${col} to: ${row},${col}`
            ]);
            keyDownUp('arrowright');
          }
        }

        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      });
    });
  });
});
