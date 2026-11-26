import Handsontable from 'handsontable/base';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * `afterSelection` and `afterSelectionByProp` report a range and a selection layer level. A re-lay of
 * a multi-layer selection (`Selection#refresh()`) ends the active layer last, and reports each layer
 * with its own range and level (DEV-509). Every other path keeps what it reported before: the last
 * layer's range, at the last level.
 */
describe('Core afterSelection layer level', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: Array.from({ length: 6 }, (_, row) => Array.from({ length: 4 }, (__, col) => `${row}-${col}`)),
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  /**
   * Reads the range and the level of every `afterSelection` call.
   *
   * @param {jest.Mock} listener The listener.
   * @returns {number[][]}
   */
  function reported(listener) {
    return listener.mock.calls.map(call => [...call.slice(0, 4), call[5]]);
  }

  it('reports every layer with its own range and level on a re-lay, the active one last', () => {
    hot.selectCells([[0, 0, 1, 0], [3, 0, 4, 0]]);
    // Moves the focus from the last layer to the first one.
    hot.selection.transformFocus(2, 0);

    const afterSelection = jest.fn();
    const afterSelectionByProp = jest.fn();

    hot.addHook('afterSelection', afterSelection);
    hot.addHook('afterSelectionByProp', afterSelectionByProp);
    hot.selection.refresh();

    expect(reported(afterSelection)).toEqual([
      [3, 0, 4, 0, 1],
      [0, 0, 1, 0, 0],
    ]);
    expect(reported(afterSelectionByProp)).toEqual([
      [3, 0, 4, 0, 1],
      [0, 0, 1, 0, 0],
    ]);
  });

  it('keeps reporting the last layer when Shift+arrow extends a layer that is not the last', () => {
    hot.selectCells([[0, 0, 1, 0], [3, 0, 4, 0]]);
    hot.selection.transformFocus(2, 0);

    const afterSelection = jest.fn();

    hot.addHook('afterSelection', afterSelection);
    // Extends the active (first) layer by one column.
    hot.selection.transformEnd(0, 1);

    expect(hot.getSelected()).toEqual([[0, 0, 1, 1], [3, 0, 4, 0]]);
    // What it reported before DEV-509: the last layer, at the last level.
    expect(reported(afterSelection)).toEqual([[3, 0, 4, 0, 1]]);
  });
});
