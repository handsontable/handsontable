import { test, expect } from '../fixtures/test';
import {
  ScrollViewportToUnresolvedTargetPage,
  type UnresolvedScenario,
} from '../fixtures/pages/ScrollViewportToUnresolvedTargetPage';

/**
 * `scrollViewportTo(target, callback)` registers the callback on `afterScroll` before it resolves the target.
 * When the target cannot be resolved the method returns `false` and must do what it does for a target that
 * needs no scroll: drop the listener and run the callback once, in a microtask. Before the fix the listener
 * stayed registered, and the callback ran on the next scroll of any kind, unrelated to the call.
 */
const SCENARIOS: Array<{ scenario: UnresolvedScenario, title: string, target: { row?: number, col?: number } }> = [
  { scenario: 'row-out-of-range', title: 'a row index past the last row', target: { row: 1000 } },
  { scenario: 'column-out-of-range', title: 'a column index past the last column', target: { col: 500 } },
  { scenario: 'all-rows-hidden', title: 'every row hidden', target: { row: 5 } },
  { scenario: 'all-columns-hidden', title: 'every column hidden', target: { col: 5 } },
  { scenario: 'zero-rows', title: 'a grid with no rows', target: { row: 5 } },
  { scenario: 'all-rows-trimmed', title: 'every row trimmed', target: { row: 5 } },
];

test.describe('scrollViewportTo with a target that cannot be resolved', () => {
  for (const { scenario, title, target } of SCENARIOS) {
    test(`runs the callback once and leaves no listener for ${title}`, async({ page, theme, bundle }) => {
      const grid = new ScrollViewportToUnresolvedTargetPage(page, theme, bundle);

      await grid.goto();
      await grid.callWithUnresolvedTarget(scenario, target);

      // The call itself, read at once: nothing scrolled, nothing is left registered, and the callback has not
      // run yet, because it is deferred to a microtask.
      const right = await grid.readProbe();

      expect(right.returned).toBe(false);
      expect(right.leakedListeners).toBe(0);
      expect(right.callsWhenCallReturned).toBe(0);

      // The callback runs in a microtask, so it has run once by now and not again.
      await expect.poll(async() => (await grid.readProbe()).calls).toBe(1);

      // A scroll the call did not ask for must not run it a second time.
      await grid.restoreAndScrollUnrelated(scenario);

      expect((await grid.readProbe()).calls).toBe(1);
    });
  }

  test('runs the callback once for a row past the last row when hidden indexes are left out', async({
    page, theme, bundle,
  }) => {
    const grid = new ScrollViewportToUnresolvedTargetPage(page, theme, bundle);

    await grid.goto();
    await grid.callWithUnresolvedTarget('row-out-of-range', { row: 1000 }, 'options-without-hidden-indexes');

    const right = await grid.readProbe();

    expect(right.returned).toBe(false);
    expect(right.leakedListeners).toBe(0);
    expect(right.callsWhenCallReturned).toBe(0);
    await expect.poll(async() => (await grid.readProbe()).calls).toBe(1);

    await grid.restoreAndScrollUnrelated('row-out-of-range');

    expect((await grid.readProbe()).calls).toBe(1);
  });

  test('keeps running the callback once for a target that needs no scroll', async({ page, theme, bundle }) => {
    const grid = new ScrollViewportToUnresolvedTargetPage(page, theme, bundle);

    await grid.goto();
    await grid.callWithUnresolvedTarget('no-target', {});

    expect((await grid.readProbe()).leakedListeners).toBe(0);
    await expect.poll(async() => (await grid.readProbe()).calls).toBe(1);

    await grid.restoreAndScrollUnrelated('no-target');

    expect((await grid.readProbe()).calls).toBe(1);
  });

  test('keeps running the callback after the scroll for a target that resolves', async({ page, theme, bundle }) => {
    const grid = new ScrollViewportToUnresolvedTargetPage(page, theme, bundle);

    await grid.goto();
    await grid.callWithUnresolvedTarget('resolvable-target', { row: 100 });

    expect((await grid.readProbe()).returned).toBe(true);
    await expect.poll(async() => (await grid.readProbe()).calls).toBe(1);

    await grid.restoreAndScrollUnrelated('resolvable-target');

    expect((await grid.readProbe()).calls).toBe(1);
  });
});
