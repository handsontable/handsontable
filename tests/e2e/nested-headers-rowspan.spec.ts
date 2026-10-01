import { test, expect } from '../fixtures/test';
import { NestedHeadersRowspanPage } from '../fixtures/pages/NestedHeadersRowspanPage';

/**
 * How header cells that span header levels (`rowspan` in `nestedHeaders`) look and respond.
 *
 * Migrated from legacy Jasmine specs in `nestedHeaders/__tests__/rowspan.spec.js` that never ran:
 * an `it.skip` above them threw while the file loaded (DEV-3177). Once run, they failed on their
 * own mistakes, not on the grid — they measured the master copy of a header that the top overlay
 * paints over, and expected a left border no header has. These are the checks as they should
 * have been written.
 */
test.describe('nested headers with rowspan', () => {
  const { MENUS, SCROLL, ACTIVE_HEADER_CLASS } = NestedHeadersRowspanPage;
  // In the menus grid: "D/E" spans levels 1-2 over columns 3-4, "This is a very long header
  // title" spans levels 1-2 over column 0, and B2 and C2 sit on the bottom level.
  const DE: [number, number] = [1, 3];
  const LONG: [number, number] = [1, 0];
  const B2: [number, number] = [2, 1];
  const C2: [number, number] = [2, 2];

  let grid: NestedHeadersRowspanPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NestedHeadersRowspanPage(page, theme, bundle);
    await grid.goto();
  });

  test('keeps the controls of a rowspan header visible and clickable when it collapses', async() => {
    const collapse = grid.collapseButton(MENUS, ...DE);
    const dropdown = grid.dropdownButton(MENUS, ...DE);

    expect(await grid.controlVisibility(collapse)).toEqual({ hitAtCenter: true, insideHeader: true });
    expect(await grid.controlVisibility(dropdown)).toEqual({ hitAtCenter: true, insideHeader: true });

    await collapse.click();

    // The group collapsed to its first column, so the header is one column narrow now.
    await expect.poll(() => grid.collapsedColumns(MENUS)).toEqual([4]);
    expect(await grid.controlVisibility(collapse)).toEqual({ hitAtCenter: true, insideHeader: true });
    expect(await grid.controlVisibility(dropdown)).toEqual({ hitAtCenter: true, insideHeader: true });
  });

  test('aligns the labels of rowspan headers with the bottom header level', async() => {
    const [long, de, b2, c2] = await grid.labelBottoms(MENUS, [LONG, DE, B2, C2]);

    expect(Math.abs(long - b2)).toBeLessThan(1.5);
    expect(Math.abs(de - c2)).toBeLessThan(1.5);
  });

  test('highlights a rowspan header as active when it is clicked', async() => {
    const header = grid.header(MENUS, ...DE);

    await expect(header).not.toHaveClass(new RegExp(ACTIVE_HEADER_CLASS));

    await grid.label(MENUS, ...DE).click();

    await expect(header).toHaveClass(new RegExp(ACTIVE_HEADER_CLASS));
  });

  test('keeps the bottom border of a rowspan header at every scroll position', async() => {
    // "This is a very long header title" spans both levels of column 0; B2 is a bottom-level
    // header. The header owns the seam below it whether or not the body is scrolled (DEV-2786).
    const headers: Array<[number, number]> = [[0, 0], [1, 1]];
    const [rowspanTop, leafTop] = await grid.bottomBorderWidths(SCROLL, headers);

    expect(leafTop).toBeGreaterThan(0);
    expect(rowspanTop).toBe(leafTop);

    await grid.wheelBodyDown(SCROLL, 300);

    const [rowspanScrolled, leafScrolled] = await grid.bottomBorderWidths(SCROLL, headers);

    expect(rowspanScrolled).toBe(leafTop);
    expect(leafScrolled).toBe(leafTop);
  });
});
