import { test, expect } from '../fixtures/test';
import { UnlaidOutInitPage, type UnlaidOutMode } from '../fixtures/pages/UnlaidOutInitPage';

/**
 * Regression guard for a grid constructed into a container that is not in the
 * layout yet (DEV-2515).
 *
 * Such a container has no layout boxes, and `getComputedStyle()` returns an
 * empty declaration for it and for every ancestor. Walking that chain for an
 * overflow container therefore finds nothing and resolves to the window, so the
 * overlays bind to window scroll — and because the decision was taken once at
 * construction, they stayed bound for the instance's whole life: the column
 * headers and frozen columns did not move with the grid body, and virtualization
 * rendered the whole data set.
 *
 * The fix retakes the decision on the first draw that finds the table rendered.
 * The assertions describe the user-visible outcome (overlays aligned, rendered
 * band bounded), not the internal state, so they hold however it is retaken.
 *
 * `unslotted` is the shape the reporting customer hit (a Stencil component whose
 * `<slot>` renders a tick late). Chromium returns the empty declaration for an
 * unslotted element since 151 — Firefox and Safari always did — so on the
 * Chromium this suite pins, only the `detached` case can still reproduce the
 * failure. Both are kept: they enter through the same construction path, and the
 * customer's shape must be the one that is named.
 */
const MODES: UnlaidOutMode[] = ['detached', 'unslotted'];

test.describe('grid built into a container that has no layout yet', () => {
  for (const mode of MODES) {
    test(`keeps the column headers and frozen columns aligned once the ${mode} container is laid out`, async ({
      page, theme, bundle,
    }) => {
      const grid = new UnlaidOutInitPage(page, theme, bundle);

      await grid.goto();
      await grid.buildGrid(mode);

      // Proves the grid really was built outside the layout — without it the
      // scenario could degrade into "build a grid in a sized div" and still pass.
      expect(await grid.hadNoLayoutAtInit()).toBe(true);

      await grid.attach();
      await grid.scrollGrid(300, 300);

      // Before the fix both offsets equalled the full scroll distance (300px):
      // the clones never moved, because they were following the window instead.
      await grid.expectOverlaysAligned(300, 300);

      const alignment = await grid.readOverlayAlignment();

      // The container is 260px tall and rows are ~29px, so a viewport-sized band is
      // about 10 rows and stays under 25 even with overscan; window-scroll mode
      // rendered all 200. Anything looser tolerates a 2.5x over-render.
      expect(alignment.renderedRows).toBeLessThan(25);
      expect(alignment.renderedRows).toBeGreaterThan(0);
      expect(alignment.scrollsWithWindow).toBe(false);
    });

    test(`fills its container without any interaction once the ${mode} container is laid out`, async ({
      page, theme, bundle,
    }) => {
      const grid = new UnlaidOutInitPage(page, theme, bundle);

      await grid.goto();
      await grid.buildGrid(mode);

      expect(await grid.hadNoLayoutAtInit()).toBe(true);

      await grid.attach();

      // Deliberately no scroll, click, or any other interaction: the grid has to
      // be complete on its own. Row heights measured while the table had no
      // layout used to survive here, and each later draw only re-measured the
      // rows it rendered — so the grid filled short of its container and grew a
      // couple of rows every time the user touched it.
      // The last painted row reaches the container's bottom edge (negative means
      // it extends past it, which is what a full viewport band looks like).
      await grid.expectContainerFilled();

      const alignment = await grid.readOverlayAlignment();

      // Every row is at the default height, so the scroll range is the row count
      // times that height. The border allowance is added once, not once per row:
      // `rowCount * (rowHeight + 2)` left 400px of slack on 200 rows, and grew in
      // the same direction as the defect it guards, so a regression leaving every
      // row 1-2px too tall passed. Bounded below as well, because a range short of
      // the content clips the bottom rows.
      const rowHeight = alignment.defaultRowHeight;

      expect(rowHeight).not.toBeNull();
      expect(alignment.holderScrollRange).toBeLessThanOrEqual((alignment.rowCount + 1) * rowHeight! + 2);
      expect(alignment.holderScrollRange).toBeGreaterThanOrEqual(alignment.rowCount * rowHeight!);
    });

    test(`settles the correction pass for good once the ${mode} container is laid out`, async ({
      page, theme, bundle,
    }) => {
      const grid = new UnlaidOutInitPage(page, theme, bundle);

      await grid.goto();
      await grid.buildGrid(mode);

      expect(await grid.hadNoLayoutAtInit()).toBe(true);
      expect(await grid.readProvisionalLayout()).toBe(true);

      await grid.attach();
      await grid.expectContainerFilled();

      // The pass has to be a one-off. While it re-armed itself it re-bound every
      // overlay listener on every draw - so on every scroll frame, for the
      // instance's whole life - and dropped whichever scroll event was in flight.
      await expect.poll(async () => grid.readProvisionalLayout()).toBe(false);

      const states = await grid.drawAndReadState(5);

      expect(states.map(state => state.provisional)).toEqual([false, false, false, false, false]);

      // A pass still running would keep wiping the row heights, so the scroll
      // range would move from draw to draw instead of holding still.
      expect(new Set(states.map(state => state.holderScrollRange)).size).toBe(1);
    });
  }

  test('leaves a grid built into a laid-out container alone', async ({ page, theme, bundle }) => {
    const grid = new UnlaidOutInitPage(page, theme, bundle);

    await grid.goto();
    await grid.buildGrid('laid-out');

    // The control for the two cases above: nothing about this grid is provisional,
    // so the correction pass must not engage at all - not on the first draw, and
    // not on any later one.
    expect(await grid.hadNoLayoutAtInit()).toBe(false);
    expect(await grid.readProvisionalLayout()).toBe(false);

    const states = await grid.drawAndReadState(5);

    expect(states.map(state => state.provisional)).toEqual([false, false, false, false, false]);

    await grid.expectContainerFilled();
    await grid.scrollGrid(300, 300);
    await grid.expectOverlaysAligned(300, 300);
  });

  test('restores the row heights of a grid that has frozen rows', async ({ page, theme, bundle }) => {
    const grid = new UnlaidOutInitPage(page, theme, bundle);

    await grid.goto();
    await grid.useFrozenRows();
    await grid.buildGrid('detached');

    expect(await grid.hadNoLayoutAtInit()).toBe(true);

    await grid.attach();

    // Frozen rows keep their height records apart from the ordinary ones, and the
    // correction pass clears both. A master draw cannot recreate a frozen-derived
    // height, so clearing them without a re-measure would leave the grid short.
    await expect.poll(async () => grid.readProvisionalLayout()).toBe(false);

    const alignment = await grid.readOverlayAlignment();
    const rowHeight = alignment.defaultRowHeight;

    expect(rowHeight).not.toBeNull();

    // `expectContainerFilled` does not apply here: the bottom overlay covers the
    // last two rows, so the master band stops behind it rather than at the
    // container's edge. It still may not stop short of it by more than that.
    expect(alignment.deadSpaceBelowLastRow).toBeLessThanOrEqual(2 * rowHeight! + 2);
    expect(alignment.deadSpaceBelowLastRow).toBeGreaterThanOrEqual(0);

    // Records that were wiped and never taken again, or kept from the unlaid-out
    // measurement, both show up here. The allowance covers the four frozen rows,
    // whose bands add to the holder's range on top of the 200 data rows - measured
    // at 5871px against 5830px of rows. Still far under the pre-fix inflation, which
    // was more than double the content.
    const frozenRows = 4;

    expect(alignment.holderScrollRange)
      .toBeLessThanOrEqual((alignment.rowCount + frozenRows) * rowHeight! + 2);
    expect(alignment.holderScrollRange).toBeGreaterThanOrEqual(alignment.rowCount * rowHeight!);
    expect(alignment.renderedRows).toBeLessThan(25);

    await grid.scrollGrid(300, 300);
    await grid.expectOverlaysAligned(300, 300);
  });
});
