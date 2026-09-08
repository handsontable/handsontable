import { test, expect } from '../fixtures/test';
import { DropdownEditorClipPage, type PlacementBoxes } from '../fixtures/pages/DropdownEditorClipPage';

/**
 * Asserts the list sits against one of the edited cell's horizontal edges - directly below it, or
 * directly above it when flipped.
 *
 * Which of the two a given grid picks is theme-dependent, because each theme's row height decides
 * how tall the list is and therefore whether it fits below the cell (`tests/AGENTS.md`). Asserting
 * "the top is at the cell's bottom" makes a spec pass on `main` and fail on `horizon` for a reason
 * that has nothing to do with the behavior under test.
 */
function expectAnchoredToCell({ list, cell }: PlacementBoxes): void {
  const below = Math.abs(list.top - cell.bottom) <= 1;
  const above = Math.abs(list.bottom - cell.top) <= 1;

  expect(below || above,
    `the list should touch the cell: list ${list.top}..${list.bottom}, cell ${cell.top}..${cell.bottom}`)
    .toBe(true);
}

/**
 * #8688: the dropdown editors' option lists were cut off by the grid root's `overflow: clip`
 * (written for any sized `height`) or by a scrolling ancestor, and trimmed to the rows that fit
 * the space left inside the grid - as few as two of eight choices on a short grid. The lists are
 * now positioned `fixed`, so the box they are laid out in bounds them instead.
 *
 * Every case counts options with `elementFromPoint()` rather than `toHaveCount()` or
 * `toBeVisible()`: under a clip an option exists at full size while nothing on screen can reach
 * it, so both of those pass on the broken build.
 *
 * The box a `fixed` list is laid out in is the viewport only while no ancestor establishes a
 * containing block for it, which is why the `modal` and `contained` cases exist - a `transform`
 * or a `contain: paint` on any host-page ancestor moves the origin, and reading coordinates
 * straight off the viewport put the list 313px below and 384px across from its cell.
 */
test.describe('dropdown editor list escapes the grid clip (#8688)', () => {
  let grid: DropdownEditorClipPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownEditorClipPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('the list is no longer bounded by the grid', () => {
    test('shows every option on a `height: "auto"` grid shorter than the list (the reported shape)',
      async () => {
        await grid.rebuild({ height: 'auto' });
        await grid.openEditor(2, 1);

        const { list, cell, root } = await grid.boxes();

        expect(await grid.reachableOptions()).toBe(await grid.optionCount());
        expect(list.top).toBeCloseTo(cell.bottom, 0);
        // The point of the fix: the list is taller than the grid and hangs below it.
        expect(list.bottom).toBeGreaterThan(root.bottom);
      });

    test('shows every option on a grid with a fixed `height` that clips its root', async ({ page }) => {
      await grid.rebuild({ height: 150 });

      const overflowY = await page.evaluate(() => getComputedStyle(window.hot.rootElement).overflowY);

      expect(overflowY).toBe('clip');

      await grid.openEditor(2, 1);

      const { list, cell, root } = await grid.boxes();

      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
      expect(list.top).toBeCloseTo(cell.bottom, 0);
      expect(list.bottom).toBeGreaterThan(root.bottom);
    });

    test('shows every option on a grid inside a scrolling parent', async () => {
      await grid.rebuild({ height: 'auto', rows: 12 }, 'bounded');

      const row = await grid.page.evaluate(() => window.hot.getLastFullyVisibleRow());

      await grid.openEditor(row, 1);

      const { list, cell, container } = await grid.boxes();

      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
      expect(list.top).toBeCloseTo(cell.bottom, 0);
      expect(list.bottom).toBeGreaterThan(container.bottom);
    });

    test('shows every option of a `multiselect` editor', async () => {
      await grid.rebuild({ height: 150, editorType: 'multiselect' });
      await grid.openEditor(2, 1);

      const { list, cell, root } = await grid.boxes();

      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
      expect(list.top).toBeGreaterThanOrEqual(cell.bottom - 1);
      expect(list.bottom).toBeGreaterThan(root.bottom);
    });
  });

  test.describe('an ancestor that is the containing block for a fixed box', () => {
    for (const layout of ['modal', 'contained'] as const) {
      test(`places the list on its cell inside a \`${layout}\` ancestor`, async () => {
        await grid.rebuild({ height: 150 }, layout);
        await grid.openEditor(2, 1);

        const { list, cell, container } = await grid.boxes();

        // Without the containing-block correction the list lands hundreds of pixels away,
        // wherever the ancestor happens to sit in the viewport.
        expect(list.top).toBeCloseTo(cell.bottom, 0);
        expect(list.left).toBeCloseTo(cell.left - 1, 0);
        expect(await grid.reachableOptions()).toBe(await grid.optionCount());
        // CSS gives a fixed box no way out of such an ancestor, so the list has to fit inside it.
        expect(list.bottom).toBeLessThanOrEqual(container.bottom + 1);
      });
    }
  });

  test.describe('following the cell', () => {
    test('stays on the cell when the page scrolls', async () => {
      // Room above the grid, so the scroll below moves the cell without taking it off screen -
      // otherwise the list correctly clamps to the viewport's top edge and this would measure
      // the clamp rather than the follow.
      await grid.rebuild({ height: 150 }, 'pushed-down');
      await grid.openEditor(2, 1);

      const before = await grid.boxes();

      expectAnchoredToCell(before);

      await grid.scrollWindowBy(120);

      const after = await grid.boxes();

      // The cell moved with the page, and the list moved with it. Asserted as "still touching the
      // cell" rather than "the same gap as before", because the flip is re-decided on every
      // scroll, and which side the list takes is theme-dependent to begin with.
      expect(after.cell.bottom).toBeCloseTo(before.cell.bottom - 120, 0);
      expectAnchoredToCell(after);
      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
    });

    test('re-decides the flip on scroll instead of riding off the viewport', async () => {
      // Park the grid low enough that the list must flip upwards to fit.
      await grid.rebuild({ height: 150 }, 'at-viewport-bottom');
      await grid.openEditor(0, 1);

      expect(await grid.isFlippedVertically()).toBe(true);

      const flipped = await grid.boxes();

      expect(flipped.list.bottom).toBeLessThanOrEqual(flipped.cell.top + 1);

      // Scrolling the page down lifts the cell, which would push a flipped list off the top edge
      // if the flip were merely re-applied rather than re-decided. A `fixed` box adds no
      // scrollable overflow, so options above the edge would be unreachable with no scrollbar.
      await grid.scrollWindowBy(600);

      const { list } = await grid.boxes();

      expect(list.top).toBeGreaterThanOrEqual(0);
      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
    });
  });
});
