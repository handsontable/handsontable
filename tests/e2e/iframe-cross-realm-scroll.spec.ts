import { test, expect } from '../fixtures/test';
import { IframeWidthWindowScrollPage } from '../fixtures/pages/IframeWidthWindowScrollPage';

/**
 * A grid whose DOM lives in an iframe, built by the PARENT page's `Handsontable`. Every node the
 * engine holds then comes from another realm, so `node instanceof HTMLElement` is false against the
 * constructor the engine's own code was compiled with — while `getTrimmingContainer()` keeps
 * resolving the owners correctly, because it takes its realm from `ownerDocument`. That split is the
 * hazard: the engine can know an element owns an axis and still lay the holder out as if the window
 * did. `walkontable/AGENTS.md` records the same trap for `alignOverlaysWithTrimmingContainer`.
 */
test.describe('cross-realm width-only grid: the engine must agree with itself about the owner', () => {
  let grid: IframeWidthWindowScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new IframeWidthWindowScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('sizes the holder from the iframe root that owns the horizontal axis', async () => {
    const owners = await grid.axisOwners();

    // The predicate half is realm-independent, so it is right either way — which is exactly what
    // makes the bug quiet: the layout half disagreed with it.
    expect(owners.horizontalByWindow).toBe(false);
    expect(owners.verticalByWindow).toBe(true);

    const holder = await grid.holderState();

    // The window mode writes `overflow: visible` on the holder. Reaching it here means an axis the
    // engine just called element-owned was laid out as window-owned.
    expect(holder.inlineOverflow).not.toBe('visible');
    expect(holder.computedOverflowX).not.toBe('visible');
    expect(holder.scrollWidth).toBeGreaterThan(holder.clientWidth);
  });

  test('scrolls the columns inside the holder instead of clipping them away', async () => {
    await grid.scrollHolderBy(400);

    const holder = await grid.holderState();

    // A holder left at `overflow: visible` cannot hold a scroll offset, so the columns past the
    // width are simply unreachable — the defect this branch exists to remove, one realm over.
    expect(holder.scrollLeft).toBeGreaterThan(0);
  });

  test('keeps the frozen rows aligned with the master while the holder scrolls', async () => {
    const before = await grid.renderedColumns();

    expect(before.master).toEqual(before.topClone);

    await grid.scrollHolderBy(400);

    const after = await grid.renderedColumns();

    expect(after.master[0]).toBeGreaterThan(before.master[0]);
    expect(after.master).toEqual(after.topClone);
  });

  // The clone alignment above survives a broken scroll READ, because the holder sync repairs it on
  // the next draw. The scroll hooks do not: they fire only from the per-frame direction flags, and
  // those are the difference between two reads off the axis owner. An owner the engine cannot
  // recognize reads 0 forever, so the axis looks motionless and the hook is never called.
  test('fires the scroll hooks for a holder the parent realm cannot recognize', async () => {
    expect((await grid.scrollHookCounts()).horizontal).toBe(0);

    await grid.scrollHolderBy(400);

    await expect.poll(async () => (await grid.scrollHookCounts()).horizontal).toBeGreaterThan(0);
  });
});
