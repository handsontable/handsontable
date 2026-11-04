import Handsontable from 'handsontable/base';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

const containers = [];
const grids = [];

/**
 * Builds a grid in a new container.
 *
 * @returns {Handsontable}
 */
function createGrid() {
  const container = document.createElement('div');

  document.body.appendChild(container);
  containers.push(container);

  const hot = new Handsontable(container, {
    data: [['A1', 'B1'], ['A2', 'B2']],
    licenseKey: TEST_LICENSE_KEY,
  });

  grids.push(hot);

  return hot;
}

describe('listen() on a grid that is being destroyed', () => {
  afterEach(() => {
    grids.splice(0).forEach((hot) => {
      if (!hot.isDestroyed) {
        hot.destroy();
      }
    });
    containers.splice(0).forEach(container => container.remove());
  });

  it('should leave another grid listening', () => {
    const destroyed = createGrid();
    const other = createGrid();

    // A plugin that hands the keyboard back while it tears down calls `listen()` from its `destroy()`.
    destroyed.addHook('afterDestroy', () => destroyed.listen());
    other.listen();
    destroyed.destroy();

    expect(other.isListening()).toBe(true);
  });

  it('should still hand the keyboard between grids that are not being destroyed', () => {
    const first = createGrid();
    const second = createGrid();

    second.listen();
    first.listen();

    expect(first.isListening()).toBe(true);
    expect(second.isListening()).toBe(false);
  });
});
