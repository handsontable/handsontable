import HyperFormula from 'hyperformula';

describe('Formulas: moveCells undo/redo integration', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('undo of a move with Formulas plugin', () => {
    it('restores a moved formula cell: source recomputes and target is cleared', async() => {
      // B1 = '=A1+10' → computed as 11 (A1=1). Move B1 to B3, then undo.
      handsontable({
        data: [[1, '=A1+10'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      expect(getDataAtCell(0, 1)).toBe(11); // B1 = 11 before move

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 1), false);
      await hot().render();

      // After move: B1 cleared, B3 holds the formula computing 11.
      expect(getDataAtCell(0, 1)).toBe(null);
      expect(getDataAtCell(2, 1)).toBe(11);

      getPlugin('undoRedo').undo();
      await hot().render();

      // After undo: B3 cleared, B1 restored with formula string that recomputes to 11.
      expect(getDataAtCell(0, 1)).toBe(11);
      expect(getDataAtCell(2, 1)).toBe(null);
    });

    it('redo re-applies the move after undo', async() => {
      // B1 = '=A1+10' → computed as 11 (A1=1). Move → undo → redo.
      handsontable({
        data: [[1, '=A1+10'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 1), false);
      await hot().render();

      getPlugin('undoRedo').undo();
      await hot().render();

      // Confirm undo state.
      expect(getDataAtCell(0, 1)).toBe(11);
      expect(getDataAtCell(2, 1)).toBe(null);

      getPlugin('undoRedo').redo();
      await hot().render();

      // After redo: move re-applied — B3 holds the formula, B1 cleared.
      expect(getDataAtCell(2, 1)).toBe(11);
      expect(getDataAtCell(0, 1)).toBe(null);
    });

    it('undo of a copy keeps source and restores the overwritten target', async() => {
      // B1 = '=A1+10' → copy to B3. Undo should restore B3 to null and keep B1.
      handsontable({
        data: [[1, '=A1+10'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      expect(getDataAtCell(0, 1)).toBe(11); // B1 before copy

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 1), true); // isCopy=true
      await hot().render();

      // After copy: B1 still computes, B3 receives a copy of the formula.
      expect(getDataAtCell(0, 1)).toBe(11);
      // B3 has a shifted formula (relative ref row+2): =A3+10; A3=null → 0+10=10.
      expect(getDataAtCell(2, 1)).toBe(10);

      getPlugin('undoRedo').undo();
      await hot().render();

      // After undo: B3 restored to null; B1 keeps its formula.
      expect(getDataAtCell(0, 1)).toBe(11);
      expect(getDataAtCell(2, 1)).toBe(null);
    });

    it('source formula string is preserved in source data after undo', async() => {
      // Verify the formula string (not just computed value) is correctly restored at source.
      handsontable({
        data: [[1, '=A1+10'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 1), false);
      await hot().render();

      getPlugin('undoRedo').undo();
      await hot().render();

      // The source data at B1 should be the formula string (as stored in source data).
      expect(getSourceDataAtCell(0, 1)).toBe('=A1+10');
      // Target B3 source data should be null after undo.
      expect(getSourceDataAtCell(2, 1)).toBe(null);
    });
  });
});
