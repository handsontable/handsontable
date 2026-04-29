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

    // TODO: DEV-99 - fix: this test needs a range selection (rows 1-2, cols 2-4) which uses
    // the .area fill handle. The simulateFillHandleDrag helper currently only targets
    // .current.corner. Needs investigation into how to drag .area.corner outside the viewport.
    xit('should populate dates and formulas referencing to them properly', async() => {
      handsontable({
        data: [
          [null, null, null, null, null],
          [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
          [null, null, '=C2', '=D2', '=E2'],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
          [null, null, null, null, null],
        ],
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1'
        },
        columns: [{}, {}, {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }, {
          type: 'date',
          dateFormat: 'DD/MM/YYYY'
        }, {
          type: 'date',
          dateFormat: 'MM/DD/YYYY'
        }],
        fillHandle: true,
        width: 400,
        height: 130,
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCells([[1, 2, 2, 4]]);

      // Drag fill handle below the viewport to extend through all remaining rows.
      // Use a visible cell as the anchor and add a large offsetY to push mouse below viewport.
      const visibleCell = $(getCell(2, 2, true));

      simulateFillHandleDragStart(visibleCell);
      simulateFillHandleDragMove(visibleCell, { offsetY: 400 });

      await waitForNextAnimationFrames(30);

      simulateFillHandleDragFinish(visibleCell, { offsetY: 400 });

      const formulasPlugin = getPlugin('formulas');

      expect(getData()).toEqual([
        [null, null, null, null, null],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, null, null, null]
      ]);

      expect(getSourceData()).toEqual([
        [null, null, null, null, null],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C2', '=D2', '=E2'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C4', '=D4', '=E4'],
        [null, null, '28/02/1900', '28/02/1900', '28/02/1900'],
        [null, null, '=C6', '=D6', '=E6'],
        [null, null, null, null, null]
      ]);

      expect(formulasPlugin.engine.getSheetValues(0)).toEqual([
        [],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
        [null, null, '28/02/1900', 60, '28/02/1900'],
      ]);

      expect(formulasPlugin.engine.getSheetSerialized(0)).toEqual([
        [],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C2', '=D2', '=E2'],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C4', '=D4', '=E4'],
        [null, null, '\'28/02/1900', '28/02/1900', '\'28/02/1900'],
        [null, null, '=C6', '=D6', '=E6'],
      ]);

      expect(getCellMeta(3, 2).valid).toBe(false);
      expect(getCellMeta(3, 3).valid).toBe(true);
      expect(getCellMeta(3, 4).valid).toBe(false);

      expect(getCellMeta(4, 2).valid).toBe(false);
      expect(getCellMeta(4, 3).valid).toBe(true);
      expect(getCellMeta(4, 4).valid).toBe(false);

      expect(getCellMeta(5, 2).valid).toBe(false);
      expect(getCellMeta(5, 3).valid).toBe(true);
      expect(getCellMeta(5, 4).valid).toBe(false);

      expect(getCellMeta(6, 2).valid).toBe(false);
      expect(getCellMeta(6, 3).valid).toBe(true);
      expect(getCellMeta(6, 4).valid).toBe(false);
    });
  });
});
