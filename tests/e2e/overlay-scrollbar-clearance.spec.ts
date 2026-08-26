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

  test('draws the track for a grid whose only overlays are its headers', async ({ page }) => {
    // Headers render overlays too - `shouldRenderTopOverlay` is `fixedRowsTop > 0 ||
    // columnHeaders().length > 0` - so `colHeaders: true` alone puts a top overlay on the inline-end
    // edge, and `rowHeaders: true` puts an inline-start overlay on the bottom one. Each covers the
    // scrollbar it touches, so each needs the strip.
    //
    // Being rendered is the whole question. An earlier revision asked instead whether the overlay
    // carried frozen rows or columns of its own, which switched the clearance off here - and, far
    // worse, off on the vertical axis of any grid with frozen columns and no frozen rows, where the
    // column header is the only overlay on that edge. See the test below.
    await page.evaluate(() => {
      const host = document.createElement('div');

      host.id = 'headers-only-grid';
      host.className = document.querySelector('[data-testid="grid"]')!.className;
      document.body.appendChild(host);

      const data = Array.from({ length: 60 }, (_, r) =>
        Array.from({ length: 25 }, (_, c) => `R${r + 1}C${c + 1}`));

      new (window as unknown as { Handsontable: new (...a: unknown[]) => unknown }).Handsontable(host, {
        data,
        colWidths: 90,
        width: 500,
        height: 260,
        rowHeaders: true,
        colHeaders: true,
        // Nothing frozen, on purpose.
        licenseKey: 'non-commercial-and-evaluation',
      });
    });

    await expect(page.locator('#headers-only-grid .ht_clone_top')).toBeVisible();

    const snapshot = await page.evaluate(() => new Promise<{
      gutterX: number, gutterY: number, bands: number, clipped: string[],
      bandCoversRight: boolean, bandCoversHeaderStrip: boolean,
    }>((resolve) => {
      const root = document.querySelector('#headers-only-grid')!;
      const holder = root.querySelector('.ht_master .wtHolder') as HTMLElement;

      holder.addEventListener('scroll', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const r = holder.getBoundingClientRect();
          const topClone = root.querySelector('.ht_clone_top') as HTMLElement;
          const covers = (x: number, y: number) =>
            [...root.querySelectorAll('.htScrollbarClearanceFiller')].some((el) => {
              const br = el.getBoundingClientRect();

              return x >= br.left && x <= br.right && y >= br.top && y <= br.bottom;
            });

          resolve({
            gutterX: holder.offsetWidth - holder.clientWidth,
            gutterY: holder.offsetHeight - holder.clientHeight,
            bands: root.querySelectorAll('.htScrollbarClearanceFiller').length,
            clipped: [...root.querySelectorAll('[class*="ht_clone_"]')]
              .map(el => `${(el.className.match(/ht_clone_\w+/) || ['?'])[0]}=${getComputedStyle(el).clipPath}`)
              .filter(entry => !entry.endsWith('none')),
            bandCoversRight: covers(r.right - 8, r.top + (r.height / 2)),
            // Inside the column header, in the strip the clip takes away.
            bandCoversHeaderStrip: covers(r.right - 8, topClone.getBoundingClientRect().bottom - 4),
          });
        }));
      }, { once: true });

      holder.scrollLeft += 160;
      holder.scrollTop += 120;
    }));

    // Non-vacuity: on a classic-scrollbar runner nothing is ever drawn for any grid, so the assertions
    // below would hold on a build that never cleared anything at all.
    if (snapshot.gutterX > 0 || snapshot.gutterY > 0) {
      return;
    }

    expect(snapshot.bands).toBeGreaterThan(0);
    expect(snapshot.clipped.join(',')).toContain('ht_clone_top');

    // The band and the clip have to arrive together. What a clip uncovers is the master, which after
    // this scroll is a different row and column - so a bare clip would put a data cell where the column
    // header belongs. The band has to span the strip the clip opened, along its whole length.
    //
    // Measured by geometry, not by `elementFromPoint`: the band deliberately does not hit-test, so that
    // painting it over the selection's controls does not disarm them - see `Overlays#swallowBandPress`.
    expect(snapshot.bandCoversHeaderStrip).toBe(true);
    expect(snapshot.bandCoversRight).toBe(true);
  });

  test('gives the strip to the scrollbar while the track is up, and back afterwards', async ({ page }) => {
    // The deliberate cost of the track, and the decision behind it: while it is on screen the strip
    // belongs to the scrollbar, so a press there does not move the selection - even over ordinary
    // cells the band happens to cover. That matches what the platform does; a macOS overlay scrollbar
    // takes the presses in its own strip too.
    //
    // Both halves are asserted, because only the pair says "the track owns this" rather than "presses
    // here are broken": the same click is swallowed while the track is up and lands normally once it
    // has gone. The second half is also what stops this test passing on a build that simply never
    // draws a track.
    const selection = () => page.evaluate(() =>
      JSON.stringify((window as unknown as { clearanceHot: { getSelectedLast(): number[] } })
        .clearanceHot.getSelectedLast() ?? null));

    await page.evaluate(() => (window as unknown as {
      clearanceHot: { selectCell(r: number, c: number): void }
    }).clearanceHot.selectCell(4, 4));

    const before = await selection();

    // Scroll, which is what puts the track up, and read the point to press while it is still there.
    const point = await page.evaluate(() => new Promise<{ x: number, y: number, bands: number }>((resolve) => {
      const holder = document.querySelector('#clearance-grid .ht_master .wtHolder') as HTMLElement;

      holder.addEventListener('scroll', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const r = holder.getBoundingClientRect();

          resolve({
            // Well inside the bottom strip, and away from the frozen columns on the left.
            x: r.left + (r.width * 0.75),
            y: r.bottom - 6,
            bands: document.querySelectorAll('#clearance-grid .htScrollbarClearanceFiller').length,
          });
        }));
      }, { once: true });

      holder.scrollTop += 120;
      holder.scrollLeft += 160;
    }));

    // Nothing is drawn on a classic-scrollbar runner, so there is no strip to argue about.
    if (point.bands === 0) {
      return;
    }

    await page.mouse.click(point.x, point.y);

    expect(await selection()).toBe(before);

    // Now let the track go, and press the very same point again. The pointer has to leave the strip
    // first: a pointer resting beside the scrollbar holds the track open on purpose, so waiting for
    // the fade without moving away waits forever.
    await page.mouse.move(point.x, point.y - 120);

    await page.waitForFunction(
      () => document.querySelectorAll('#clearance-grid .htScrollbarClearanceFiller').length === 0,
      undefined, { timeout: 5000 });

    await page.mouse.click(point.x, point.y);

    expect(await selection()).not.toBe(before);
  });

  test('clears the vertical scrollbar with frozen columns and no frozen rows', async ({ page }) => {
    // The reported case, and the one that survives the other tests in this file. `fixedColumnsStart`
    // covers the horizontal scrollbar and is obviously in scope; the vertical scrollbar on the same
    // grid is covered by the column header alone, because `fixedRowsTop` is 0. A per-overlay frozen
    // content check therefore cleared the bottom edge and left the inline-end edge covered: the
    // horizontal thumb was grabbable, the vertical one was not, on the commonest frozen layout there
    // is.
    //
    // The first test in this file cannot catch that - its grid has frozen content on both axes, so it
    // passes whichever question the gate asks.
    await page.evaluate(() => {
      const host = document.createElement('div');

      host.id = 'frozen-cols-grid';
      host.className = document.querySelector('[data-testid="grid"]')!.className;
      document.body.appendChild(host);

      const data = Array.from({ length: 60 }, (_, r) =>
        Array.from({ length: 25 }, (_, c) => `R${r + 1}C${c + 1}`));

      new (window as unknown as { Handsontable: new (...a: unknown[]) => unknown }).Handsontable(host, {
        data,
        colWidths: 90,
        width: 500,
        height: 260,
        rowHeaders: true,
        colHeaders: true,
        fixedColumnsStart: 3,
        // No frozen rows: the column header is the only overlay on the vertical scrollbar.
        licenseKey: 'non-commercial-and-evaluation',
      });
    });

    await expect(page.locator('#frozen-cols-grid .ht_clone_inline_start')).toBeVisible();

    // Scroll the vertical axis only, which is the axis that was broken.
    const snapshot = await page.evaluate(() => new Promise<{
      gutterX: number, gutterY: number, edges: string[], clipped: string[], bandCoversTopOfBar: boolean,
    }>((resolve) => {
      const root = document.querySelector('#frozen-cols-grid')!;
      const holder = root.querySelector('.ht_master .wtHolder') as HTMLElement;

      holder.addEventListener('scroll', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const r = holder.getBoundingClientRect();
          const topClone = root.querySelector('.ht_clone_top') as HTMLElement;

          resolve({
            gutterX: holder.offsetWidth - holder.clientWidth,
            gutterY: holder.offsetHeight - holder.clientHeight,
            edges: [...root.querySelectorAll('.htScrollbarClearanceFiller')]
              .map(el => el.getAttribute('data-ht-clearance-edge') || '?'),
            clipped: [...root.querySelectorAll('[class*="ht_clone_"]')]
              .filter(el => getComputedStyle(el).clipPath !== 'none')
              .map(el => (el.className.match(/ht_clone_\w+/) || ['?'])[0]),
            // The top of the vertical scrollbar, just inside the header - where the thumb sits when the
            // grid is near the top, and where the header used to cover the scrollbar.
            bandCoversTopOfBar: [...root.querySelectorAll('.htScrollbarClearanceFiller')].some((el) => {
              const br = el.getBoundingClientRect();
              const x = r.right - 8;
              const y = topClone.getBoundingClientRect().bottom - 6;

              return x >= br.left && x <= br.right && y >= br.top && y <= br.bottom;
            }),
          });
        }));
      }, { once: true });

      holder.scrollTop += 150;
    }));

    if (snapshot.gutterX > 0 || snapshot.gutterY > 0) {
      return;
    }

    expect(snapshot.edges).toContain('inline-end');
    expect(snapshot.clipped).toContain('ht_clone_top');
    expect(snapshot.bandCoversTopOfBar).toBe(true);
  });
});
