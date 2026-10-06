import { test, expect } from '../fixtures/test';
import { FixedColumnsEndReview4Page } from '../fixtures/pages/FixedColumnsEndReview4Page';

/**
 * Review 4 follow-ups for `fixedColumnsEnd`:
 *
 * - a collapsible group keeps the same toggle answer whether it is collapsed or expanded,
 * - the overlay clones the grid had before the end ones keep their places in the DOM,
 * - the lookup of the overlay that holds a header cell still finds the owner, and is cheaper than walking all of
 *   them.
 *
 * Every case runs in LTR and RTL, and in every theme and bundle leg (the projects).
 */
for (const rtl of [false, true]) {
  const direction = rtl ? 'RTL' : 'LTR';

  test.describe(`fixedColumnsEnd collapsible group toggle (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview4Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview4Page(page, theme, bundle);
    });

    test('gives a group that reaches the band no toggle, expanded or collapsed through the API', async () => {
      // 12 columns, the band holds the columns 10 and 11, the group G spans 8 to 10.
      await grid.goto({ scenario: 'collapse', rtl, fixedColumnsEnd: 2 });

      const expanded = await grid.groupsWithToggle();

      await grid.collapseGroup(8);
      await expect.poll(() => grid.groupsWithToggle()).toEqual(expanded);

      await grid.expandGroup(8);
      await expect.poll(() => grid.groupsWithToggle()).toEqual(expanded);

      // The group B (4 to 7) is clear of the band and keeps its toggle; G never gets one, so a collapsed G can
      // not be left without a way back that only shows up while it is expanded.
      expect(expanded).toEqual(['A', 'B']);
    });

    test('keeps the toggle of a group that is clear of the band, expanded or collapsed', async () => {
      // The control of the case above: with one end column the band is the column 11 only, so G (8 to 10) is clear.
      await grid.goto({ scenario: 'collapse', rtl, fixedColumnsEnd: 1 });

      await expect.poll(() => grid.groupsWithToggle()).toEqual(['A', 'B', 'G']);

      await grid.collapseGroup(8);
      await expect.poll(() => grid.groupsWithToggle()).toEqual(['A', 'B', 'G']);
    });
  });

  test.describe(`fixedColumnsEnd overlay clones in the DOM (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview4Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview4Page(page, theme, bundle);
    });

    test('adds the end clones after the start ones, so the first five keep their places', async () => {
      await grid.goto({ scenario: 'order', rtl });

      const order = await grid.cloneOrder();

      // The master, then the five clones every grid had before `fixedColumnsEnd`, then the three end clones.
      expect(order).toHaveLength(9);
      expect(order[0]).toBe('ht_master');
      expect(order.slice(1, 6)).toEqual([
        'ht_clone_top',
        'ht_clone_bottom',
        'ht_clone_inline_start',
        'ht_clone_top_inline_start_corner',
        'ht_clone_bottom_inline_start_corner',
      ]);
      expect(order.slice(6)).toEqual([
        'ht_clone_inline_end',
        'ht_clone_top_inline_end_corner',
        'ht_clone_bottom_inline_end_corner',
      ]);
    });

    test('keeps the list of the overlays in the order of the clones in the DOM', async () => {
      await grid.goto({ scenario: 'order', rtl });

      const order = await grid.cloneOrder();

      expect(await grid.overlayTableNames()).toEqual(order.slice(1));
    });
  });

  test.describe(`fixedColumnsEnd header cell lookup (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview4Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview4Page(page, theme, bundle);
    });

    test('resolves every header cell to the clone that renders it, in every frozen area', async () => {
      await grid.goto({ scenario: 'order', rtl, fixedColumnsStart: 1, fixedColumnsEnd: 2 });

      const owners = await grid.headerOwners();
      const clones = new Set(owners.map(owner => owner.cloneClass));

      // The headers sit in the top clone and in the four corners that exist for the settings above.
      expect(clones.has('ht_clone_top')).toBe(true);
      expect(clones.has('ht_clone_top_inline_end_corner')).toBe(true);
      expect(clones.has('ht_clone_top_inline_start_corner')).toBe(true);

      owners.forEach((owner) => {
        expect(owner.overlayName).toBe(owner.cloneClass.replace('ht_clone_', ''));
      });
    });

    test('resolves the header cells of a grid with no end columns, where the end clones are idle', async () => {
      await grid.goto({ scenario: 'perf', rtl });

      const owners = await grid.headerOwners();

      expect(owners.length).toBeGreaterThan(0);
      owners.forEach((owner) => {
        expect(owner.overlayName).toBe(owner.cloneClass.replace('ht_clone_', ''));
      });
    });

    test('answers like the full walk of every overlay and costs less, with the end option at 0', async ({}, testInfo) => {
      await grid.goto({ scenario: 'perf', rtl });

      const timing = await grid.timeLookup(400);

      testInfo.annotations.push({
        type: 'lookup-timing',
        description: `${timing.cells} cells x 400: previous ${timing.previousMs.toFixed(1)} ms, ` +
          `current ${timing.currentMs.toFixed(1)} ms`,
      });

      expect(timing.cells).toBeGreaterThan(100);
      expect(timing.mismatches).toBe(0);
      // Measured about three times cheaper; the margin leaves room for a noisy runner.
      expect(timing.currentMs).toBeLessThan(timing.previousMs * 0.8);
    });
  });
}
