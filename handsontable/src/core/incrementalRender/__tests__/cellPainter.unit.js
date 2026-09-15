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

  return { painter, state, rendered, cellProperties };
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

  it('should stamp the stable identity when the engine offers one, so a moved band does not repaint the cell', () => {
    const { painter, rendered } = createHarness();
    const TD = document.createElement('td');

    // The rows recycle: the element keeps its row while the band's offsets move underneath.
    expect(painter.shouldPaint(0, 0, TD, 'master,0,20,0,10', 'master')).toBe(true);
    painter.paint(0, 0, TD);

    expect(painter.shouldPaint(0, 0, TD, 'master,3,20,0,10', 'master')).toBe(false);
    expect(rendered).toEqual(['v1']);
  });

  it('should keep the full band identity for a spanned cell, so a moved band repaints it', () => {
    const { painter, rendered, cellProperties } = createHarness();
    const TD = document.createElement('td');

    // MergeCells marks the origin of a merged block `spanned` (covered cells resolve to that meta) and
    // clamps the block's span to the rendered band, so the paint depends on where the band starts.
    cellProperties.spanned = true;

    expect(painter.shouldPaint(0, 0, TD, 'master,0,20,0,10', 'master')).toBe(true);
    painter.paint(0, 0, TD);

    expect(painter.shouldPaint(0, 0, TD, 'master,0,20,0,10', 'master')).toBe(false);
    expect(painter.shouldPaint(0, 0, TD, 'master,3,20,0,10', 'master')).toBe(true);
    painter.paint(0, 0, TD);

    expect(rendered).toEqual(['v1', 'v1']);
  });

  it('should keep the full band identity when the engine offers no stable one', () => {
    const { painter } = createHarness();
    const TD = document.createElement('td');

    expect(painter.shouldPaint(0, 0, TD, 'master,0,20,0,10', null)).toBe(true);
    painter.paint(0, 0, TD);

    expect(painter.shouldPaint(0, 0, TD, 'master,3,20,0,10', null)).toBe(true);
  });
});
