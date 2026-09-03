import { test, expect } from '../fixtures/test';
import { RefreshDimensionsPage, type HookLogEntry } from '../fixtures/pages/RefreshDimensionsPage';

const entry = (
  hook: 'before' | 'after',
  prev: { width: number; height: number },
  curr: { width: number; height: number },
  action: boolean,
): HookLogEntry => ({ hook, prev, curr, action });

/**
 * Migrated from the frozen Jasmine specs `{before,after}RefreshDimensions.spec.js` (DEV-2744,
 * flake ledger of DEV-2668). Their fixed `sleep(50)` waits raced two pipelines that this spec
 * polls instead: the ResizeObserver of a sized grid (which also delivers ONCE on observe - the
 * call the legacy synchronous asserts were actually counting), and the window-resize path of a
 * grid whose document is an iframe's.
 *
 * `before` and `after` are asserted together through one interleaved log, which also pins their
 * ORDER - something the legacy per-hook files never could. The dvh loop-guard spec followed once
 * DEV-2740 made the guard trip on delivery cycles instead of wall-clock gaps - see the block at the
 * bottom of this file.
 */
test.describe('a sized grid in the main document (ResizeObserver pipeline)', () => {
  test('reports its dimensions once on the observer\'s initial delivery', async({ page, theme, bundle }) => {
    const grid = new RefreshDimensionsPage(page, theme, bundle);

    await grid.goto();
    await grid.buildMainGrid();

    // The observer always reports once on `observe()`. Nothing changed yet, so both hooks see
    // equal dimensions and no possible action - and exactly one delivery, in before-after order.
    await expect.poll(() => grid.hookLogLength()).toBe(2);

    expect(await grid.hookLog()).toEqual([
      entry('before', { width: 120, height: 100 }, { width: 120, height: 100 }, false),
      entry('after', { width: 120, height: 100 }, { width: 120, height: 100 }, false),
    ]);
  });

  test('fires with previous and current dimensions when the root element is resized',
    async({ page, theme, bundle }) => {
      const grid = new RefreshDimensionsPage(page, theme, bundle);

      await grid.goto();
      await grid.buildMainGrid();

      await expect.poll(() => grid.hookLogLength()).toBe(2);
      await grid.clearHookLog();

      // The resize never fires the hooks synchronously - delivery is deferred to a later frame.
      // This is the legacy rAF-sync contract, read in the same task as the mutation.
      expect(await grid.resizeRoot(200)).toBe(0);

      await expect.poll(() => grid.hookLogLength()).toBe(2);

      expect(await grid.hookLog()).toEqual([
        entry('before', { width: 120, height: 100 }, { width: 200, height: 100 }, true),
        entry('after', { width: 120, height: 100 }, { width: 200, height: 100 }, true),
      ]);

      // The refresh must also have ACTED: the scroll holder followed the root to the new width.
      await expect.poll(() => grid.mainHolderWidth()).toBe(200);
    });

  test('returning false from beforeRefreshDimensions blocks the refresh', async({ page, theme, bundle }) => {
    const grid = new RefreshDimensionsPage(page, theme, bundle);

    await grid.goto();
    await grid.buildMainGrid({ blockRefresh: true });

    // The initial delivery is blocked too: `before` fires, `after` never does.
    await expect.poll(() => grid.hookLogLength()).toBe(1);
    await grid.clearHookLog();

    const holderWidthBefore = await grid.mainHolderWidth();

    await grid.resizeRoot(200);

    await expect.poll(() => grid.hookLogLength()).toBe(1);

    expect(await grid.hookLog()).toEqual([
      entry('before', { width: 120, height: 100 }, { width: 200, height: 100 }, true),
    ]);

    // Bounded settle for the negative half; the `before` entry above is the positive control that
    // proves the pipeline delivered.
    await grid.afterAnimationFrames(3);

    expect(await grid.hookLogLength()).toBe(1);
    // The block must reach the view: the holder ignores the new root width.
    expect(await grid.mainHolderWidth()).toBe(holderWidthBefore);
  });

  test('stays quiet while the root element or the document body is hidden', async({ page, theme, bundle }) => {
    const grid = new RefreshDimensionsPage(page, theme, bundle);

    await grid.goto();
    await grid.buildMainGrid();

    await expect.poll(() => grid.hookLogLength()).toBe(2);
    await grid.clearHookLog();

    // Hidden root: the observer still delivers (a zero-size box), but the refresh must skip.
    await grid.setRootDisplay('none');
    await grid.resizeRoot(200);
    await grid.afterAnimationFrames(3);

    expect(await grid.hookLogLength()).toBe(0);

    // Positive control: unhiding delivers the size the root grew to while hidden. Polled on the
    // last COMPLETED refresh (the latest `after` entry), because the observer stays attached and
    // may deliver again between a length poll and a separate read of the log.
    await grid.setRootDisplay('');
    await expect.poll(() => grid.lastEntry('after')).toEqual(
      entry('after', { width: 120, height: 100 }, { width: 200, height: 100 }, true),
    );

    await grid.clearHookLog();

    // Hidden ancestor: same guard, reached through the body.
    await grid.setBodyDisplay('none');
    await grid.resizeRoot(240);
    await grid.afterAnimationFrames(3);

    expect(await grid.hookLogLength()).toBe(0);

    await grid.setBodyDisplay('');
    await expect.poll(() => grid.lastEntry('after')).toEqual(
      entry('after', { width: 200, height: 100 }, { width: 240, height: 100 }, true),
    );
  });
});

test.describe('a grid inside an iframe (window-resize pipeline)', () => {
  test('fires when the iframe window shrinks, reporting the measured viewport', async({ page, theme, bundle }) => {
    const grid = new RefreshDimensionsPage(page, theme, bundle);

    await grid.goto();
    // 20 columns against a 500 px viewport: the refresh's render effect is now visible as a
    // change in how many columns render (the positive control for the blocked case below).
    await grid.buildIframeGrid({ columns: 20 });
    await grid.clearHookLog();

    const renderedBefore = await grid.iframeRenderedColumnCount();

    await grid.setIframeWidth(50);

    await expect.poll(() => grid.hookLogLength()).toBe(2);
    await expect.poll(() => grid.iframeRenderedColumnCount()).toBeLessThan(renderedBefore);

    const log = await grid.hookLog();
    const measured = await grid.measuredIframe();

    // Both hooks see the same payload, before first. The current dimensions are not a literal:
    // they must equal what the iframe actually measures NOW - the post-scrollbar viewport width
    // and the grid root's own rendered height (the legacy spec pinned a theme-dependent constant
    // here, which is why it could not run theme-agnostically).
    expect(log.map(item => item.hook)).toEqual(['before', 'after']);
    expect(log[0]).toEqual({ ...log[1], hook: 'before' });
    expect(log[0].prev).toEqual({ width: 500, height: 0 });
    expect(log[0].action).toBe(true);
    expect(log[0].curr.width).toBe(measured.viewportWidth);
    expect(log[0].curr.width).toBeLessThan(500);
    expect(log[0].curr.height).toBe(measured.rootHeight);
    expect(log[0].curr.height).toBeGreaterThan(0);
  });

  test('returning false from beforeRefreshDimensions blocks the window-resize refresh',
    async({ page, theme, bundle }) => {
      const grid = new RefreshDimensionsPage(page, theme, bundle);

      await grid.goto();
      await grid.buildIframeGrid({ columns: 20, blockRefresh: true });
      await grid.clearHookLog();

      const renderedBefore = await grid.iframeRenderedColumnCount();

      await grid.setIframeWidth(50);

      // The window pipeline reaches the same gate: `before` reports the shrunken viewport it was
      // about to adopt, and nothing follows.
      await expect.poll(() => grid.lastEntry('before')).not.toBeNull();

      const before = (await grid.lastEntry('before'))!;
      const measured = await grid.measuredIframe();

      expect(before.prev).toEqual({ width: 500, height: 0 });
      expect(before.action).toBe(true);
      expect(before.curr.width).toBe(measured.viewportWidth);

      // Bounded settle for the negative half; the `before` entry above is the positive control.
      await grid.afterAnimationFrames(3);

      expect(await grid.hookLog()).toHaveLength(1);
      // The block reached the view: the column count is still the one the 500 px viewport chose.
      expect(await grid.iframeRenderedColumnCount()).toBe(renderedBefore);
    });

  test('reports unchanged dimensions with no possible action when the grid size is pinned',
    async({ page, theme, bundle }) => {
      const grid = new RefreshDimensionsPage(page, theme, bundle);

      await grid.goto();
      await grid.buildIframeGrid({ width: 300, height: 300 });

      // A pinned grid is overlay-scrolled, so it also gets the observer's initial delivery.
      await expect.poll(() => grid.hookLogLength()).toBe(2);
      await grid.clearHookLog();

      await grid.setIframeWidth(50);

      // The window resized, the grid did not: the hooks still fire, reporting no possible action.
      // Polled on the latest entry of each hook rather than read as a whole log, for the same
      // reason as the hidden-root case - one shape for every multi-delivery-capable trigger.
      await expect.poll(() => grid.lastEntry('after')).toEqual(
        entry('after', { width: 300, height: 300 }, { width: 300, height: 300 }, false),
      );
      expect(await grid.lastEntry('before')).toEqual(
        entry('before', { width: 300, height: 300 }, { width: 300, height: 300 }, false),
      );
    });
});

test.describe('the endless-loop guard (a parent sized in dynamic units)', () => {
  const WARNING_FRAGMENT = 'fired too many times in direct succession';
  const WARNING = 'The ResizeObserver callback was fired too many times in direct succession.\n' +
    'This may be due to an infinite loop caused by setting a dynamic height/width (for example, ' +
    'with the `dvh` units) to a Handsontable container\'s parent. \n' +
    'The observer will be disconnected and reconnected after a short delay.';

  // Migrated from `afterRefreshDimensions.spec.js` together with the DEV-2740 fix (the legacy spec
  // was DEV-2668's Flake 1). It could not be made honestly green before that fix: its only success
  // signal is the guard tripping, the guard counted a succession that a 100 ms wall-clock idle timer
  // reset, and there is no bound on how long a loaded runner takes to deliver 300 frames with every
  // gap under 100 ms. Anchored to delivery cycles instead, the trip is bounded by ~300 frames on any
  // machine, so it can be polled for.
  test('warns once, stops the cycle, and lets the grid react again after the cooldown',
    async({ page, theme, bundle }) => {
      // Two bounded waits on a pipeline that runs at the frame rate: ~300 frames to the trip, then
      // the guard's cooldown before it resumes. Both are longer than the suite's default budget on a
      // loaded runner, and neither is a fixed sleep.
      test.setTimeout(90_000);

      const grid = new RefreshDimensionsPage(page, theme, bundle);

      await grid.goto();
      await grid.buildDvhGrid();

      // The loop occupies every frame, so ~300 of them reach the threshold whatever the machine is
      // doing. Generous, because a loaded runner's frames are long, not because the count is in doubt.
      await expect.poll(() => grid.warnLog(WARNING_FRAGMENT), { timeout: 20_000 }).toEqual([WARNING]);

      const refreshesWhenTripped = await grid.hookCount('after');

      // The guard trips on the 300th successive delivery, and the frames already queued at that
      // moment still run their deferred hook fire - so the total is at least the threshold, never
      // exactly it.
      expect(refreshesWhenTripped).toBeGreaterThanOrEqual(300);

      // The observer is disconnected for the whole cooldown, so a bounded run of frames inside it
      // must add nothing. The poll above is this negative check's positive control: the pipeline
      // reached 300 deliveries a moment ago, so a frozen count here can only be the disconnect.
      await grid.afterAnimationFrames(30);

      expect(await grid.hookCount('after')).toBe(refreshesWhenTripped);

      // And the disconnect is temporary: the loop is still there, so it resumes by itself once the
      // observer is observed again. This is what a grid whose gap-free resize stream was legitimate
      // gets back - before DEV-2740 the disconnect was permanent and it got nothing.
      await expect.poll(() => grid.hookCount('after'), { timeout: 20_000 })
        .toBeGreaterThan(refreshesWhenTripped);

      // Still one warning: the message describes the page's configuration, which has not changed.
      expect(await grid.warnLog(WARNING_FRAGMENT)).toEqual([WARNING]);
    });
});
