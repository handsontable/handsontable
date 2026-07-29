describe('settings', () => {
  describe('moveCells', () => {
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

    describe('moveCellRange()', () => {
      it('moves a range data to the target and clears the source', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(5, 5)).toBe(src);
        expect(getDataAtCell(2, 2)).toBe(null);
        expect(getSelected()).toEqual([[5, 5, 6, 6]]);
      });

      it('copies (keeps source) when isCopy is true', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // kept
        expect(getDataAtCell(5, 5)).toBe(src);
      });

      it('vetoes the move when beforeMoveCells returns false', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, beforeMoveCells: () => false });
        const src = getDataAtCell(2, 2);
        const dst = getDataAtCell(5, 5);

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged
        expect(getDataAtCell(5, 5)).toBe(dst); // unchanged
      });

      it('fires afterMoveCells with source, target, isCopy', async() => {
        const spy = jasmine.createSpy('afterMoveCells');

        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, afterMoveCells: spy });

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(spy).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), false);
      });

      it('vetoes when the target overlaps a read-only cell', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          moveCells: true,
          cell: [{ row: 5, col: 5, readOnly: true }]
        });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged, vetoed
      });

      it('moves cell formatting (className meta) with the data', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'my-cell');
        await render();

        await selectCells([[2, 2, 2, 2]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getCellMeta(5, 5).className).toBe('my-cell');
        expect(getCellMeta(2, 2).className).not.toBe('my-cell');
      });

      it('vetoes the move when the source or target intersects a merged cell', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          moveCells: true,
          mergeCells: [{ row: 5, col: 5, rowspan: 2, colspan: 2 }]
        });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged: target intersects the merge → vetoed
      });

      it('keeps the source cell className when isCopy is true', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'my-cell');
        await render();

        await selectCells([[2, 2, 2, 2]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
        await hot().render();

        expect(getCellMeta(5, 5).className).toBe('my-cell');
        expect(getCellMeta(2, 2).className).toBe('my-cell'); // copy – source still has className
      });

      it('moves data correctly when the target overlaps the source range', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });

        // Source 2x2 block at rows 2-3, cols 2-3; target top-left (2, 3) overlaps cols 3.
        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 3), false);
        await hot().render();

        expect(getDataAtCell(2, 3)).toBe('C3');
        expect(getDataAtCell(2, 4)).toBe('D3');
        expect(getDataAtCell(3, 3)).toBe('C4');
        expect(getDataAtCell(3, 4)).toBe('D4');
        // The non-overlapping part of the source is cleared.
        expect(getDataAtCell(2, 2)).toBe(null);
        expect(getDataAtCell(3, 2)).toBe(null);
      });

      it('moves cell formatting correctly when the target overlaps the source range', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'meta-a');
        await setCellMeta(2, 3, 'className', 'meta-b');
        await render();

        await selectCells([[2, 2, 2, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 3), false);
        await hot().render();

        // (2,3) receives (2,2)'s meta and (2,4) receives (2,3)'s ORIGINAL meta — an in-place
        // move would overwrite (2,3)'s meta before reading it and duplicate 'meta-a' into (2,4).
        expect(getCellMeta(2, 3).className).toBe('meta-a');
        expect(getCellMeta(2, 4).className).toBe('meta-b');
        expect(getCellMeta(2, 2).className).not.toBe('meta-a');
      });

      it('does not fire beforeMoveCells when the target range would overflow the grid bounds', async() => {
        const spy = jasmine.createSpy('beforeMoveCells');

        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, beforeMoveCells: spy });

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(9, 9), false);

        // Validation runs before the hook, so listeners never observe a rejected move.
        expect(spy).not.toHaveBeenCalled();
      });

      it('does not fire beforeMoveCells when the target overlaps a read-only cell', async() => {
        const spy = jasmine.createSpy('beforeMoveCells');

        handsontable({
          data: createSpreadsheetData(10, 10),
          moveCells: true,
          beforeMoveCells: spy,
          cell: [{ row: 5, col: 5, readOnly: true }]
        });

        await selectCells([[2, 2, 3, 3]]);
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);

        expect(spy).not.toHaveBeenCalled();
      });

      it('vetoes the move when the target range would overflow the grid bounds', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        // Target (9, 9) + 2x2 range → bottom=10, right=10 — both exceed the 10x10 grid (max index 9)
        await getPlugin('moveCells').moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(9, 9), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged, vetoed
      });
    });
  });
});
