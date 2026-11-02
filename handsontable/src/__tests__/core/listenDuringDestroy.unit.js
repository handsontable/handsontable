import Handsontable from 'handsontable/base';

/**
 * Builds a grid in a new container.
 *
 * @returns {Handsontable}
 */
function createGrid() {
  const container = document.createElement('div');

  document.body.appendChild(container);

  return new Handsontable(container, {
    data: [['A1', 'B1'], ['A2', 'B2']],
    licenseKey: 'non-commercial-and-evaluation',
  });
}

describe('listen() on a grid that is being destroyed', () => {
  it('should leave another grid listening', () => {
    const destroyed = createGrid();
    const other = createGrid();

    // A plugin that hands the keyboard back while it tears down calls `listen()` from its `destroy()`.
    destroyed.addHook('afterDestroy', () => destroyed.listen());
    other.listen();
    destroyed.destroy();

    expect(other.isListening()).toBe(true);

    other.rootElement.parentElement.remove();
    other.destroy();
  });

  it('should still hand the keyboard between grids that are not being destroyed', () => {
    const first = createGrid();
    const second = createGrid();

    second.listen();
    first.listen();

    expect(first.isListening()).toBe(true);
    expect(second.isListening()).toBe(false);

    first.destroy();
    second.destroy();
  });
});
