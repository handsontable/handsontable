import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';
import { ManualRowMove } from '../../manualRowMove';

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
});
