import { test, expect } from '../fixtures/test';
import { GridPage } from '../fixtures/pages/GridPage';

/**
 * The frozen bottom rows must not cover the horizontal scrollbar (#10370).
 *
 * `repositionOverlay` lifts the frozen bottom rows clear of the horizontal scrollbar. It used to lift
 * them by `getScrollbarWidth()`, which measures a probe element rather than the scroller being lifted
 * over. The two disagree whenever the holder's scrollbar is styled and the probe's is not — `.wtHolder`
 * sets `::-webkit-scrollbar`, `.htScrollbarTest` does not — and the probe then reads 0 against a real
 * gutter, so the lift is 0 and the frozen rows come to rest on top of the scrollbar. Measured in
 * Firefox 154, which honors `::-webkit-scrollbar`: a 15px gutter against a probe reading 0, and the
 * bottom overlay ending 15px below the scrollport. The inline-start overlay was unaffected, because
 * the width path already measures the holder.
 *
 * This needs a scrollbar that takes up space, and Playwright's headless Chromium is started with
 * `--hide-scrollbars`, which forces every scrollbar to zero width — the defect cannot arise there at
 * all. So this file, and only this file, drops that flag. The sibling `overlay-scrollbar-clearance`
 * spec deliberately keeps it: zero-width scrollbars are the regime its own fix is for.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

test.describe('frozen bottom rows over a space-taking scrollbar', () => {
  test('stop at the scrollport, not at the holder\'s outer edge', async ({ page, theme, bundle }) => {
    const grid = new GridPage(page, theme, bundle);

    await grid.goto();

    // Real scrollbars alone are not enough: the probe would measure the same width this holder gives
    // up, the two would agree, and the old lift would land in the right place by luck. Giving THIS
    // scroller a different thickness is what reproduces the disagreement — the probe element is not
    // covered by this rule, so it keeps reporting the browser default.
    //
    // `scrollbar-width` rather than `::-webkit-scrollbar`: the theme already sets the pseudo-element on
    // `.wtHolder`, so a second rule for it is a specificity fight, and the standard property is honored
    // by every engine this suite runs on. `!important` beats the theme's own `scrollbar-width: auto`.
    //
    // Applied before the grid exists, so the first draw already sees the final gutter. Styling it
    // afterwards needs a redraw to reach the overlays, and `refreshDimensions()` does not trigger one —
    // measured: the clone kept the offset from before the restyle and the spec failed by the 4px the
    // two scrollbars differ by.
    await page.addStyleTag({
      content: '#gutter-grid .ht_master .wtHolder { scrollbar-width: thin !important; }',
    });

    // Scrolls on both axes with rows frozen at the bottom: the one configuration where an overlay is
    // pinned to the same edge the horizontal scrollbar is drawn on.
    await page.evaluate(() => {
      const host = document.createElement('div');

      host.id = 'gutter-grid';
      host.className = document.querySelector('[data-testid="grid"]')!.className;
      document.body.appendChild(host);

      const data = Array.from({ length: 60 }, (_, r) =>
        Array.from({ length: 25 }, (_, c) => `R${r + 1}C${c + 1}`));

      (window as unknown as { gutterHot: unknown }).gutterHot =
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

    await expect(page.locator('#gutter-grid .ht_clone_bottom')).toBeVisible();

    const geometry = await page.evaluate(() => {
      const root = document.querySelector('#gutter-grid')!;
      const holder = root.querySelector('.ht_master .wtHolder') as HTMLElement;
      const holderRect = holder.getBoundingClientRect();
      const edge = (selector: string) => {
        const el = root.querySelector(selector);

        return el ? el.getBoundingClientRect().bottom : null;
      };

      // What the engine's probe reports: an unstyled scroller, which is what `getScrollbarWidth`
      // measures.
      const probe = document.createElement('div');

      probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
      document.body.appendChild(probe);
      const probed = probe.offsetHeight - probe.clientHeight;

      probe.remove();

      return {
        probed,
        gutter: holder.offsetHeight - holder.clientHeight,
        clientBottom: holderRect.top + holder.clientHeight,
        bottomEdge: edge('.ht_clone_bottom'),
        cornerEdge: edge('.ht_clone_bottom_inline_start_corner'),
      };
    });

    // The contract, and it holds in every regime: the frozen bottom rows, and the corner sharing that
    // edge, end where the scrollport does. This is the assertion the fix is about.
    expect(geometry.bottomEdge).toBeCloseTo(geometry.clientBottom, 0);
    expect(geometry.cornerEdge).toBeCloseTo(geometry.clientBottom, 0);

    // Whether it MEANS anything depends on the machine, so the regime is asserted rather than assumed.
    // Dropping `--hide-scrollbars` stops Chromium forcing zero width; it does not make the OS draw
    // classic scrollbars. On a Mac set to "Show scroll bars: Automatically" - the default, and the very
    // regime this PR exists for - the scrollbars float, every measurement below is 0, and the defect
    // cannot arise at all. Asserting a nonzero gutter there would fail on a correct build.
    const reproducible = geometry.gutter > 0 && geometry.probed > 0
      && geometry.gutter !== geometry.probed;

    if (reproducible) {
      // The discriminating case: a real gutter for an overlay to come to rest on, AND a probe that
      // disagrees about how deep it is. Lifting by the probe leaves both clones hanging over the
      // scrollbar by exactly that difference, so the two assertions above can now fail.
      expect(geometry.gutter).toBeGreaterThan(0);
      expect(geometry.probed).not.toBe(geometry.gutter);

    } else {
      // Floating scrollbars: nothing is lifted over anything, so the assertions above are true of any
      // build. Say so rather than passing quietly - a green run here is not evidence about this fix.
      // Linux CI keeps classic scrollbars and takes the branch above.
      // eslint-disable-next-line no-console
      console.log(`[#10370] gutter=${geometry.gutter} probe=${geometry.probed}: `
        + 'no space-taking scrollbar on this machine, so the lift is untested here.');
    }
  });
});
