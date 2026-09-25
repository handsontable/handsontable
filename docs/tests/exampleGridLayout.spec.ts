import { test, expect, type Page } from '@playwright/test';

/**
 * Fails when a docs example grid is laid out collapsed, or wider than its own root.
 *
 * Between #13381 (2026-09-18) and #13626 (2026-09-24) every `height: 'auto'` example grid on the
 * develop docs rendered with a 0px `.ht_master .wtHolder` - each example sits in an
 * `overflow: hidden` `.hot-example`, which the engine took for a heightless scroll owner - and
 * nothing failed. `exampleInitialRender.spec.ts` reads a cell's text and counts `tbody tr`, which
 * both stay true in the DOM of a grid collapsed to 0px, and its demo grid has a fixed height the
 * bug never touched. The docs visual seed wrote the blank grids into the golden records 21 times,
 * and a docs pull request's visual run then reported that all 437 screenshots matched.
 *
 * So this spec reads two layout facts directly, for every example grid on the page:
 *
 * - the master holder has a height (0px is the collapse above);
 * - the master holder is no wider than the grid root it sits in. A wider holder spills past the
 *   root, and the example wrapper clips it, cutting off the grid's right edge. #13381 introduced
 *   that as well, and #13626 did not fix it: on 2026-09-25 the develop staging deploy had a holder
 *   33 to 35px wider than its root on 819 of its 976 example grids.
 *
 * `.github/actions/docs-visual-run/action.yml` runs this spec before every render that writes
 * golden records (a seed, a re-seed dispatch, a pull request bootstrap) and renders nothing when it
 * fails, so a render that breaks either fact never becomes the baseline. Every docs pull request
 * runs it too, in the `functional` project.
 */

/**
 * One page per root-size shape the docs examples use, counted over every example grid on the
 * develop staging deploy on 2026-09-25 (976 grids on 445 pages).
 */
const PAGES = [
  // `height: 'auto'` and no width - 721 of the 976 grids.
  'row-height',
  // `height: 'auto'` with `width: '100%'`, seven grids.
  'column-width',
  // `height: 'auto'` with `width: 'auto'`.
  'batch-operations',
  // A fixed pixel height, on the demo page.
  'demo',
  // A fixed pixel width and height, and 100% of a sized parent.
  'grid-size',
];

const FRAMEWORKS = [
  { prefix: 'js', urlPath: 'javascript-data-grid' },
  { prefix: 'react', urlPath: 'react-data-grid' },
  { prefix: 'angular', urlPath: 'angular-data-grid' },
  { prefix: 'vue', urlPath: 'vue-data-grid' },
];

/**
 * Measures every example grid on the page, in document order.
 *
 * @param page The docs page.
 * @returns One entry per grid: its example's id and the holder's and the root's size in pixels.
 */
function measureExampleGrids(page: Page) {
  return page.evaluate(() => Array.from(
    document.querySelectorAll<HTMLElement>('.hot-example-preview .ht_master .wtHolder'),
    (holder, index) => {
      // `.ht_master` is a direct child of the grid root, the `.ht-wrapper` the grid was created on.
      const root = holder.closest('.ht_master')?.parentElement;

      return {
        grid: holder.closest('.hot-example')?.id.replace(/^hot-example-/, '') || `grid ${index + 1}`,
        holderHeight: holder.offsetHeight,
        holderWidth: holder.offsetWidth,
        rootWidth: root?.offsetWidth ?? 0,
      };
    },
  ));
}

/**
 * Lists what is wrong with the measured grids, one line per broken fact.
 *
 * @param grids The measurements from `measureExampleGrids()`.
 * @returns The problems; empty when every grid is laid out.
 */
function layoutProblems(grids: Awaited<ReturnType<typeof measureExampleGrids>>): string[] {
  if (grids.length === 0) {
    return ['no example grid rendered on the page'];
  }

  return grids.flatMap(({ grid, holderHeight, holderWidth, rootWidth }) => {
    const problems: string[] = [];

    if (holderHeight === 0) {
      problems.push(`${grid}: the master .wtHolder is 0px tall`);
    }
    if (holderWidth > rootWidth) {
      problems.push(`${grid}: the master .wtHolder is ${holderWidth}px wide in a ${rootWidth}px grid root`);
    }

    return problems;
  });
}

test.beforeEach(async({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');
  const extractedDomain = url.hostname;

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain: extractedDomain,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ? process.env.PASS_COOKIE : '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
});

FRAMEWORKS.forEach(({ prefix, urlPath }) => {
  PAGES.forEach((slug) => {
    test(`${prefix} ${slug}: every example grid has a height and fits its root`, async({ page, baseURL }) => {
      const path = `/${urlPath}/${slug}`;

      await page.goto(`${baseURL}${path}`);
      await expect(page.getByText('We are verifying your connection')).toHaveCount(0, { timeout: 30000 });
      await expect(page.getByText('Page not found (404)')).toHaveCount(0);
      await expect(page.getByText('Password protected site')).toHaveCount(0);
      await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, { timeout: 30000 });

      /*
       * The loading overlay can clear before a grid exists: the runner marks a React example loaded
       * right after `root.render()`, which commits later. So judge the grids only once two samples
       * in a row agree. A broken layout cannot pass on an early frame either - on the #13381
       * deploy, every frame after the overlays cleared already showed the problem.
       */
      let previous = '';

      await expect.poll(async() => {
        const grids = await measureExampleGrids(page);
        const signature = JSON.stringify(grids);
        const settled = signature === previous;

        previous = signature;

        return settled ? layoutProblems(grids) : ['the example grids are still settling'];
      }, {
        message: `every example grid on ${path} has a height and fits inside its root`,
        timeout: 15000,
      }).toEqual([]);
    });
  });
});
