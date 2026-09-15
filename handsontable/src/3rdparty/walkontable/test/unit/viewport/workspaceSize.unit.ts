import { toTotalRowHeaderWidth } from 'walkontable/viewport/workspaceSize';

/**
 * `modifyRowHeaderWidth` may answer with one number or with one width per row header level, and the
 * viewport needs the width of the whole header block either way.
 *
 * The array has to be read exactly the way `ColumnUtils#calculateWidths` reads it, because that is
 * the other consumer of the same value and it is what sizes the `col` elements. Any disagreement
 * between the two leaves the viewport and the overlays working from different totals for the same
 * header, which is the misalignment this whole hook shape exists to avoid.
 */
describe('toTotalRowHeaderWidth', () => {
  const DEFAULT_WIDTH = 50;

  it('should pass a single number through', () => {
    expect(toTotalRowHeaderWidth(120, 1, DEFAULT_WIDTH)).toBe(120);
    expect(toTotalRowHeaderWidth(120, 3, DEFAULT_WIDTH)).toBe(120);
  });

  it('should add the levels of an array up', () => {
    expect(toTotalRowHeaderWidth([60, 80], 2, DEFAULT_WIDTH)).toBe(140);
  });

  it('should count only the levels the draw renders', () => {
    // A handler that answers for more levels than are drawn must not inflate the block by the
    // surplus - `ColumnUtils` never reads past the rendered count either.
    expect(toTotalRowHeaderWidth([60, 80, 200], 2, DEFAULT_WIDTH)).toBe(140);
  });

  it('should fall back to the default width for a level the answer does not cover', () => {
    // Short array, and a hole in the middle: both are the same case, and `ColumnUtils` substitutes
    // the default column width for each. Summing the array as given would under-report by 50 here.
    expect(toTotalRowHeaderWidth([60], 2, DEFAULT_WIDTH)).toBe(110);
    expect(toTotalRowHeaderWidth([60, null], 2, DEFAULT_WIDTH)).toBe(110);
    expect(toTotalRowHeaderWidth([60, undefined], 2, DEFAULT_WIDTH)).toBe(110);
  });

  it('should report nothing usable as null, so the caller keeps its own width', () => {
    expect(toTotalRowHeaderWidth(0, 1, DEFAULT_WIDTH)).toBe(null);
    expect(toTotalRowHeaderWidth(NaN, 1, DEFAULT_WIDTH)).toBe(null);
    expect(toTotalRowHeaderWidth(undefined, 1, DEFAULT_WIDTH)).toBe(null);
    // No levels drawn: an array cannot add up to anything.
    expect(toTotalRowHeaderWidth([60, 80], 0, DEFAULT_WIDTH)).toBe(null);
  });
});
