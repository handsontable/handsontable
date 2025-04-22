describe('settings', () => {
  describe('enterMoves', () => {
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

    it('should move the focus to the next cell by the number of steps defined in the object (single cell selection)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        enterMoves: { row: 3, col: 2 },
        autoWrapRow: true,
        autoWrapCol: true,
      });

      selectCell(0, 0);
      keyDownUp('enter'); // open editor
      keyDownUp('enter'); // navigate to next cell

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 3,2']);
    });

    it('should move the focus to the previous cell by the number of steps defined in the object (single cell selection)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        enterMoves: { row: 3, col: 2 },
        autoWrapRow: true,
        autoWrapCol: true,
      });

      selectCell(9, 9);
      keyDownUp(['shift', 'enter']); // open editor
      keyDownUp(['shift', 'enter']); // navigate to next cell

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,7 from: 6,7 to: 6,7']);
    });

    it('should move the focus to the next cell by the number of steps defined in the object (multiple cells selection)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        enterMoves: { row: 3, col: 2 }
      });

      selectCell(1, 1, 6, 6);
      keyDownUp('enter');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 1,1 to: 6,6']);

      keyDownUp('enter');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,6 from: 1,1 to: 6,6']);

      keyDownUp('enter');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,2 from: 1,1 to: 6,6']);
    });

    it('should move the focus to the previous cell by the number of steps defined in the object (multiple cells selection)', () => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        enterMoves: { row: 3, col: 2 }
      });

      selectCell(1, 1, 6, 6);
      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,4 from: 1,1 to: 6,6']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,1 to: 6,6']);

      keyDownUp(['shift', 'enter']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 1,1 to: 6,6']);
    });

    it('should be possible to use custom function', () => {
      const enterMoves = jasmine.createSpy('enterMoves').and.returnValue({ row: 3, col: 2 });

      handsontable({
        data: createSpreadsheetData(10, 10),
        enterMoves,
      });

      selectCell(0, 0);
      keyDownUp('enter'); // open editor
      keyDownUp('enter'); // navigate to next cell

      expect(enterMoves).toHaveBeenCalledOnceWith(jasmine.any(Event));
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 3,2']);
    });
  });
});
