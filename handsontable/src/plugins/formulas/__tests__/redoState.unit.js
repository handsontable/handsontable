import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { Formulas } from '../formulas';
import { UndoRedo } from '../../undoRedo';

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
});
