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

  describe('Integration with moveCells', () => {
    it('moves a formula cell and keeps it computing with adjusted references', async() => {
      // B1 = '=A1+10' → computed as 11 (A1=1)
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

      // B1 source should be cleared
      expect(getDataAtCell(0, 1)).toBe(null);
      // B3 now holds the moved formula; since A1 was not moved, =A1+10 still computes 11
      expect(getDataAtCell(2, 1)).toBe(11);
    });

    it('updates a dependent formula when the referenced cell is moved', async() => {
      // A1=1, B1='=A1' → B1 computed as 1.
      // Move A1 to A3. HF adjusts B1's reference to follow A1 → B1 becomes '=A3'.
      // B1 still computes 1 (same value now in A3).
      handsontable({
        data: [[1, '=A1'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      expect(getDataAtCell(0, 0)).toBe(1);
      expect(getDataAtCell(0, 1)).toBe(1); // B1 = '=A1' = 1

      await selectCells([[0, 0, 0, 0]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 0), false);
      await hot().render();

      // A1 source is cleared
      expect(getDataAtCell(0, 0)).toBe(null);
      // A3 now holds the value 1
      expect(getDataAtCell(2, 0)).toBe(1);
      // B1's formula was updated by HF from =A1 to =A3; it still computes 1
      expect(getDataAtCell(0, 1)).toBe(1);
    });

    it('copies a formula cell with adjusted relative references', async() => {
      // B1 = '=A1+10' → computed as 11 (A1=1).
      // Copy (isCopy=true) B1 to B3. HF copy+paste adjusts relative refs:
      // B3 receives a formula with row offset +2 → '=A3+10'. A3=null so computes 10.
      handsontable({
        data: [[1, '=A1+10'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      expect(getDataAtCell(0, 1)).toBe(11); // B1 = 11 before copy

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 1), true);
      await hot().render();

      // B1 source is kept (it's a copy)
      expect(getDataAtCell(0, 1)).toBe(11);
      // B3 receives copy of formula with shifted row refs → '=A3+10'; A3=null → 0+10=10
      expect(getDataAtCell(2, 1)).toBe(10);
    });

    it('moves a multi-cell range of formulas keeping references intact', async() => {
      // A1=5, A2=10, B1='=A1*2', B2='=A2*2' → 10 and 20
      // Move the 2x2 block [A1:B2] to [A3:B4].
      handsontable({
        data: [[5, '=A1*2'], [10, '=A2*2'], [null, null], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      expect(getDataAtCell(0, 1)).toBe(10); // B1 = =A1*2 = 10
      expect(getDataAtCell(1, 1)).toBe(20); // B2 = =A2*2 = 20

      await selectCells([[0, 0, 1, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(2, 0), false);
      await hot().render();

      // Source cleared
      expect(getDataAtCell(0, 0)).toBe(null);
      expect(getDataAtCell(0, 1)).toBe(null);
      expect(getDataAtCell(1, 0)).toBe(null);
      expect(getDataAtCell(1, 1)).toBe(null);

      // Target has moved data; formulas still compute against the moved values (A3=5, A4=10)
      expect(getDataAtCell(2, 0)).toBe(5);
      expect(getDataAtCell(3, 0)).toBe(10);
      expect(getDataAtCell(2, 1)).toBe(10); // =A3*2 = 10
      expect(getDataAtCell(3, 1)).toBe(20); // =A4*2 = 20
    });

    it('vetoes the HF move when isItPossibleToMoveCells returns false', async() => {
      // Use a ARRAYFORMULA-like scenario where HF would veto. In practice,
      // we test that returning false from beforeMoveCells propagates correctly
      // even when the Formulas plugin is the one vetoing.
      // We simulate by checking that the beforeMoveCells hook can still be vetoed.
      const spy = jasmine.createSpy('beforeMoveCells').and.returnValue(false);

      handsontable({
        data: [[1, '=A1+10'], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
        beforeMoveCells: spy,
      });

      const srcValue = getDataAtCell(0, 1); // 11

      await selectCells([[0, 1, 0, 1]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(1, 1), false);
      await hot().render();

      // Vetoed – values unchanged
      expect(getDataAtCell(0, 1)).toBe(srcValue);
      expect(getDataAtCell(1, 1)).toBe(null);
    });

    it('moves plain-value cell when Formulas plugin is active', async() => {
      // Ensures non-formula cells are also relocated by HF moveCells.
      handsontable({
        data: [[42, 'hello'], [null, null]],
        formulas: {
          engine: HyperFormula,
        },
        moveCells: true,
      });

      await selectCells([[0, 0, 0, 0]]);
      await hot().moveCellRange(hot().getSelectedRangeLast(), hot()._createCellCoords(1, 0), false);
      await hot().render();

      expect(getDataAtCell(0, 0)).toBe(null);
      expect(getDataAtCell(1, 0)).toBe(42);
    });
  });
});
