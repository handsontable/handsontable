import { test, expect } from '../fixtures/test';
import { EmptyDataStateLoadingSizePage } from '../fixtures/pages/EmptyDataStateLoadingSizePage';

/**
 * The loading overlay turns on from `beforeDataProviderFetch`, outside any render. It used to be
 * sized only after a render, so between the fetch start and the next render it kept the size it had
 * the last time it was on screen: wider than a grid that shrank since then (spilling over the page
 * and the pager), or narrower than one that grew.
 *
 * Each test changes the grid width or height while the overlay is hidden, starts a fetch from the
 * pager, and checks the overlay against the size a render gives it. Comparing to a render keeps the
 * assertion free of theme-dependent pixel values.
 */
test.describe('emptyDataState loading overlay shown between renders', () => {
  let grid: EmptyDataStateLoadingSizePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EmptyDataStateLoadingSizePage(page, theme, bundle);
    await grid.goto();
  });

  test('fits a grid that became narrower since the overlay was last shown', async() => {
    await grid.nextPageFromPager();

    const wideSize = await grid.overlaySize();

    await grid.releaseFetch();
    await grid.setGridWidth(450);
    await grid.nextPageFromPager();

    const shownSize = await grid.overlaySize();

    expect(shownSize.width).toBeLessThan(wideSize.width);
    expect(shownSize).toEqual(await grid.overlaySizeAfterRender());

    await grid.releaseFetch();
  });

  test('fits a grid that became wider since the overlay was last shown', async() => {
    await grid.setGridWidth(450);
    await grid.nextPageFromPager();

    const narrowSize = await grid.overlaySize();

    await grid.releaseFetch();
    await grid.setGridWidth(900);
    await grid.nextPageFromPager();

    const shownSize = await grid.overlaySize();

    expect(shownSize.width).toBeGreaterThan(narrowSize.width);
    expect(shownSize).toEqual(await grid.overlaySizeAfterRender());

    await grid.releaseFetch();
  });

  test('leaves the pager uncovered on a grid that became shorter since the overlay was last shown', async() => {
    await grid.nextPageFromPager();

    const tallSize = await grid.overlaySize();

    await grid.releaseFetch();
    await grid.setGridHeight(180);
    await grid.nextPageFromPager();

    const shownSize = await grid.overlaySize();

    expect(shownSize.height).toBeLessThan(tallSize.height);
    expect(await grid.overlayOverlapWithPager()).toBeLessThanOrEqual(0);
    expect(shownSize).toEqual(await grid.overlaySizeAfterRender());

    await grid.releaseFetch();
  });
});
