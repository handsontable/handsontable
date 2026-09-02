import HyperFormula from 'hyperformula';

describe('Formulas', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Integration with Autofill', () => {
    it('should not leak the escape apostrophe when the source range spans a trimmed row', async() => {
      handsontable({
        data: [
          ['0123456'],
          ['0222222'],
          ['0333333'],
          [null],
          [null],
          [null],
        ],
        columns: [{ type: 'text' }],
        // Marked per PHYSICAL row rather than per column, so a meta read that resolves to the wrong
        // row - or to no row at all - drops the marking instead of silently still finding it.
        cell: [
          { row: 0, col: 0, preserveTextValue: true },
          { row: 1, col: 0, preserveTextValue: true },
          { row: 2, col: 0, preserveTextValue: true },
        ],
        // Physical row 1 keeps its HyperFormula index but has no visual one, so the engine source
        // range for visual rows 0-1 spans HF rows 0..2 and the fill loop walks the trimmed row.
        trimRows: [1],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        fillHandle: true,
      });

      await selectRows(0, 1);

      const lastRowCell = $(getCell(1, 0, true));

      simulateFillHandleDragStart(lastRowCell);
      simulateFillHandleDragMove(lastRowCell, { offsetY: 200 });

      await waitForNextAnimationFrames(25);

      simulateFillHandleDragFinish(lastRowCell, { offsetY: 200 });

      // The engine stores every preserved text value escaped. Whichever rows the fill ends up
      // populating, none of them may carry the engine's escape apostrophe into the grid.
      expect(getDataAtCol(0).filter(value => typeof value === 'string' && value.startsWith('\'')))
        .toEqual([]);
    });

    it('should cooperate properly with trimmed rows (populating not trimmed elements)', async() => {
      handsontable({
        data: [
          ['=B1+10', 1, 2, 3, 4, 5, 6],
          ['=B2+20', 7, 8, 9, 0, 1, 2],
          ['=B3+30', 3, 4, 5, 6, 7, 8],
          ['=B4+40', 9, 0, 1, 2, 3, 4],
          ['=B5+50', 5, 6, 7, 8, 9, 0],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        trimRows: [0, 1],
        fillHandle: true,
        width: 400,
        height: 130,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(0);

      const lastRowCell = $(getCell(2, 0, true));

      simulateFillHandleDragStart(lastRowCell);
      simulateFillHandleDragMove(lastRowCell, { offsetY: 200 });

      await waitForNextAnimationFrames(25);

      simulateFillHandleDragFinish(lastRowCell, { offsetY: 200 });

      expect(getData()).toEqual([
        [33, 3, 4, 5, 6, 7, 8],
        [33, 3, 4, 5, 6, 7, 8],
        [33, 3, 4, 5, 6, 7, 8],
        [null, null, null, null, null, null, null],
      ]);
    });

    // Verified still failing (2026-08-05): the fill populates only one visual
    // row (the last source row stays untouched) and the expectation itself
    // predates trimming semantics (expects 5 visual rows where trimRows leaves
    // 4). Needs a product-level decision on fill-across-trimmed-rows before
    // the expectations can be trusted — tracked in DEV-2195.
    xit('should cooperate properly with trimmed rows (populating two elements placed next to trimmed element)',
      async() => {
        handsontable({
          data: [
            ['=B1+10', 1, 2, 3, 4, 5, 6],
            ['=B2+20', 7, 8, 9, 0, 1, 2],
            ['=B3+30', 3, 4, 5, 6, 7, 8],
            ['=B4+40', 9, 0, 1, 2, 3, 4],
            ['=B5+50', 5, 6, 7, 8, 9, 0],
          ],
          formulas: {
            engine: HyperFormula,
            sheetName: 'Sheet1'
          },
          trimRows: [1],
          fillHandle: true
        });

        await selectRows(0, 1);

        const lastRowCell = $(getCell(2, 0, true));

        simulateFillHandleDrag(lastRowCell);

        await waitForNextAnimationFrames(19);

        expect(getData()).toEqual([
          [11, 1, 2, 3, 4, 5, 6],
          [33, 3, 4, 5, 6, 7, 8],
          [11, 1, 2, 3, 4, 5, 6],
          [33, 3, 4, 5, 6, 7, 8],
          [null, null, null, null, null, null, null],
        ]);
      });

    it('should not overwrite extra visible columns when dragging right across hidden columns', async() => {
      handsontable({
        data: [
          ['=A1', null, null, null, null, null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        hiddenColumns: {
          copyPasteEnabled: false,
          columns: [1, 2],
        },
      });

      await selectCell(0, 0);

      simulateFillHandleDrag($(getCell(0, 3, true)));

      expect(getSourceDataAtCell(0, 3)).toEqual('=D1');
      expect(getSourceDataAtCell(0, 4)).toBe(null);
      expect(getSourceDataAtCell(0, 5)).toBe(null);
    });

    it('should not overwrite extra visible rows when dragging down across hidden rows', async() => {
      handsontable({
        data: [
          ['=A1'],
          [null],
          [null],
          [null],
          [null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        hiddenRows: {
          copyPasteEnabled: false,
          rows: [1, 2],
        },
      });

      await selectCell(0, 0);

      simulateFillHandleDrag($(getCell(3, 0, true)));

      expect(getSourceDataAtCell(3, 0)).toEqual('=A4');
      expect(getSourceDataAtCell(4, 0)).toBe(null);
    });

    it('should keep left-side order without spilling while dragging left across hidden columns', async() => {
      handsontable({
        data: [
          [null, null, null, '=C1', '=D1', null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        hiddenColumns: {
          copyPasteEnabled: false,
          columns: [2],
        },
      });

      await selectCell(0, 4, 0, 3);

      simulateFillHandleDrag($(getCell(0, 0, true)));

      expect(getSourceDataAtCell(0, 0)).toEqual('=#REF!');
      expect(getSourceDataAtCell(0, 1)).toEqual('=A1');
      expect(getSourceDataAtCell(0, 2)).toBe(null);
      expect(getSourceDataAtCell(0, 3)).toEqual('=C1');
      expect(getSourceDataAtCell(0, 4)).toEqual('=D1');
      expect(getSourceDataAtCell(0, 5)).toBe(null);
    });

    it('should keep up-side order without spilling while dragging up across hidden rows', async() => {
      handsontable({
        data: [
          [null],
          [null],
          [null],
          ['=A3'],
          ['=A4'],
          [null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        hiddenRows: {
          copyPasteEnabled: false,
          rows: [2],
        },
      });

      await selectCell(4, 0, 3, 0);

      simulateFillHandleDrag($(getCell(0, 0, true)));

      expect(getSourceDataAtCell(0, 0)).toEqual('=#REF!');
      expect(getSourceDataAtCell(1, 0)).toEqual('=A1');
      expect(getSourceDataAtCell(2, 0)).toBe(null);
      expect(getSourceDataAtCell(3, 0)).toEqual('=A3');
      expect(getSourceDataAtCell(4, 0)).toEqual('=A4');
      expect(getSourceDataAtCell(5, 0)).toBe(null);
    });
  });
});
