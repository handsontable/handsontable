import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

/**
 * The scrollbar clearance for #10370.
 *
 * A frozen overlay is painted over the grid's scrollbar and hides it, but only where the browser gives
 * the scrollbar no layout space — a floating thumb. Where it takes space there is a real gutter, the
 * overlays already stop short of it, and the whole feature must stay switched off.
 *
 * Which of those a run gets is an OS/browser display setting that a page cannot ask for, so the spec
 * reads the regime at runtime and asserts the matching contract, and both branches assert something
 * real.
 *
 * Which branch runs where, measured rather than assumed: headless Chromium hides its scrollbars, so
 * the gutter is 0 and **CI takes the floating branch** - it covers the fix itself, that the band is
 * drawn and the covering overlay clipped out of it. A headed run on a classic-scrollbar desktop takes
 * the other branch, which guards the doubled scrollbar this feature caused when it trusted a probe
 * over the scroller (a strip drawn beside a scrollbar that already had a gutter).
 *
 * Both branches were checked by mutation. Setting `OVERLAY_SCROLLBAR_CLEARANCE` to 0 fails this spec;
 * removing the regime checks reproduces two bands beside a real 15px gutter on a headed classic
 * desktop. An earlier version of this spec asserted absence immediately after scrolling and passed
 * either way - the scroll event is dispatched asynchronously, so it resolved before anything could
 * have been drawn. Hence the explicit wait for the scroll to be processed.
 */
test.describe('overlay scrollbar clearance', () => {
  test.beforeEach(async ({ page, theme, bundle }) => {
    const grid = new GridPage(page, theme, bundle);

    await grid.goto();

    // A scrolling grid with frozen columns and frozen bottom rows: the configuration where an overlay
    // covers each scrollbar. The shared fixture is deliberately small and non-scrolling, so this is
    // built here rather than by changing a fixture other specs depend on.
    await page.evaluate(() => {
      const host = document.createElement('div');

      host.id = 'clearance-grid';
      host.className = document.querySelector('[data-testid="grid"]')!.className;
      document.body.appendChild(host);

      const data = Array.from({ length: 60 }, (_, r) =>
        Array.from({ length: 25 }, (_, c) => `R${r + 1}C${c + 1}`));

      (window as unknown as { clearanceHot: unknown }).clearanceHot =
        new (window as unknown as { Handsontable: new (...a: unknown[]) => unknown }).Handsontable(host, {
          data,
          colWidths: 90,
          width: 500,
          height: 260,
          rowHeaders: true,
          colHeaders: true,
          fixedColumnsStart: 3,
          fixedRowsBottom: 2,
          licenseKey: 'non-commercial-and-evaluation',
        });
    });

    await expect(page.locator('#clearance-grid .ht_clone_inline_start')).toBeVisible();
  });

  test('matches the browser\'s scrollbar model, and never draws a second scrollbar', async ({ page }) => {
    // Scroll on both axes, which is what puts a floating scrollbar on screen, and wait for the grid to
    // have PROCESSED it. Asserting straight after the assignment would be a race that always passes:
    // the band is opened from the scroll event, which is dispatched asynchronously, so a "nothing was
    // drawn" assertion would resolve before anything could have been. Verified by mutation - with the
    // regime checks removed this spec stayed green until this wait was added.
    // The scroll, the settle and every measurement happen in ONE page call, because the band closes on
    // its own a second after the scroll. Reading it back over separate round-trips - scroll, then ask
    // the regime, then match a locator, then read the clips - leaves the fade racing the test, and a
    // runner that stalls for a second turns a correct build red. Snapshotting inside the page removes
    // the wall clock from the assertions entirely.
    const snapshot = await page.evaluate(() => new Promise<{
      gutterX: number, gutterY: number, bands: number, clips: string[],
    }>((resolve) => {
      const holder = document.querySelector('#clearance-grid .ht_master .wtHolder') as HTMLElement;

      holder.addEventListener('scroll', () => {
        // Two frames after the event: the band is created while handling it, and this leaves the
        // browser a paint to do it in.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          // The gutter this scroller actually gives up. Nonzero means a space-taking scrollbar.
          gutterX: holder.offsetWidth - holder.clientWidth,
          gutterY: holder.offsetHeight - holder.clientHeight,
          bands: document.querySelectorAll('#clearance-grid .htScrollbarClearanceFiller').length,
          clips: [...document.querySelectorAll('#clearance-grid [class*="ht_clone_"]')]
            .map(el => getComputedStyle(el).clipPath),
        })));
      }, { once: true });

      holder.scrollLeft += 160;
      holder.scrollTop += 120;
    }));

    const takesSpace = snapshot.gutterX > 0 || snapshot.gutterY > 0;
    const clipped = snapshot.clips.filter(clip => /inset\(/.test(clip) && clip !== 'inset(0px)');

    if (takesSpace) {
      // Classic scrollbars: the browser already reserved the space, so a strip on top would sit beside
      // a real scrollbar and read as a second one. Nothing may be drawn, and nothing clipped.
      expect(snapshot.bands).toBe(0);
      expect(clipped).toEqual([]);

    } else {
      // Floating scrollbars: a band is drawn for the axis just scrolled, and the overlay covering that
      // edge is clipped out of it so the press can reach the scrollbar underneath.
      expect(snapshot.bands).toBeGreaterThan(0);
      expect(clipped.length).toBeGreaterThan(0);
    }
  });

  test('leaves the grid alone until something scrolls', async ({ page }) => {
    // A band is only ever opened by a scroll, because that is what puts a scrollbar on screen. An idle
    // grid carrying one would be a strip of dead pixels over live cells — which is what opening on
    // hover, or on keyboard navigation, used to produce.
    const bands = page.locator('#clearance-grid .htScrollbarClearanceFiller');

    await expect(bands).toHaveCount(0);

    // Moving the pointer over the grid, including along its edges, must not open one either.
    const box = await page.locator('#clearance-grid').boundingBox();

    if (box) {
      await page.mouse.move(box.x + (box.width / 2), box.y + box.height - 4);
      await page.mouse.move(box.x + box.width - 4, box.y + (box.height / 2));
    }

    // Same reasoning as above: give the pointer handler a paint to act in, or this asserts nothing.
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));

    await expect(bands).toHaveCount(0);
  });
});
