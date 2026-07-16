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
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(5, 5)).toBe(src);
        expect(getDataAtCell(2, 2)).toBe(null);
        expect(getSelected()).toEqual([[5, 5, 6, 6]]);
      });

      it('copies (keeps source) when isCopy is true', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // kept
        expect(getDataAtCell(5, 5)).toBe(src);
      });

      it('vetoes the move when beforeMoveCells returns false', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, beforeMoveCells: () => false });
        const src = getDataAtCell(2, 2);
        const dst = getDataAtCell(5, 5);

        await selectCells([[2, 2, 3, 3]]);
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged
        expect(getDataAtCell(5, 5)).toBe(dst); // unchanged
      });

      it('fires afterMoveCells with source, target, isCopy', async() => {
        const spy = jasmine.createSpy('afterMoveCells');

        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, afterMoveCells: spy });

        await selectCells([[2, 2, 3, 3]]);
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
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
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged, vetoed
      });

      it('moves cell formatting (className meta) with the data', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'my-cell');
        await render();

        await selectCells([[2, 2, 2, 2]]);
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
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
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged: target intersects the merge → vetoed
      });

      it('keeps the source cell className when isCopy is true', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'my-cell');
        await render();

        await selectCells([[2, 2, 2, 2]]);
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
        await hot().render();

        expect(getCellMeta(5, 5).className).toBe('my-cell');
        expect(getCellMeta(2, 2).className).toBe('my-cell'); // copy – source still has className
      });

      it('vetoes the move when the target range would overflow the grid bounds', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        // Target (9, 9) + 2x2 range → bottom=10, right=10 — both exceed the 10x10 grid (max index 9)
        await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(9, 9), false);
        await hot().render();

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged, vetoed
      });
    });
  });
});
