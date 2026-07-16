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
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await sleep(50);

        expect(getDataAtCell(5, 5)).toBe(src);
        expect(getDataAtCell(2, 2)).toBe(null);
        expect(getSelected()).toEqual([[5, 5, 6, 6]]);
      });

      it('copies (keeps source) when isCopy is true', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), true);
        await sleep(50);

        expect(getDataAtCell(2, 2)).toBe(src); // kept
        expect(getDataAtCell(5, 5)).toBe(src);
      });

      it('vetoes the move when beforeMoveCells returns false', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, beforeMoveCells: () => false });
        const src = getDataAtCell(2, 2);
        const dst = getDataAtCell(5, 5);

        await selectCells([[2, 2, 3, 3]]);
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await sleep(50);

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged
        expect(getDataAtCell(5, 5)).toBe(dst); // unchanged
      });

      it('fires afterMoveCells with source, target, isCopy', async() => {
        const spy = jasmine.createSpy('afterMoveCells');

        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true, afterMoveCells: spy });

        await selectCells([[2, 2, 3, 3]]);
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await sleep(50);

        expect(spy).toHaveBeenCalled();
      });

      it('vetoes when the target overlaps a read-only cell', async() => {
        handsontable({
          data: createSpreadsheetData(10, 10),
          moveCells: true,
          cell: [{ row: 5, col: 5, readOnly: true }]
        });
        const src = getDataAtCell(2, 2);

        await selectCells([[2, 2, 3, 3]]);
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await sleep(50);

        expect(getDataAtCell(2, 2)).toBe(src); // unchanged, vetoed
      });

      it('moves cell formatting (className meta) with the data', async() => {
        handsontable({ data: createSpreadsheetData(10, 10), moveCells: true });
        await setCellMeta(2, 2, 'className', 'my-cell');
        await render();

        await selectCells([[2, 2, 2, 2]]);
        hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(5, 5), false);
        await sleep(50);

        expect(getCellMeta(5, 5).className).toBe('my-cell');
        expect(getCellMeta(2, 2).className).not.toBe('my-cell');
      });
    });
  });
});
