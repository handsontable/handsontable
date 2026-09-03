import { test, expect } from '../fixtures/test';
import { HiddenInitRerenderPage, type HiddenScenario } from '../fixtures/pages/HiddenInitRerenderPage';

/**
 * Migrated from the frozen Jasmine specs (DEV-2745, flake ledger of DEV-2668): the four `Core_init`
 * "rerender after `display` changes from `none`" variants and the `observeVisibilityChangeOnce`
 * DOM-helper group. Their `waitForNextAnimationFrames(2)` (~32 ms) raced IntersectionObserver
 * delivery, which is not frame-bound; this spec polls the observable effect instead - the
 * visibility-triggered rerender for the grid, the callback counters for the helper.
 */
const SCENARIOS: { hidden: HiddenScenario; label: string }[] = [
  { hidden: 'inline-root', label: 'the root element was hidden with an inline style' },
  { hidden: 'inline-parent', label: 'the parent was hidden with an inline style' },
  { hidden: 'stylesheet-root', label: 'the root element was hidden by a stylesheet rule' },
  { hidden: 'stylesheet-parent', label: 'the parent was hidden by a stylesheet rule' },
];

test.describe('a grid initialized inside a hidden container rerenders on reveal', () => {
  for (const scenario of SCENARIOS) {
    test(`when ${scenario.label}`, async({ page, theme, bundle }) => {
      const grid = new HiddenInitRerenderPage(page, theme, bundle, scenario.hidden);

      await grid.goto();

      // The premise: the grid really did initialize while invisible. Without this the scenario
      // silently degrades into a plain visible init and the test proves nothing.
      expect(await grid.isGridHidden()).toBe(true);

      await grid.reveal();

      // The visibility-triggered rerender is what gives the top clone a layout box - poll it
      // instead of guessing how long IntersectionObserver delivery takes.
      await expect.poll(() => grid.topHolderHeight()).toBeGreaterThan(0);
      await expect(grid.cell(0, 0)).toBeVisible();

      const geometry = await grid.revealGeometry();

      // The rerender must have MEASURED, not just painted: the top holder covers its header row,
      // the stretched header widths agree with the first data row's, and the holder spans the
      // cloned table - the exact three repairs the legacy spec pinned.
      expect(geometry.topHolderHeight).toBeGreaterThanOrEqual(geometry.topHeaderHeight);
      expect(geometry.headerWidths).toEqual(geometry.firstRowCellWidths);
      expect(geometry.topHolderWidth).toBe(geometry.topCoreWidth);
      // And the stretch really happened - 15 columns at the 50 px unstretched default would leave
      // every width at 50; a stretched grid spreads the container remainder across them, so on
      // the projects' 1280 px viewport every column must have grown past the default.
      expect(geometry.headerWidths).toHaveLength(15);
      expect(Math.min(...geometry.firstRowCellWidths)).toBeGreaterThan(50);
    });
  }
});

test.describe('the observeVisibilityChangeOnce helper behind the mechanism', () => {
  test('fires exactly once when the element becomes visible, despite same-frame flickers',
    async({ page, theme, bundle }) => {
      const grid = new HiddenInitRerenderPage(page, theme, bundle);

      await grid.goto();
      await grid.startVisibilityProbe({ count: 1, flickers: 1 });

      await expect.poll(async() => (await grid.visibilityProbe()).calls[0]).toBeGreaterThanOrEqual(1);

      // Bounded settle for the once-ness; the poll above is the positive control.
      await grid.afterAnimationFrames(3);

      expect((await grid.visibilityProbe()).calls).toEqual([1]);
    });

  test('disconnects the observer after the first delivery instead of unobserving',
    async({ page, theme, bundle }) => {
      const grid = new HiddenInitRerenderPage(page, theme, bundle);

      await grid.goto();
      await grid.startVisibilityProbe({ count: 1 });

      await expect.poll(async() => (await grid.visibilityProbe()).calls[0]).toBe(1);

      const probe = await grid.visibilityProbe();

      expect(probe.disconnects).toBe(1);
      expect(probe.unobserves).toBe(0);
      expect(probe.activeObservers).toBe(0);
    });

  test('does not leak observers when the document body has zero height', async({ page, theme, bundle }) => {
    const grid = new HiddenInitRerenderPage(page, theme, bundle);

    await grid.goto();
    await grid.startVisibilityProbe({ count: 5, zeroHeightBody: true });

    await expect.poll(async() => (await grid.visibilityProbe()).calls).toEqual([1, 1, 1, 1, 1]);

    expect((await grid.visibilityProbe()).activeObservers).toBe(0);
  });
});
