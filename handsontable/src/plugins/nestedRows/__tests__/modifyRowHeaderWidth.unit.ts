import Handsontable from 'handsontable/base';
import { registerPlugin, NestedRows } from 'handsontable/plugins';

registerPlugin(NestedRows);

/**
 * `NestedRows` raises the row header width to the room its own indented header needs. Since
 * `AutoRowHeaderSize` arrived, the hook can carry one width per row header level instead of a single
 * number, and this handler has to cope with both shapes.
 *
 * The array shape is why it changed at all: `Math.max(cache, [58, 34])` returns `NaN`, and the `??`
 * in `ColumnUtils` does not catch a `NaN`, so the column would have rendered at `NaNpx`.
 *
 * @param {number} minimumWidth The width to pretend the indented tree needs.
 * @returns {object} The instance and its plugin.
 */
function buildTree(minimumWidth: number) {
  const hot = new Handsontable(document.createElement('div'), {
    data: [
      { name: 'parent', __children: [{ name: 'child' }] },
    ],
    rowHeaders: true,
    nestedRows: true,
    licenseKey: 'non-commercial-and-evaluation',
  });
  const plugin = hot.getPlugin('nestedRows');

  // Set directly: the real value comes from measuring an indented header, which jsdom reports as
  // zero, and what is under test here is the arithmetic done with it.
  plugin.headersUI!.rowHeaderWidthCache = minimumWidth;

  return { hot, plugin };
}

describe('NestedRows modifyRowHeaderWidth', () => {
  it('should raise a single width to the room the indented header needs', () => {
    const { hot } = buildTree(145);

    expect(hot.runHooks('modifyRowHeaderWidth', 58)).toBe(145);

    hot.destroy();
  });

  it('should leave a single width alone when it is already wide enough', () => {
    const { hot } = buildTree(145);

    expect(hot.runHooks('modifyRowHeaderWidth', 200)).toBe(200);

    hot.destroy();
  });

  it('should raise only the level this plugin draws, and never produce NaN', () => {
    const { hot } = buildTree(145);

    const widths = hot.runHooks('modifyRowHeaderWidth', [58, 34]);

    // The cached minimum covers the indentation and the collapse button of THIS plugin's own
    // header. The levels after it come from `afterGetRowHeaderRenderers` and draw neither, so
    // raising them too would inflate a narrow numbering column for nothing.
    expect(widths).toEqual([145, 34]);
    expect(widths.some((width: number) => Number.isNaN(width))).toBe(false);

    hot.destroy();
  });

  it('should leave every level alone when the first one is already wide enough', () => {
    const { hot } = buildTree(40);

    expect(hot.runHooks('modifyRowHeaderWidth', [58, 34])).toEqual([58, 34]);

    hot.destroy();
  });
});
