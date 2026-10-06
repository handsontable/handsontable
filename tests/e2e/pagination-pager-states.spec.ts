import { test, expect } from '../fixtures/test';
import { PaginationPagerPage, type PageFit } from '../fixtures/pages/PaginationPagerPage';

/**
 * The pager states the visual suite's `/pagination-demo` route photographed, asserted from the DOM and
 * the plugin's API on every theme and bundle: what the first, previous, next and last buttons do to the
 * page, the counter and the buttons' disabled states, and where the focus goes when the button it was
 * on turns disabled; the pager mirrored in RTL; a page size changed on a filtered, sorted grid; and the
 * auto page size, which must fill each page with as many rows as fit, in a 450 px grid and in a grid the
 * window scrolls, and re-page when that height shrinks to 300 px. The captures that stay under
 * `visual-tests/tests/js-only/pagination/` are of how the pager looks.
 */

const TOLERANCE_PX = 0.5;

/**
 * Asserts that the page on screen fits the height it is given with nothing cut off: its rows sum to
 * less than that height, and neither the holder nor the window scrolls.
 *
 * @param {PageFit} fit The page's fit.
 */
function expectPageToFit(fit: PageFit) {
  const total = fit.rowHeights.reduce((sum, height) => sum + height, 0);

  expect(fit.rowHeights.length).toBeGreaterThan(0);
  expect(total, `${fit.rowHeights.length} rows in ${fit.available} px`).toBeLessThan(fit.available + TOLERANCE_PX);
  expect(fit.holderScrolls).toBe(false);
  expect(fit.windowScrolls).toBe(false);
}

/**
 * Asserts that a page holds as many rows as fit: the first row of the page after it would not.
 *
 * @param {PageFit} fit The page's fit.
 * @param {number} nextRowHeight The rendered height of the first row of the next page.
 */
function expectPageToBeFull(fit: PageFit, nextRowHeight: number) {
  const total = fit.rowHeights.reduce((sum, height) => sum + height, 0);

  expect(total + nextRowHeight, `the next page's first row (${nextRowHeight} px) would have fit in ${fit.available} px`)
    .toBeGreaterThanOrEqual(fit.available - TOLERANCE_PX);
}

test.describe('pagination pager states', () => {
  test('the buttons move the page, disable at each end and hand the focus to the enabled neighbor', async({
    page, theme, bundle,
  }) => {
    const pagerPage = new PaginationPagerPage(page, theme, bundle);

    await pagerPage.goto();

    await expect(pagerPage.counter).toHaveText('1 - 10 of 100');
    await expect(pagerPage.navigationLabel).toHaveText('Page 1 of 10');
    await pagerPage.expectDisabled(['first', 'prev']);
    expect((await pagerPage.renderedRowHeaders())[0]).toBe('1');

    // Last disables itself, so the focus moves to Previous.
    await pagerPage.go('last', 10);
    await expect(pagerPage.counter).toHaveText('91 - 100 of 100');
    await expect(pagerPage.navigationLabel).toHaveText('Page 10 of 10');
    await pagerPage.expectDisabled(['next', 'last']);
    await expect(pagerPage.button('prev')).toBeFocused();
    expect((await pagerPage.renderedRowHeaders())[0]).toBe('91');

    // First disables itself and Previous, so the focus moves to Next.
    await pagerPage.go('first', 1);
    await expect(pagerPage.counter).toHaveText('1 - 10 of 100');
    await pagerPage.expectDisabled(['first', 'prev']);
    await expect(pagerPage.button('next')).toBeFocused();

    await pagerPage.go('next', 2);
    await pagerPage.go('next', 3);
    await expect(pagerPage.counter).toHaveText('21 - 30 of 100');
    await expect(pagerPage.navigationLabel).toHaveText('Page 3 of 10');
    await pagerPage.expectDisabled([]);
    await expect(pagerPage.button('next')).toBeFocused();
    expect((await pagerPage.renderedRowHeaders())[0]).toBe('21');

    await pagerPage.go('prev', 2);
    await expect(pagerPage.counter).toHaveText('11 - 20 of 100');
    await pagerPage.expectDisabled([]);
    await expect(pagerPage.button('prev')).toBeFocused();
  });

  test('in an RTL grid the pager mirrors: its sections and buttons run from right to left', async({
    page, theme, bundle,
  }) => {
    const pagerPage = new PaginationPagerPage(page, theme, bundle);

    // The LTR control first.
    await pagerPage.goto();

    const ltr = await pagerPage.pagerLayout();

    expect(ltr.pageSize.right).toBeLessThanOrEqual(ltr.counter.left);
    expect(ltr.counter.right).toBeLessThanOrEqual(ltr.navigation.left);
    ['first', 'prev', 'label', 'next', 'last'].reduce((previous, part) => {
      expect(ltr[previous].right, `${previous} before ${part}`).toBeLessThanOrEqual(ltr[part].left + TOLERANCE_PX);

      return part;
    });

    await pagerPage.goto({ dir: 'rtl' });

    const rtl = await pagerPage.pagerLayout();

    expect(rtl.pageSize.left).toBeGreaterThanOrEqual(rtl.counter.right);
    expect(rtl.counter.left).toBeGreaterThanOrEqual(rtl.navigation.right);
    ['first', 'prev', 'label', 'next', 'last'].reduce((previous, part) => {
      expect(rtl[previous].left, `${previous} before ${part}`).toBeGreaterThanOrEqual(rtl[part].right - TOLERANCE_PX);

      return part;
    });

    // The same logic, mirrored: Last still disables the far end and hands the focus to Previous.
    await pagerPage.go('last', 10);
    await pagerPage.expectDisabled(['next', 'last']);
    await expect(pagerPage.button('prev')).toBeFocused();
  });

  test('a page size picked on a filtered, sorted grid re-pages it, the auto size included', async({
    page, theme, bundle,
  }) => {
    const pagerPage = new PaginationPagerPage(page, theme, bundle);

    await pagerPage.goto();

    // The demo's data keeps 44 of its 100 rows under the filter.
    expect(await pagerPage.filterAndSort()).toBe(44);
    await expect(pagerPage.counter).toHaveText('1 - 10 of 44');
    await pagerPage.go('last', 5);
    await expect(pagerPage.counter).toHaveText('41 - 44 of 44');

    // Fifty a page holds the whole filtered set, so the page clamps from 5 to the only one.
    await pagerPage.choosePageSize('50');
    await expect.poll(async() => (await pagerPage.paginationData()).totalPages).toBe(1);
    await expect(pagerPage.counter).toHaveText('1 - 44 of 44');
    await expect(pagerPage.navigationLabel).toHaveText('Page 1 of 1');
    await pagerPage.expectDisabled(['first', 'prev', 'next', 'last']);
    // The grid repaints from the first row, not only the pager: the page it left held rows 41 to 44.
    await expect.poll(async() => (await pagerPage.renderedRowHeaders()).slice(0, 5)).toEqual(['1', '2', '3', '4', '5']);

    const countries = await pagerPage.pageColumnValues(8);

    expect(countries).toHaveLength(44);
    expect(countries).toEqual([...countries].sort((a, b) => String(a).localeCompare(String(b))));

    await pagerPage.choosePageSize('auto');
    await expect.poll(async() => (await pagerPage.paginationData()).autoPageSize).toBe(true);

    const auto = await pagerPage.paginationData();

    expect(auto.currentPage).toBe(1);
    expect(auto.totalPages).toBeGreaterThan(1);
    expectPageToFit(await pagerPage.pageFit());
    await expect(pagerPage.counter).toHaveText(`1 - ${auto.lastVisibleRowIndex + 1} of 44`);

    await pagerPage.go('next', 2);
    expectPageToFit(await pagerPage.pageFit());

    // Twenty a page from page 2 stays on page 2.
    await pagerPage.choosePageSize('20');
    await expect.poll(async() => (await pagerPage.paginationData()).autoPageSize).toBe(false);
    await expect(pagerPage.counter).toHaveText('21 - 40 of 44');
    await expect(pagerPage.navigationLabel).toHaveText('Page 2 of 3');
    await pagerPage.expectDisabled([]);
    await expect.poll(async() => (await pagerPage.renderedRowHeaders()).slice(0, 5))
      .toEqual(['21', '22', '23', '24', '25']);
  });

  test('the auto page size fills every page of a 450 px grid, and re-pages when the grid shrinks to 300 px', async({
    page, theme, bundle,
  }) => {
    const pagerPage = new PaginationPagerPage(page, theme, bundle);

    await pagerPage.goto({ pageSize: 'auto' });
    await pagerPage.filterAndSort();
    await expect(pagerPage.pageSizeSelect).toHaveValue('auto');

    let fit = await pagerPage.pageFit();

    expectPageToFit(fit);

    for (let pageNumber = 2; pageNumber <= 4; pageNumber++) {
      await pagerPage.go('next', pageNumber);

      const nextFit = await pagerPage.pageFit();

      expectPageToBeFull(fit, nextFit.rowHeights[0]);
      expectPageToFit(nextFit);
      fit = nextFit;
    }

    const tall = await pagerPage.paginationData();

    await page.evaluate(() => (window as unknown as { hot: { updateSettings(settings: object): void } })
      .hot.updateSettings({ height: 300 }));
    await expect.poll(async() => (await pagerPage.paginationData()).totalPages).toBeGreaterThan(tall.totalPages);

    const short = await pagerPage.pageFit();

    expectPageToFit(short);
    expect(short.available).toBeLessThan(fit.available);

    const { currentPage } = await pagerPage.paginationData();

    await pagerPage.go('prev', currentPage - 1);

    const previous = await pagerPage.pageFit();

    expectPageToFit(previous);
    expectPageToBeFull(previous, short.rowHeights[0]);

    const { totalPages } = await pagerPage.paginationData();

    await pagerPage.go('last', totalPages);
    expectPageToFit(await pagerPage.pageFit());
    await pagerPage.expectDisabled(['next', 'last']);
  });

  test('the auto page size fits each page to the window when the grid has no height, and re-pages when the '
    + 'window shrinks to 300 px', async({ page, theme, bundle }) => {
    const pagerPage = new PaginationPagerPage(page, theme, bundle);

    await pagerPage.goto({ pageSize: 'auto', size: 'window' });
    await pagerPage.filterAndSort();

    let fit = await pagerPage.pageFit();

    expectPageToFit(fit);

    for (let pageNumber = 2; pageNumber <= 3; pageNumber++) {
      await pagerPage.go('next', pageNumber);

      const nextFit = await pagerPage.pageFit();

      expectPageToBeFull(fit, nextFit.rowHeights[0]);
      expectPageToFit(nextFit);
      fit = nextFit;
    }

    const tall = await pagerPage.paginationData();
    const viewport = page.viewportSize();

    await page.setViewportSize({ width: viewport!.width, height: 300 });
    // The window's resize re-pages on its own, after the event.
    await expect.poll(async() => (await pagerPage.paginationData()).totalPages).toBeGreaterThan(tall.totalPages);
    await expect.poll(async() => (await pagerPage.pageFit()).windowScrolls).toBe(false);

    const short = await pagerPage.pageFit();

    expectPageToFit(short);

    const { currentPage } = await pagerPage.paginationData();

    await pagerPage.go('prev', currentPage - 1);

    const previous = await pagerPage.pageFit();

    expectPageToFit(previous);
    expectPageToBeFull(previous, short.rowHeights[0]);

    const { totalPages } = await pagerPage.paginationData();

    await pagerPage.go('last', totalPages);
    expectPageToFit(await pagerPage.pageFit());
  });
});
