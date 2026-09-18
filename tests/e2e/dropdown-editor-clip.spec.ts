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

    test('keeps a `handsontable` list inside the viewport so its last options stay reachable',
      async ({ page }) => {
        // The plain `handsontable` type is the one list with no trim of its own: it opens at the
        // height its sub-grid asks for. A viewport shorter than that height is what exposes it.
        // A `fixed` box adds nothing to the page's scroll height, and the list's holder only
        // scrolls WITHIN the height the list was given, so anything hanging below the viewport
        // is unreachable at every scroll position. Measured at 19 of 20 options before the cap
        // (list 439px in a 400px viewport), against 20 of 20 on the `absolute` rules it replaced.
        const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);

        await page.setViewportSize({ width: 1280, height: 400 });
        await grid.rebuild({ height: 'auto', editorType: 'handsontable', options });
        await grid.openEditor(2, 1);

        const { list, cell } = await grid.boxes();
        const viewportHeight = await page.evaluate(() => window.innerHeight);

        // The invariant: nothing hangs past the box the list is laid out in. Before the cap this
        // read 439 against a 400px viewport.
        expect(list.bottom).toBeLessThanOrEqual(viewportHeight + 1);
        // Capped to the free space below the cell, not to the whole containing block, so the
        // edited cell stays visible - which is what the `absolute` rules did. Before the cap the
        // list was pinned to the top of the viewport and covered the cell, so this read 0.
        expect(list.top).toBeGreaterThan(cell.top);
        expect(await grid.reachableAcrossListScroll()).toBe(options.length);
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

  test.describe('an ancestor that is NOT the containing block for a fixed box', () => {
    test('places the list on its cell inside a container-query ancestor', async () => {
      // `container-type` once implied layout containment, which would make the container the box
      // a fixed list is laid out in. No current engine does that - measured in Chromium 148 and
      // 151, Firefox 153 and WebKit 26.5 - so the list is still placed against the viewport, and
      // treating the container as the box moves the list by exactly the container's offset.
      await grid.rebuild({ height: 150 }, 'container-query');
      await grid.openEditor(2, 1);

      expectAnchoredToCell(await grid.boxes());
      expect(await grid.reachableOptions()).toBe(await grid.optionCount());
    });
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

    test('grows a trimmed list back when the cell gains room again', async ({ page }) => {
      // A viewport too short for the list on either side of the cell, so the clamp has to trim it.
      // Growing the viewport then gives the cell room for every option, and goes through the same
      // follow path a scroll does.
      await page.setViewportSize({ width: 1280, height: 260 });
      await grid.rebuild({ height: 120 });
      await grid.openEditor(2, 1);

      const options = await grid.optionCount();

      expect(await grid.reachableOptions()).toBeLessThan(options);

      await page.setViewportSize({ width: 1280, height: 900 });

      // A clamp that only ever shrinks leaves the list as short as it was at the edge.
      await expect.poll(() => grid.reachableOptions()).toBe(options);
    });

    test('does not re-write a list height it has already applied', async ({ page }) => {
      // A viewport too short for the list, so the clamp runs on every scroll event - the case the
      // scroll follow exists for. The free space changes by less than a row between two events, so
      // the clamp keeps arriving at the height already applied. Writing it again is a full
      // sub-grid `updateSettings()` render that changes nothing: measured at 2 per scroll event
      // before the gate, so 20 identical writes of `203` across 10 scrolls.
      // 20 options, not the fixture's 8: on `classic` the shorter rows let 8 of them fit even in
      // a 260px viewport, so the clamp never ran and the case passed without testing anything.
      const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);

      await page.setViewportSize({ width: 1280, height: 260 });
      await grid.rebuild({ height: 'auto', options }, 'pushed-down');
      await grid.openEditor(2, 1);

      // The list has to be trimmed here, or the clamp never runs and the case proves nothing.
      expect(await grid.reachableOptions()).toBeLessThan(options.length);

      await grid.startListHeightWriteRecorder();
      await grid.startScrollCounter();

      // Positive control for the RECORDER, not just for the scroll: a step of more than two rows
      // on every theme must change the trimmed height, so it has to be captured. Without this, a
      // recorder that stopped intercepting the sub-grid would leave the list empty and the
      // no-repeat check below would pass having verified nothing.
      await grid.scrollWindowBy(60);
      await expect.poll(async () => (await grid.listHeightWrites()).length).toBeGreaterThanOrEqual(1);

      // Then the steady state: steps well under a row, where the clamp keeps landing on the height
      // it already applied.
      for (let step = 0; step < 6; step += 1) {
        await grid.scrollWindowBy(4);
      }

      expect(await grid.scrollCount()).toBeGreaterThan(0);

      const written = await grid.listHeightWrites();
      const repeated = written.filter((height, index) => index > 0 && height === written[index - 1]);

      expect(repeated, `heights written while scrolling: ${written.join(', ')}`).toEqual([]);
    });

    test('re-clamps a `multiselect` list when the grid\'s own scroll moves the cell', async ({ page }) => {
      // A grid almost as tall as the viewport, scrolled so the edited row starts at its top: the
      // list opens downwards with room to spare on every theme. Scrolling the grid's OWN holder then
      // carries the cell to the grid's bottom edge, too close to the viewport's for the list to
      // fit below it. The page does not scroll, so only the grid's scroll hooks can react.
      await grid.rebuild({ height: 640, rows: 80, editorType: 'multiselect' });
      await grid.scrollGridToRow(40, 'top');
      await grid.openEditor(40, 1);

      const options = await grid.optionCount();

      expect(await grid.reachableOptions()).toBe(options);

      await grid.scrollGridToRow(40, 'bottom');

      // Without a re-clamp the list keeps its opening height and hangs past the viewport's bottom
      // edge, where a `fixed` box adds nothing to scroll to.
      await expect.poll(() => grid.reachableOptions()).toBe(options);

      const { list } = await grid.boxes();

      expect(list.bottom).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    });

    test('flips a `multiselect` list back below the cell once a scroll gives it room again', async () => {
      // The round trip of the case above: at the grid's bottom edge the list has to open upwards,
      // and back at the top it has room below again. A flip that is set but never cleared keeps the
      // list above a cell at the top of the grid - off the screen, with nothing reachable.
      await grid.rebuild({ height: 640, rows: 80, editorType: 'multiselect' });
      await grid.scrollGridToRow(40, 'top');
      await grid.openEditor(40, 1);
      await grid.scrollGridToRow(40, 'bottom');

      const options = await grid.optionCount();

      await expect.poll(() => grid.reachableOptions()).toBe(options);
      expect(await grid.isFlippedVertically()).toBe(true);

      const flipped = await grid.boxes();

      await grid.scrollGridToRow(40, 'top');

      // The control: the list followed the cell back up, so the re-decision has run.
      await expect.poll(async () => (await grid.boxes()).list.top).toBeLessThan(flipped.list.top - 100);

      expect(await grid.isFlippedVertically()).toBe(false);
      expect((await grid.boxes()).list.top).toBeGreaterThanOrEqual(0);
      expect(await grid.reachableOptions()).toBe(options);
    });

    test('hides a `multiselect` list without throwing when a page scroll unrenders its row',
      async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', error => errors.push(error.message));

        // `height: 'auto'`: the page scrolls the grid, so a row far above the viewport is not
        // rendered and the editor has no cell left to measure.
        await grid.rebuild({ height: 'auto', rows: 200, editorType: 'multiselect' });
        await grid.openEditor(0, 1);

        expect(await grid.isListShown()).toBe(true);

        // The page-scroll listener runs before the grid redraws, so the scroll that unrenders the
        // row still finds its cell. The grid's own scroll hook then hides the list.
        await grid.scrollWindowBy(4000);
        await expect.poll(() => grid.isListShown()).toBe(false);

        // Every later scroll reaches the listener with no cell to measure.
        await grid.startScrollCounter();
        await grid.scrollWindowBy(100);

        // The control for the check below: that scroll reached the document's listeners.
        await expect.poll(() => grid.scrollCount()).toBeGreaterThan(0);
        expect(errors).toEqual([]);
      });

    test('keeps a `multiselect` list\'s own scroll position when the grid scrolls', async () => {
      // Too many options to fit, so the list is clamped and scrolls inside its own box.
      const source = Array.from({ length: 40 }, (_, i) => `Option ${i + 1}`);

      await grid.rebuild({ height: 640, rows: 80, columns: [{}, { type: 'multiselect', source }] });
      await grid.scrollGridToRow(40, 'top');
      await grid.openEditor(40, 1);
      await grid.scrollListTo(200);

      const before = await grid.boxes();

      // Two rows up: the cell moves down, and stays in view.
      await grid.scrollGridToRow(38, 'top');

      // The control: the list followed the cell, so the re-clamp that resets its scroll has run.
      await expect.poll(async () => (await grid.boxes()).list.top).toBeGreaterThan(before.list.top + 20);
      expect(await grid.listScrollTop()).toBe(200);
    });
  });
});
