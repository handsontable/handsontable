import { test, expect, type Page } from '@playwright/test';

/**
 * Fails when a docs example does not lay out its grid: collapsed, too short to show a row, wider
 * than its own root, cut off by the example, or missing.
 *
 * Between #13381 (2026-09-18) and #13626 (2026-09-24) every `height: 'auto'` example grid on the
 * develop docs rendered with a 0px `.ht_master .wtHolder` - each example sits in an
 * `overflow: hidden` `.hot-example`, which the engine took for a heightless scroll owner - and
 * nothing failed. `exampleInitialRender.spec.ts` reads a cell's text and counts `tbody tr`, which
 * both stay true in the DOM of a grid collapsed to 0px, and its demo grid has a fixed height the
 * bug never touched. The docs visual seed wrote the blank grids into the golden records 21 times,
 * and a docs pull request's visual run then reported that all 437 screenshots matched.
 *
 * So this spec reads the layout facts directly, for every example on the page:
 *
 * - the example rendered a grid (the example runner removes the loading overlay whether or not
 *   the example mounted);
 * - the master holder has a height (0px is the collapse above), and it is tall enough to show at
 *   least one whole row;
 * - the master holder is no wider than the grid root it sits in. #13381 made it wider as well, and
 *   #13626 did not fix that: on 2026-09-25 the develop staging deploy had a holder 33 to 35px
 *   wider than its root on 819 of its 976 example grids;
 * - the example wrapper cuts nothing off the grid. A holder or a root that reaches past the
 *   wrapper's padding box loses that part to its `overflow: hidden`.
 *
 * `.github/actions/docs-visual-run/action.yml` runs this spec, with `--fail-on-flaky-tests`, before
 * every render that writes golden records (a seed, a re-seed dispatch, a pull request bootstrap),
 * and renders nothing when it fails. Every docs pull request runs it too, in the `functional`
 * project.
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
 * Measures every example on the page and the grids it rendered, in document order.
 *
 * @param page The docs page.
 * @returns One entry per example: its id, and per grid the holder's and the root's size, whether
 * the holder shows a whole row, and how many pixels the example wrapper cuts off each side.
 */
function measureExamples(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('.hot-example-preview'), (preview, index) => {
    // The wrapper is `overflow: hidden`, so it cuts off whatever reaches past its padding box.
    const wrapper = preview.closest<HTMLElement>('.hot-example') ?? preview;
    const clipLeft = wrapper.getBoundingClientRect().left + wrapper.clientLeft;
    const clipRight = clipLeft + wrapper.clientWidth;

    return {
      example: wrapper.id.replace(/^hot-example-/, '') || `example ${index + 1}`,
      grids: Array.from(preview.querySelectorAll<HTMLElement>('.ht_master .wtHolder'), (holder) => {
        // `.ht_master` is a direct child of the grid root: the `.ht-wrapper` element that core creates
        // inside the container the grid was created on.
        const root = holder.closest('.ht_master')?.parentElement;
        const holderRect = holder.getBoundingClientRect();
        const rootRect = root?.getBoundingClientRect() ?? holderRect;
        const viewportTop = holderRect.top + holder.clientTop;
        const viewportBottom = viewportTop + holder.clientHeight;
        const rows = Array.from(holder.querySelector<HTMLTableElement>('table.htCore')?.tBodies[0]?.rows ?? []);

        return {
          holderHeight: holder.offsetHeight,
          holderWidth: holder.offsetWidth,
          rootWidth: root?.offsetWidth ?? 0,
          showsARow: rows.some((row) => {
            const rowRect = row.getBoundingClientRect();

            return rowRect.height > 0 && rowRect.top >= viewportTop - 1 && rowRect.bottom <= viewportBottom + 1;
          }),
          cutOffLeft: Math.max(0, Math.floor(clipLeft - Math.min(holderRect.left, rootRect.left))),
          cutOffRight: Math.max(0, Math.floor(Math.max(holderRect.right, rootRect.right) - clipRight)),
        };
      }),
    };
  }));
}

/**
 * Lists what is wrong with the measured examples, one line per broken fact.
 *
 * @param examples The measurements from `measureExamples()`.
 * @returns The problems; empty when every example laid out its grid.
 */
function layoutProblems(examples: Awaited<ReturnType<typeof measureExamples>>): string[] {
  if (examples.length === 0) {
    return ['no example on the page'];
  }

  return examples.flatMap(({ example, grids }) => {
    if (grids.length === 0) {
      return [`${example}: no grid rendered`];
    }

    return grids.flatMap(({ holderHeight, holderWidth, rootWidth, showsARow, cutOffLeft, cutOffRight }) => {
      const problems: string[] = [];

      if (holderHeight === 0) {
        problems.push(`${example}: the master .wtHolder is 0px tall`);
      } else if (!showsARow) {
        problems.push(`${example}: the master .wtHolder is ${holderHeight}px tall, too short to show a whole row`);
      }
      if (holderWidth > rootWidth) {
        problems.push(`${example}: the master .wtHolder is ${holderWidth}px wide in a ${rootWidth}px grid root`);
      }
      if (cutOffLeft > 0) {
        problems.push(`${example}: the example wrapper cuts ${cutOffLeft}px off the grid's left edge`);
      }
      if (cutOffRight > 0) {
        problems.push(`${example}: the example wrapper cuts ${cutOffRight}px off the grid's right edge`);
      }

      return problems;
    });
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
    test(`${prefix} ${slug}: every example lays out its grid`, async({ page, baseURL }) => {
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
        const examples = await measureExamples(page);
        const signature = JSON.stringify(examples);
        const settled = signature === previous;

        previous = signature;

        return settled ? layoutProblems(examples) : ['the example grids are still settling'];
      }, {
        message: `every example on ${path} lays out its grid`,
        timeout: 15000,
      }).toEqual([]);
    });
  });
});
