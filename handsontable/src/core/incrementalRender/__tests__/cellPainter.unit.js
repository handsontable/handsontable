import { CellPainter } from '../cellPainter';
import { RenderChangeTracker } from '../renderChangeTracker';

/**
 * Builds a minimal Handsontable stand-in: one cell in `renderMode: 'onChange'` whose value the test
 * can change between calls, and a renderer that records the value it was handed.
 *
 * @returns {object}
 */
function createHarness() {
  const cellProperties = { renderMode: 'onChange', row: 0, col: 0 };
  const rendered = [];
  const renderer = (hot, TD, row, column, prop, value) => {
    rendered.push(value);
  };
  const state = { value: 'v1' };
  const hot = {
    runHooks: (name, ...args) => (name === 'modifyGetCellCoords' ? undefined : args[0]),
    hasHook: () => false,
    getCellMeta: () => cellProperties,
    colToProp: column => column,
    getDataAtRowProp: () => state.value,
    // `renderCell` chains the base renderer after a renderer that did not call it itself.
    getCellRenderer: cellMeta => (cellMeta.renderer === 'base' ? () => {} : renderer),
  };
  const painter = new CellPainter(hot, new RenderChangeTracker(), (row, column) => [row, column]);

  return { painter, state, rendered };
}

describe('CellPainter', () => {
  it('should paint a cell the first time and skip it when nothing changed', () => {
    const { painter, rendered } = createHarness();
    const TD = document.createElement('td');

    expect(painter.shouldPaint(0, 0, TD, 'band')).toBe(true);
    painter.paint(0, 0, TD);
    expect(rendered).toEqual(['v1']);

    expect(painter.shouldPaint(0, 0, TD, 'band')).toBe(false);
  });

  it('should resolve the cell afresh when a paint comes after a skipped decision', () => {
    const { painter, state, rendered } = createHarness();
    const TD = document.createElement('td');

    painter.shouldPaint(0, 0, TD, 'band');
    painter.paint(0, 0, TD);
    expect(painter.shouldPaint(0, 0, TD, 'band')).toBe(false);

    // The value changes with no draw in between, then something paints the cell directly (the
    // validation flow does this). The paint must not reuse the resolution of the skipped decision.
    state.value = 'v2';
    painter.paint(0, 0, TD);

    expect(rendered).toEqual(['v1', 'v2']);
    expect(painter.shouldPaint(0, 0, TD, 'band')).toBe(true);
  });
});
