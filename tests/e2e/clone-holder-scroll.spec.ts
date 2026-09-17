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

    test('makes each scroll-mirrored clone holder a scroll container on the axis the engine writes, with no scrollbar', async() => {
      // One axis each: the inline-start clone follows the master's rows, the top and bottom clones
      // its columns. The cross axis stays clipped so a pan can never take it.
      const axes = {
        inline_start: { overflowY: 'auto', overflowX: 'hidden' },
        top: { overflowY: 'hidden', overflowX: 'auto' },
        bottom: { overflowY: 'hidden', overflowX: 'auto' },
      } as const;

      for (const name of ['inline_start', 'top', 'bottom'] as const) {
        const box = await grid.holderBox(name);

        expect(box.overflowY, `${name} overflow-y`).toBe(axes[name].overflowY);
        expect(box.overflowX, `${name} overflow-x`).toBe(axes[name].overflowX);
        expect(box.scrollbarWidth, `${name} scrollbar-width`).toBe('none');
        // A visible scrollbar would take space inside the box, and the clone is sized to the pixel
        // against the master: 9px of row-header column gone under a track is exactly the defect.
        expect(box.scrollbarGutterX, `${name} vertical scrollbar space`).toBe(0);
        expect(box.scrollbarGutterY, `${name} horizontal scrollbar space`).toBe(0);
      }

      // The corner is never scrolled, so it is not a scroll container at all (the base stylesheet
      // never clipped its holder); the master is the reference. Both axes on both, so a rule that
      // clipped one of them cannot slip through the axis this file does not name.
      const corner = await grid.holderBox('top_inline_start_corner');
      const master = await grid.holderBox('master');

      expect(corner.overflowY).toBe('visible');
      expect(corner.overflowX).toBe('visible');
      expect(master.overflowY).toBe('auto');
      expect(master.overflowX).toBe('auto');
    });

    test('keeps the scroll containers out of the tab order and leaves the corner alone', async() => {
      // Chrome 127+ makes a scroll container with no focusable content a keyboard tab stop; the
      // engine stamps `tabindex="-1"` on the four scroll containers so the frozen panes never
      // become one. The corner is not a scroll container and carries no tabindex.
      for (const name of ['master', 'inline_start', 'top', 'bottom'] as const) {
        expect((await grid.holderBox(name)).tabindex, `${name} tabindex`).toBe('-1');
      }

      expect((await grid.holderBox('top_inline_start_corner')).tabindex).toBeNull();
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

    test('judges a clone scroll event against the engine ledger, not the master offset', async() => {
      // The load-bearing design decision, made falsifiable. The clone's pending scroll event is
      // delivered while the master has already moved on - the sub-frame race, forced in one
      // synchronous block rather than waited for.
      //
      // The reference decides what the listener does with that 100px gap. Against the ledger the
      // clone sits exactly where the engine left it, so nothing moves. Against the master's live
      // offset the gap reads as a user scroll backwards, and the listener pulls the master to 300
      // and pushes the clone to 400 - measured, on a build with that reference.
      //
      // The offsets are asserted as the listener left them, not after they settle: a second
      // correction a frame later happens to undo the first, so the settled state is 400/400 either
      // way and proves nothing.
      await grid.scrollMasterTo({ top: 300, left: 0 });
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(300);

      const raced = await grid.raceCloneScrollAgainstMaster('inline_start', 400);

      expect(raced.master, 'the listener must not move the master').toBe(400);
      expect(raced.clone, 'the listener must leave the clone where the engine wrote it').toBe(300);

      // The engine then syncs the clone the ordinary way, off the master's own scroll event.
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(400);
      expect(await grid.rowMisalignment(3)).toBe(0);
    });

    test('scrolls the master back when a clone holder is scrolled back', async() => {
      await grid.scrollMasterTo({ top: 300, left: 0 });
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(300);

      await grid.scrollCloneTo('inline_start', { top: 120 });

      await expect.poll(async() => (await grid.offsets()).master.top).toBe(120);
      await expect.poll(async() => (await grid.offsets()).inlineStart.top).toBe(120);
    });
  });

  test.describe('touch', () => {
    // A synthesized touch pan is the one gesture that reaches a clone holder before any script runs:
    // the compositor moves it, and only then does the `scroll` event let the engine react. Through
    // CDP, which every project here has (all six run Chromium) - nothing else emits a trusted touch
    // scroll (`tests/AGENTS.md`).
    test.use({ hasTouch: true });

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CloneHolderScrollPage(page, theme, bundle);
      await grid.goto('element');
    });

    test('scrolls the grid when a finger pans over the frozen row headers', async() => {
      // A thumb dragging the frozen row-header column upwards by 150px.
      await grid.panTouch('inline_start', { dy: -150 });

      // The pan reaches the master through the clone's drift; the clone realigns from the master.
      await expect.poll(async() => (await grid.offsets()).master.top).toBeGreaterThan(0);
      await expect.poll(async() => {
        const { master, inlineStart } = await grid.offsets();

        return inlineStart.top - master.top;
      }).toBe(0);
      expect(await grid.rowMisalignment(3)).toBe(0);
    });

    test('scrolls the grid when a finger pans across the frozen column headers', async() => {
      // The other axis, and the one the headline case names: the top clone is a scroll container on
      // `overflow-x` alone, so this is the gesture an axis-specific clipping regression would break
      // while the vertical pan above stayed green.
      await grid.panTouch('top', { dx: -150 });

      await expect.poll(async() => (await grid.offsets()).master.left).toBeGreaterThan(0);
      await expect.poll(async() => {
        const { master, top } = await grid.offsets();

        return top.left - master.left;
      }).toBe(0);
      // The bottom clone follows the master on the same axis.
      await expect.poll(async() => {
        const { master, bottom } = await grid.offsets();

        return bottom.left - master.left;
      }).toBe(0);
    });
  });

  test.describe('right-to-left', () => {
    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new CloneHolderScrollPage(page, theme, bundle);
      await grid.goto('element', 'rtl');
    });

    test('mirrors the master offset onto the horizontal clones, into negative scrollLeft', async() => {
      // An RTL holder scrolls into NEGATIVE `scrollLeft`, which is the branch
      // `measureCloneScrollDrift` clamps symmetrically around zero. Nothing but this fixture drives
      // it with a live DOM.
      await grid.scrollMasterTo({ top: 0, left: -250 });

      await expect.poll(async() => (await grid.offsets()).master.left).toBeLessThan(0);
      await expect.poll(async() => {
        const { master, top } = await grid.offsets();

        return top.left - master.left;
      }).toBe(0);
    });

    test('hands a scroll of an RTL clone holder to the master', async() => {
      await grid.scrollMasterTo({ top: 0, left: -250 });
      await expect.poll(async() => (await grid.offsets()).top.left).toBe(-250);

      // Further towards the end of the grid, which in RTL is further negative.
      await grid.scrollCloneTo('top', { left: -330 });

      await expect.poll(async() => (await grid.offsets()).master.left).toBe(-330);
      await expect.poll(async() => (await grid.offsets()).top.left).toBe(-330);
    });

    test('scrolls the grid when a finger pans across the frozen column headers', async() => {
      await grid.panTouch('top', { dx: 150 });

      await expect.poll(async() => (await grid.offsets()).master.left).toBeLessThan(0);
      await expect.poll(async() => {
        const { master, top } = await grid.offsets();

        return top.left - master.left;
      }).toBe(0);
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

    test('keeps the frozen column in step with its rows under a page scroll', async() => {
      // In window mode the clone's rows follow the page through the spreader offset, not through
      // the holder's own offset (`ScrollSync#syncScrollPositions` writes zero there). The holder is
      // a scroll container all the same - the rule is not mode-dependent - so what has to hold is
      // the visible contract: the frozen column's rows line up with the master's after the scroll.
      expect((await grid.holderBox('inline_start')).overflowY).toBe('auto');

      await grid.scrollWindowTo(400);

      await expect.poll(async() => (await grid.offsets()).master.top).toBe(0);
      await expect.poll(async() => grid.rowMisalignment(3)).toBe(0);
      expect(await grid.rowMisalignment(10)).toBe(0);
    });

  });
});
