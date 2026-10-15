import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EmptyDataStateClippedContainerPage } from '../fixtures/pages/EmptyDataStateClippedContainerPage';

const EDGE_TOLERANCE_PX = 0.5;

/**
 * The empty data state overlay must leave a horizontal scrollbar uncovered, or the user cannot scroll
 * the columns while the grid is empty.
 *
 * This needs a scrollbar that takes up space, and Playwright's headless Chromium is started with
 * `--hide-scrollbars`, which forces every scrollbar to zero width. So this file, and only this file,
 * drops that flag (a launch option cannot be set inside a `describe`, hence the separate file). The
 * sibling `empty-data-state-clipped-container` spec keeps the flag.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

test.describe('empty data state over a space-taking scrollbar in a container that clips its overflow', { tag: THEMES_TAG }, () => {
  test('with `height: auto` the overlay ends above the horizontal scrollbar', async({ page, theme, bundle }) => {
    const edsPage = new EmptyDataStateClippedContainerPage(page, theme, bundle);

    await edsPage.goto({ columns: true, wide: true, height: 'auto' });

    const geometry = await edsPage.geometry();

    // The scrollbar track is the part of the holder that its client area leaves out.
    expect(geometry.rootBottom - geometry.holderClientBottom, 'a horizontal scrollbar takes up space')
      .toBeGreaterThan(0);
    expect(geometry.overlayBottom, 'overlay bottom vs the scrollbar top')
      .toBeLessThanOrEqual(geometry.holderClientBottom + EDGE_TOLERANCE_PX);
    expect(geometry.overlayBottom - geometry.overlayTop, 'overlay height').toBeGreaterThan(0);
  });
});
