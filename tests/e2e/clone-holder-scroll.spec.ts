import { test, expect } from '../fixtures/test';
import { CloneHolderScrollPage } from '../fixtures/pages/CloneHolderScrollPage';

/**
 * DEV-2937: the frozen overlays' clone holders are composited scroll containers.
 *
 * `ScrollSync` writes `scrollTop`/`scrollLeft` on the inline-start, top and bottom clone holders
 * once per scroll frame. While those holders were `overflow: hidden` the browser gave them no
 * compositor layer, so every write re-recorded the clone on the main thread and re-layerized every
 * paint chunk on the page - ~850 ms of paint per 2.5 s scroll on a grid of SVG-rich cells. With
 * `overflow: auto` and the scrollbar suppressed the same writes take the compositor's fast path.
 *
 * The paint cost itself is not observable here; what this file pins is the contract that produces
 * it and the guards that make it safe: the computed `overflow` (a stylesheet edit that reverts it
 * gives the paint back silently), no scrollbar space inside the box, the holders out of the tab
 * order, the mirror of the master's offset, and a scroll of the clone ITSELF - what a touch pan
 * over a frozen header does - landing on the master with the clone realigned.
 */
test.describe('Clone holders as composited scroll containers', () => {
  let grid: CloneHolderScrollPage;

  test.describe('element-scrolled', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CloneHolderScrollPage(page, theme, bundle);
      await grid.goto('element');
    });

    test('makes the three scroll-mirrored clone holders scroll containers with no scrollbar of their own', async() => {
      for (const name of ['inline_start', 'top', 'bottom'] as const) {
        const box = await grid.holderBox(name);

        expect(box.overflowY, `${name} overflow-y`).toBe('auto');
        expect(box.overflowX, `${name} overflow-x`).toBe('auto');
        expect(box.scrollbarWidth, `${name} scrollbar-width`).toBe('none');
        // A visible scrollbar would take space inside the box, and the clone is sized to the pixel
        // against the master: 9px of row-header column gone under a track is exactly the defect.
        expect(box.scrollbarGutterX, `${name} vertical scrollbar space`).toBe(0);
        expect(box.scrollbarGutterY, `${name} horizontal scrollbar space`).toBe(0);
      }

      // The corner is never scrolled, so it is not a scroll container at all (the base stylesheet
      // never clipped its holder); the master is the reference.
      expect((await grid.holderBox('top_inline_start_corner')).overflowY).toBe('visible');
      expect((await grid.holderBox('master')).overflowY).toBe('auto');
    });

    test('keeps every holder out of the tab order', async() => {
      // Chrome 127+ makes a scroll container with no focusable content a keyboard tab stop; the
      // engine stamps `tabindex="-1"` on every holder so the frozen panes never become one.
      for (const name of ['master', 'inline_start', 'top', 'bottom', 'top_inline_start_corner'] as const) {
        expect((await grid.holderBox(name)).tabIndex, `${name} tabindex`).toBe(-1);
      }
    });

    test('mirrors the master offset onto the clone holders', async() => {
      await grid.scrollMasterTo({ top: 300, left: 250 });

      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(300);
      await expect.poll(async() => (await grid.offsets()).top.left).toBe(250);
      await expect.poll(async() => (await grid.offsets()).bottom.left).toBe(250);
    });

    test('hands a scroll of a clone holder to the master and realigns the clone', async() => {
      await grid.scrollMasterTo({ top: 300, left: 250 });
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(300);
      await expect.poll(async() => (await grid.offsets()).top.left).toBe(250);

      // A pan over the frozen row headers: the compositor moves the inline-start clone first.
      await grid.scrollCloneTo('inline_start', { top: 400 });

      await expect.poll(async() => (await grid.offsets()).master.top).toBe(400);
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(400);

      // And over the frozen column headers: the top clone moves first, the bottom one follows the
      // master with it.
      await grid.scrollCloneTo('top', { left: 330 });

      await expect.poll(async() => (await grid.offsets()).master.left).toBe(330);
      await expect.poll(async() => (await grid.offsets()).top.left).toBe(330);
      await expect.poll(async() => (await grid.offsets()).bottom.left).toBe(330);
    });

    test('scrolls the master back when a clone holder is scrolled back', async() => {
      await grid.scrollMasterTo({ top: 300, left: 0 });
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(300);

      await grid.scrollCloneTo('inline_start', { top: 120 });

      await expect.poll(async() => (await grid.offsets()).master.top).toBe(120);
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(120);
    });
  });

  test.describe('window-scrolled', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CloneHolderScrollPage(page, theme, bundle);
      await grid.goto('window');
    });

    test('really lets the window own the vertical axis', async() => {
      expect(await grid.windowOwnsVerticalAxis()).toBe(true);
    });

    test('keeps the inline-start clone holder at offset zero under a page scroll', async() => {
      // In window mode the clone's rows follow the page through the spreader offset, and the holder
      // must not accumulate the page offset (`ScrollSync#syncScrollPositions`). The holder is still
      // a scroll container - the rule is not mode-dependent - so this pins that it stays at zero.
      expect((await grid.holderBox('inline_start')).overflowY).toBe('auto');

      await grid.scrollWindowTo(400);

      await expect.poll(async() => (await grid.offsets()).master.top).toBe(0);
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(0);
    });
  });
});
