import { test, expect, THEMES_TAG } from '../fixtures/test';
import { PerAxisScrollbarPage } from '../fixtures/pages/PerAxisScrollbarPage';

/**
 * The fully-visible range follows the master holder's own scrollbars, per axis.
 *
 * Walkontable used to reserve one probe thickness (`getScrollbarWidth()`, a throw-away div on
 * `document.body`) for both axes. The probe is not the holder. A global `::-webkit-scrollbar` rule
 * sizes the probe, while the theme's `scrollbar-color` makes Chrome 121+ ignore that rule on
 * `.wtHolder`, so the range comes up short and a click inside it scrolls. The same rule on the
 * holder alone does the opposite: the probe stays classic and a column behind the vertical bar is
 * reported fully visible.
 *
 * Chromium only. Firefox and WebKit are not in this file's projects: the engines job runs
 * `@cross-browser` specs, and `::-webkit-scrollbar` is not that test. `.skip` is banned, so the
 * absence of the tag is the skip.
 *
 * Playwright's headless Chromium starts with `--hide-scrollbars`, which forces every gutter to 0
 * and makes both disagreements impossible. This file drops that flag.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

test.describe('per-axis holder scrollbar thickness', { tag: THEMES_TAG }, () => {
  for (const sizing of ['measured', 'predicted'] as const) {
    test(`global webkit scrollbar does not shrink the visible range (${sizing})`, async({ page, theme, bundle }) => {
      const grid = new PerAxisScrollbarPage(page, theme, bundle);

      await grid.installScrollbarRule('global');
      await grid.goto();
      await grid.initScrollingGrid(sizing);

      expect(await grid.usesLayoutSnapshotForCalculators()).toBe(sizing === 'predicted');

      const edges = await grid.fullyVisibleCellEdges();
      const holder = await grid.holderScrollbarGutters();
      const probe = await grid.probeGutters();

      // The rule took effect on the probe and not on the holder. Without this the assertions below
      // pass on a machine where both gutters are 0.
      expect(holder.vertical).toBeGreaterThan(0);
      expect(holder.horizontal).toBe(holder.vertical);
      expect(probe.vertical).toBeGreaterThan(holder.vertical);
      expect(edges.lastRow).toBeGreaterThan(0);
      expect(edges.lastCol).toBeGreaterThan(0);

      expect(await grid.lastFullyVisibleRow()).toBe(edges.lastRow);
      expect(await grid.lastFullyVisibleColumn()).toBe(edges.lastCol);

      await grid.cell(edges.lastRow, 0).click();
      expect(await grid.verticalScrollOffset()).toBe(0);

      await page.keyboard.press('ArrowDown');
      await expect.poll(() => grid.verticalScrollOffset()).toBeGreaterThan(0);
    });

    test(`holder webkit scrollbar hides the column it covers (${sizing})`, async({ page, theme, bundle }) => {
      const grid = new PerAxisScrollbarPage(page, theme, bundle);

      await grid.installScrollbarRule('holder');
      await grid.goto();
      await grid.initScrollingGrid(sizing);

      expect(await grid.usesLayoutSnapshotForCalculators()).toBe(sizing === 'predicted');

      const edges = await grid.fullyVisibleCellEdges();
      const holder = await grid.holderScrollbarGutters();
      const probe = await grid.probeGutters();

      expect(holder.vertical).toBeGreaterThan(probe.vertical);
      expect(holder.horizontal).toBeGreaterThan(0);
      expect(holder.horizontal).toBeLessThan(holder.vertical);
      expect(edges.lastRow).toBeGreaterThan(0);
      expect(edges.lastCol).toBeGreaterThan(0);

      expect(await grid.lastFullyVisibleRow()).toBe(edges.lastRow);
      expect(await grid.lastFullyVisibleColumn()).toBe(edges.lastCol);

      await grid.cell(0, edges.lastCol).click();
      expect(await grid.horizontalScrollOffset()).toBe(0);

      await page.keyboard.press('ArrowRight');
      await expect.poll(() => grid.horizontalScrollOffset()).toBeGreaterThan(0);
    });
  }

  test('default scrollbars do not rebuild the visible calculators', async({ page, theme, bundle }) => {
    const grid = new PerAxisScrollbarPage(page, theme, bundle);

    await grid.goto();
    await grid.initScrollingGrid('predicted');

    expect(await grid.usesLayoutSnapshotForCalculators()).toBe(true);

    const holder = await grid.holderScrollbarGutters();
    const probe = await grid.probeGutters();

    // The sync rebuilds only when these differ. Equal gutters make a positive count the equality
    // return being gone.
    expect(holder.vertical).toBeGreaterThan(0);
    expect(holder.vertical).toBe(probe.vertical);
    expect(holder.horizontal).toBe(probe.horizontal);

    expect(await grid.countVisibleCalculatorBuilds(3)).toBe(0);
  });
});
