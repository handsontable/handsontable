import { test, expect } from '../fixtures/test';
import { StretchColumnsContainerResizePage } from '../fixtures/pages/StretchColumnsContainerResizePage';

/**
 * DEV-2902: after a container resize on a `stretchH` grid the last column header was clipped by a
 * scrollbar's width while the body below it was not, and the root carried `htHasScrollX` /
 * `htHasScrollY` for scrollbars that were never painted.
 *
 * StretchColumns recomputed the widths on `beforeRender` but never invalidated the engine's
 * column-width prefix-sum cache, so the layout snapshot summed the PREVIOUS widths: content wider
 * than the box → horizontal scrollbar predicted → (auto height: box equals content) vertical one
 * predicted too → the top overlay reserved the bar's width and clipped the header.
 *
 * WHICH ASSERTION DISCRIMINATES: `topCloneRootWidth === hiderWidth` and `lastHeaderOverflow <= 0`
 * fail on the unfixed code for the `auto`-height cases (the clone root is 15px short); the
 * `rootScrollClasses` assertion fails for BOTH the auto and the fixed-height cases. The real
 * scrollbar sizes are a backstop — the browser never painted a bar, which is the whole point.
 */
test.describe('stretched columns after a container resize', () => {
  let grid: StretchColumnsContainerResizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new StretchColumnsContainerResizePage(page, theme, bundle);
  });

  for (const stretchH of ['all', 'last'] as const) {
    test(`${stretchH}: the header clone spans the whole grid after shrinking (auto height)`, async() => {
      await grid.goto({ stretchH, height: 'auto' });

      const before = await grid.geometry();

      expect(before.hiderWidth).toBe(1200);
      expect(before.topCloneRootWidth).toBe(1200);
      expect(await grid.rootScrollClasses()).toEqual([]);

      await grid.setContainerWidth(900);

      const after = await grid.geometry();

      // The plugin and the body agree with the container…
      expect(after.apiColumnWidthSum).toBe(900);
      expect(after.bodyWidth).toBe(900);
      // …and so must the header clone: this is the clipped-header symptom.
      expect(after.topCloneRootWidth, 'top clone root width').toBe(after.hiderWidth);
      expect(after.lastHeaderOverflow, 'last header overflow past the clone root').toBeLessThanOrEqual(0);
      // No phantom scrollbar on either axis.
      expect(await grid.rootScrollClasses()).toEqual([]);
      expect(await grid.engineScrollFlags()).toEqual({ vertical: false, horizontal: false });
      expect(after.scrollbar).toEqual({ vertical: 0, horizontal: 0 });
    });

    test(`${stretchH}: growing the container after a shrink also lands clean`, async() => {
      await grid.goto({ stretchH, height: 'auto' });

      await grid.setContainerWidth(900);
      await grid.setContainerWidth(1500);

      const after = await grid.geometry();

      expect(after.apiColumnWidthSum).toBe(1500);
      expect(after.topCloneRootWidth).toBe(after.hiderWidth);
      expect(after.lastHeaderOverflow).toBeLessThanOrEqual(0);
      expect(await grid.rootScrollClasses()).toEqual([]);
    });
  }

  test('all: a fixed-height grid reports no horizontal scrollbar after shrinking', async() => {
    // The second shape of the defect: with a pixel height the vertical prediction stays correct,
    // but the stale content width still summons a horizontal bar. Five rows never fill 300px.
    await grid.goto({ stretchH: 'all', height: 300 });

    await grid.setContainerWidth(900);

    expect(await grid.rootScrollClasses()).toEqual([]);
    expect(await grid.engineScrollFlags()).toEqual({ vertical: false, horizontal: false });
    expect((await grid.geometry()).scrollbar).toEqual({ vertical: 0, horizontal: 0 });
  });

  test('all: a render with nothing changed drops the column-width cache zero times', async() => {
    // Steady state must stay free: an unconditional invalidation on every full render would pass
    // every geometry assertion above while re-summing every column on every draw.
    await grid.goto({ stretchH: 'all', height: 'auto' });

    await grid.setContainerWidth(900);

    expect(await grid.renderWithoutChange()).toBe(0);
  });

  test('none: the control — a resize neither stretches nor drops the cache', async() => {
    await grid.goto({ stretchH: 'none', height: 'auto' });

    const before = await grid.geometry();

    await grid.setContainerWidth(900, false);

    const after = await grid.geometry();

    expect(after.apiColumnWidthSum).toBe(before.apiColumnWidthSum);
    expect(await grid.renderWithoutChange()).toBe(0);
  });
});
