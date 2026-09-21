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
 * caught the clone root running 15px short while `height: 'auto'` still clipped the root; the
 * `rootScrollClasses` assertion caught the phantom classes in both height modes. The real scrollbar
 * sizes are a backstop — the browser never painted a bar, which is the whole point.
 *
 * Since DEV-2789, `height: 'auto'` with no `width` leaves both scroll axes to the page, and the top
 * overlay writes no width on its clone root. The `'auto'` cases therefore pin that mode: an unsized
 * clone root, columns that fill the container, and no phantom scroll classes. The clone-root width
 * check lives on in the pixel-height case, the one mode where the root still sizes the clone.
 */
test.describe('stretched columns after a container resize', () => {
  let grid: StretchColumnsContainerResizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new StretchColumnsContainerResizePage(page, theme, bundle);
  });

  for (const stretchH of ['all', 'last'] as const) {
    test(`${stretchH}: the header clone spans the whole grid after shrinking (auto height)`, async() => {
      await grid.goto({ stretchH, height: 'auto' });

      expect(await grid.horizontalAxisOwnedByWindow()).toBe(true);

      const before = await grid.geometry();

      expect(before.hiderWidth).toBe(1200);
      expect(before.topCloneRootWidth).toBeNaN();
      expect(await grid.rootScrollClasses()).toEqual([]);

      await grid.setContainerWidth(900);

      const after = await grid.geometry();

      // The plugin and the body agree with the container…
      expect(after.apiColumnWidthSum).toBe(900);
      expect(after.bodyWidth).toBe(900);
      // …and the header clone carries no inline width in window mode: a pixel value here would be a
      // stale reservation.
      expect(after.topCloneRootWidth, 'top clone root width').toBeNaN();
      expect(after.lastHeaderOverflow, 'last header overflow past the clone root').toBeLessThanOrEqual(0);
      // No phantom scrollbar on either axis.
      expect(await grid.rootScrollClasses()).toEqual([]);
      expect(await grid.engineScrollFlags()).toEqual({ vertical: false, horizontal: false });
      expect(after.scrollbar).toEqual({ vertical: 0, horizontal: 0 });
    });

    // No-regression check on the GROW direction: the stale cache undershoots once the container
    // grows past it, so it does not reproduce the defect (see the header-clone test above for that).
    test(`${stretchH}: growing the container after a shrink also lands clean`, async() => {
      await grid.goto({ stretchH, height: 'auto' });

      await grid.setContainerWidth(900);
      // 1200, not wider: the page owns the horizontal axis here, so a container wider than the
      // viewport gives the page a real horizontal scrollbar and a truthful `htHasScrollX`.
      await grid.setContainerWidth(1200);

      const after = await grid.geometry();

      expect(after.apiColumnWidthSum).toBe(1200);
      expect(after.topCloneRootWidth).toBeNaN();
      expect(after.lastHeaderOverflow).toBeLessThanOrEqual(0);
      expect(await grid.rootScrollClasses()).toEqual([]);
    });
  }

  test('all: growing past the viewport in window mode gives the page a real horizontal scrollbar', async() => {
    // The other side of the grow case above: with `'auto'` and no `width` the page owns the columns,
    // so a container wider than the 1280px viewport makes the PAGE scroll sideways. `htHasScrollX` is
    // then the truth, not a phantom, and the header clone must still follow the stretched columns.
    await grid.goto({ stretchH: 'all', height: 'auto' });

    expect(await grid.horizontalAxisOwnedByWindow()).toBe(true);

    await grid.setContainerWidth(900);
    await grid.setContainerWidth(1500);

    const after = await grid.geometry();

    expect(after.apiColumnWidthSum).toBe(1500);
    expect(after.lastHeaderOverflow).toBeLessThanOrEqual(0);
    expect(await grid.documentOverflowsHorizontally()).toBe(true);
    expect(await grid.rootScrollClasses()).toEqual(['htHasScrollX']);
  });

  test('all: a fixed-height grid reports no horizontal scrollbar after shrinking', async() => {
    // The second shape of the defect: with a pixel height the vertical prediction stays correct,
    // but the stale content width still summons a horizontal bar. Five rows never fill 300px.
    await grid.goto({ stretchH: 'all', height: 300 });

    await grid.setContainerWidth(900);

    const after = await grid.geometry();

    // The root sizes the header clone in this mode, so the clipped-header symptom is reachable here.
    expect(after.topCloneRootWidth, 'top clone root width').toBe(after.hiderWidth);
    expect(after.lastHeaderOverflow, 'last header overflow past the clone root').toBeLessThanOrEqual(0);
    expect(await grid.rootScrollClasses()).toEqual([]);
    expect(await grid.engineScrollFlags()).toEqual({ vertical: false, horizontal: false });
    expect(after.scrollbar).toEqual({ vertical: 0, horizontal: 0 });
  });

  test('all: with autoColumnSize on (the library default) the header clone still spans the grid', async() => {
    // AutoColumnSize is the other `modifyColWidth` producer that drops the same engine cache, and it
    // supplies the base widths StretchColumns stretches. The exact-count tests keep it off; this one
    // runs the default setup and asserts the geometry only.
    await grid.goto({ stretchH: 'all', height: 'auto', autoColumnSize: true });

    await grid.setContainerWidth(900);

    const after = await grid.geometry();

    expect(after.apiColumnWidthSum).toBe(900);
    expect(after.topCloneRootWidth).toBeNaN();
    expect(after.lastHeaderOverflow).toBeLessThanOrEqual(0);
    expect(await grid.rootScrollClasses()).toEqual([]);
  });

  test('all: a render with nothing changed drops the column-width cache zero times', async() => {
    // Steady state must stay free: an unconditional invalidation on every full render would pass
    // every geometry assertion above while re-summing every column on every draw. The counter sits
    // on the engine cache itself, so a drop through any path (the plugin, `updateSettings`, the
    // engine's own remeasure) would show here.
    await grid.goto({ stretchH: 'all', height: 'auto' });

    await grid.setContainerWidth(900);

    expect(await grid.renderWithoutChange()).toBe(0);
  });

  test('all: shrinking below the base width sum switches stretching off with exactly one cache drop', async() => {
    // The all-`null` write in `#applyWidths`: at 400px the base widths (50 + 50 + 190 + 165 = 455) no
    // longer fit, the strategy returns no widths, the map goes from stretched to empty in ONE write
    // with ONE cache drop, the hider stops following the container, and a plain render afterwards
    // costs nothing. The hider does not reach 400, so the wait is on the resize-driven render.
    // A pixel height: this state exists only while the root owns the scroll. `'auto'` leaves both axes
    // to the page (DEV-2789), and there the columns stretch to the document's width instead, exactly as
    // they do with no `height` at all.
    await grid.goto({ stretchH: 'all', height: 300 });

    const dropsBefore = await grid.invalidationCount();

    await grid.setContainerWidth(400, 'render');

    const after = await grid.geometry();

    expect(after.apiColumnWidthSum).toBe(455);
    expect(after.hiderWidth).toBe(455);
    expect((await grid.invalidationCount()) - dropsBefore).toBe(1);
    expect(await grid.renderWithoutChange()).toBe(0);
  });

  test('all: in window mode a shrink stretches to the root, not to the document', async() => {
    // Without `height` the window owns both axes, and `Viewport#measureWorkspaceWidth` decides the
    // workspace by summing the columns live through `modifyColWidth`. If the previous stretched
    // widths answer that sum, a shrink reads the OLD viewport back, the measurement falls through to
    // the document's client width, and the columns overshoot the root by the body padding (32px) —
    // permanently, since the next refresh reads the overshoot back. The plugin must measure against
    // the base widths (review finding on #13493).
    await grid.goto({ stretchH: 'all', height: 'none' });

    expect(await grid.horizontalAxisOwnedByWindow()).toBe(true);

    const before = await grid.geometry();

    expect(before.apiColumnWidthSum).toBe(before.rootWidth);

    await grid.resizeViewport(800, 600);

    const after = await grid.geometry();

    expect(after.rootWidth).toBeLessThan(before.rootWidth);
    expect(after.apiColumnWidthSum, 'columns fill the root, not the document').toBe(after.rootWidth);
    expect(after.hiderWidth).toBe(after.rootWidth);
    expect(await grid.rootScrollClasses()).toEqual([]);
    expect(await grid.documentOverflowsHorizontally()).toBe(false);

    // The second refresh must land on the same numbers: the measurement is idempotent.
    expect(await grid.renderWithoutChange()).toBe(0);
    expect((await grid.geometry()).apiColumnWidthSum).toBe(after.rootWidth);
  });
});
