import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable/base';
import { Formulas, registerPlugin, UndoRedo } from 'handsontable/plugins';

registerPlugin(Formulas);
registerPlugin(UndoRedo);

/**
 * How the engine follows the grid when an action is undone. The legacy browser specs for the same
 * topic are `plugins/undoRedo.spec.js`.
 */
describe('Formulas – undo', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
      hot = null;
    }

    container.remove();
  });

  // DEV-688: after the undo the formula column showed the formula text instead of the results.
  it('should show the calculated values again after undoing a paste that added columns', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [[1, 2, '=A1*B1'], [3, 4, '=A2*B2'], [5, 6, '=A3*B3']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      undo: true,
    });

    const before = hot.getData();

    expect(before).toEqual([[1, 2, 2], [3, 4, 12], [5, 6, 30]]);

    hot.populateFromArray(0, 1, [['x', 'y', 'z'], ['x', 'y', 'z']], undefined, undefined, 'CopyPaste.paste');

    expect(hot.countCols()).toBe(4);

    hot.getPlugin('undoRedo').undo();

    expect(hot.countCols()).toBe(3);
    expect(hot.getData()).toEqual(before);
  });
});
