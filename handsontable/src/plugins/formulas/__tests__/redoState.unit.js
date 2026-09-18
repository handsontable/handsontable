import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { ManualRowMove } from '../../manualRowMove';
import { TrimRows } from '../../trimRows';

/**
 * The plugin registered its redo-state reset on `afterUndo` (twice) instead of `afterRedo`, so
 * `setPerformRedo(false)` never ran after a redo and the flag leaked until the next undo — for
 * every action type. While leaked, `isPerformingUndoRedo()` stays `true`, which makes the plugin
 * treat subsequent operations as undo/redo replay (those paths skip engine work that normal
 * operations must perform).
 */
describe('Formulas redo state', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(UndoRedo);
    registerPlugin(ManualRowMove);
    registerPlugin(TrimRows);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a small grid with the formulas and undoRedo plugins on.
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: [
        [1, '=A1+10'],
        [2, null],
      ],
      formulas: {
        engine: HyperFormula,
      },
      undoRedo: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  it('clears the undo/redo state after an undo', () => {
    build();

    hot.setDataAtCell(1, 0, 5);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getPlugin('formulas').indexSyncer.isPerformingUndoRedo()).toBe(false);
  });

  it('clears the undo/redo state after a redo', () => {
    build();

    hot.setDataAtCell(1, 0, 5);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();

    expect(hot.getPlugin('formulas').indexSyncer.isPerformingUndoRedo()).toBe(false);
  });

  it('redoes the data change correctly', () => {
    // Sanity companion: the redo itself must still apply, in both the grid and the engine.
    build();

    hot.setDataAtCell(1, 0, 5);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();

    expect(hot.getDataAtCell(1, 0)).toBe(5);
    expect(hot.getDataAtCell(0, 1)).toBe(11);
  });

  it('keeps a row move performed right after a redo synchronized with the engine', () => {
    // The behavioral consequence of the leaked flag: the axis syncer treats every operation
    // between a redo and the next undo as undo/redo replay and skips syncing row moves to the
    // engine, so a formula entered afterwards resolves its address against a stale row order.
    hot = new Handsontable(container, {
      data: [
        [1, null],
        [2, null],
        [3, null],
      ],
      formulas: {
        engine: HyperFormula,
      },
      undoRedo: true,
      manualRowMove: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.setDataAtCell(0, 1, 100);
    hot.getPlugin('undoRedo').undo();
    hot.getPlugin('undoRedo').redo();

    // Move the last row to the top: visual order is now 3, 1, 2.
    hot.getPlugin('manualRowMove').moveRow(2, 0);
    hot.render();

    // A formula referencing A1 written after the move must see the moved row's value.
    hot.setDataAtCell(1, 1, '=A1');

    expect(hot.getDataAtCell(1, 1)).toBe(3);
  });

  it('clears the redo state after a redo cancelled by a beforeRedo listener', () => {
    // A cancelled redo never fires `afterRedo`, so the reset must also happen on `afterUndo` —
    // otherwise the flag set in `beforeRedo` would leak until the next successful redo.
    build();

    // Two done actions: the cancelled redo consumes one from the undone stack, and the final
    // `undo()` must still be a REAL undo (its `afterUndo` hook performs the reset under test).
    hot.setDataAtCell(1, 0, 5);
    hot.setDataAtCell(1, 1, 9);
    hot.getPlugin('undoRedo').undo();

    hot.addHook('beforeRedo', () => false);
    hot.getPlugin('undoRedo').redo();
    hot.getPlugin('undoRedo').undo();

    expect(hot.getPlugin('formulas').indexSyncer.isPerformingUndoRedo()).toBe(false);
  });

  // An undo or redo whose removal names no row any more changes nothing in Handsontable. It has to be
  // refused before `beforeUndo` / `beforeRedo`, because this plugin steps HyperFormula in those hooks: a
  // refusal found only after them left the engine one step away from the grid and the undo/redo flag set.
  describe('an undo or redo that would remove no row', () => {
    /**
     * Builds a grid with a formula, so the engine records every row operation on its own undo stack.
     *
     * @returns {object} The Handsontable instance.
     */
    function buildWithTrimRows() {
      hot = new Handsontable(container, {
        data: [
          [1, '=A1+10'],
          [2, null],
          [3, null],
          [4, null],
          [5, null],
        ],
        formulas: {
          engine: HyperFormula,
        },
        undoRedo: true,
        trimRows: true,
        licenseKey: 'non-commercial-and-evaluation',
      });

      return hot;
    }

    it('does not step the engine when undoing a row insertion whose index no longer exists', () => {
      buildWithTrimRows();
      const { engine, indexSyncer } = hot.getPlugin('formulas');
      const beforeUndo = jest.fn();

      hot.alter('insert_row_above', 5, 1); // recorded at visual index 5
      // A trim is not on the undo stack and does not touch the engine, so the index goes stale while the
      // engine's own undo stack keeps the row insertion.
      hot.getPlugin('trimRows').trimRows([0, 1, 2]);
      hot.addHook('beforeUndo', beforeUndo);

      expect(engine.isThereSomethingToUndo()).toBe(true);

      hot.getPlugin('undoRedo').undo();

      expect(beforeUndo).not.toHaveBeenCalled();
      expect(engine.isThereSomethingToUndo()).toBe(true);
      expect(indexSyncer.isPerformingUndoRedo()).toBe(false);
    });

    it('does not step the engine or delete another row when redoing a removal of a trimmed row', () => {
      buildWithTrimRows();
      const { engine, indexSyncer } = hot.getPlugin('formulas');
      const beforeRedo = jest.fn();

      hot.alter('remove_row', 1, 1); // records physical row 1
      hot.getPlugin('undoRedo').undo();
      // The recorded row is now trimmed, so `toVisualRow()` returns `null`, which `alter()` would read as
      // "take the rows from the end".
      hot.getPlugin('trimRows').trimRows([1]);
      hot.addHook('beforeRedo', beforeRedo);

      expect(engine.isThereSomethingToRedo()).toBe(true);

      hot.getPlugin('undoRedo').redo();

      expect(beforeRedo).not.toHaveBeenCalled();
      expect(engine.isThereSomethingToRedo()).toBe(true);
      expect(indexSyncer.isPerformingUndoRedo()).toBe(false);
      // The last row is still there: nothing was removed from the end in place of the trimmed one.
      expect(hot.getSourceDataAtCol(0)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
