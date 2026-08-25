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

    // Non-vacuity, and the reason this file overrides the launch flags. Both halves matter: a real
    // gutter for an overlay to sit on top of, and a probe that disagrees about how deep it is. Without
    // the second, everything below holds just as well for a grid that never had the defect.
    expect(geometry.gutter).toBeGreaterThan(0);
    expect(geometry.probed).toBeGreaterThan(0);
    expect(geometry.gutter).not.toBe(geometry.probed);

    // The contract. Lifting by the probe instead leaves both of these hanging over the scrollbar by the
    // difference the two assertions above just established.
    expect(geometry.bottomEdge).toBeCloseTo(geometry.clientBottom, 0);
    expect(geometry.cornerEdge).toBeCloseTo(geometry.clientBottom, 0);
  });
});
