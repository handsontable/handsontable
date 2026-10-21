import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { layoutProblems as judgeLayout } from './example-grid-layout-problems.mjs';

/**
 * Measures whether a docs example laid out its grid: collapsed, too short to show a row, wider than its
 * own root, cut off by the example, or missing.
 *
 * Two specs read it. `exampleGridLayout.spec.ts` checks five pages in every framework, on every docs pull
 * request and as the fast check before a seed renders. `visualDocs.spec.ts` checks every page it
 * photographs, on the same page load, when `DOCS_VISUAL_LAYOUT_GATE` is set. The docs-visual-run action
 * sets it only for the render that writes golden records, so a grid that collapses on some loads can
 * never become a golden, whichever load the separate check happened to see.
 *
 * Between #13381 (2026-09-18) and #13626 (2026-09-24) every `height: 'auto'` example grid on the develop
 * docs rendered with a 0px `.ht_master .wtHolder` - each example sits in an `overflow: hidden`
 * `.hot-example`, which the engine took for a heightless scroll owner - and nothing failed.
 * `exampleInitialRender.spec.ts` reads a cell's text and counts `tbody tr`, which both stay true in the
 * DOM of a grid collapsed to 0px. The docs visual seed wrote the blank grids into the golden records 21
 * times, and a docs pull request's visual run then reported that all 437 screenshots matched.
 *
 * So this reads the layout facts directly, for every example on the page:
 *
 * - the example rendered a grid (the example runner removes the loading overlay whether or not the
 *   example mounted);
 * - the master holder has a height (0px is the collapse above), and, when the grid has body rows, it is
 *   tall enough to show at least one whole row. A grid with no rows (an empty-data state, a loading
 *   state, a server-side grid before its data arrives) has nothing to show and is judged on its height
 *   alone: a scan of every page on the last deploy before #13381 found nine such pages, each with a
 *   healthy 30 to 300px holder, and a row check there would fail every seed for no reason;
 * - the master holder is no wider than the grid root it sits in. #13381 made it wider as well, and #13626
 *   did not fix that: on 2026-09-25 the develop staging deploy had a holder 33 to 35px wider than its
 *   root on 819 of its 976 example grids;
 * - the example wrapper cuts nothing off the grid root. A root that reaches past the wrapper's padding
 *   box loses that part to its `overflow: hidden`. The holder is measured against its root instead:
 *   `.ht_master` is `overflow: hidden` too, so a holder wider than its root is clipped at the root's
 *   edge, and counting that twice would send whoever fixes a core sizing bug to the docs wrapper CSS.
 */

/**
 * Measures every example on the page and the grids it rendered, in document order.
 *
 * @param page The docs page.
 * @returns One entry per example: its id, and per grid the holder's and the root's size, how many body
 * rows it rendered and whether the holder shows a whole one, and how many pixels the example wrapper
 * cuts off each side of the root.
 */
export function measureExamples(page: Page) {
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
          rowCount: rows.length,
          showsARow: rows.some((row) => {
            const rowRect = row.getBoundingClientRect();

            return rowRect.height > 0 && rowRect.top >= viewportTop - 1 && rowRect.bottom <= viewportBottom + 1;
          }),
          cutOffLeft: Math.max(0, Math.floor(clipLeft - rootRect.left)),
          cutOffRight: Math.max(0, Math.floor(rootRect.right - clipRight)),
        };
      }),
    };
  }));
}

export type ExampleLayout = Awaited<ReturnType<typeof measureExamples>>;

/**
 * Lists what is wrong with the measured examples, one line per broken fact. The judgement is plain
 * JavaScript with no imports (`./example-grid-layout-problems.mjs`), so the tooling suite unit-tests it
 * without installing Playwright.
 *
 * @param examples The measurements from `measureExamples()`.
 * @returns The problems; empty when every example laid out its grid.
 */
export function layoutProblems(examples: ExampleLayout): string[] {
  return judgeLayout(examples);
}

/**
 * Measures the page once two samples in a row agree, and returns that measurement.
 *
 * The loading overlay can clear before a grid exists: the runner marks a React example loaded right
 * after `root.render()`, which commits later. So the grids are judged only once they stop changing. A
 * broken layout cannot pass on an early frame either: on the #13381 deploy, every frame after the
 * overlays cleared already showed the problem. Settled is where this stops, broken or not, so a page
 * that settles broken fails at once instead of polling out its timeout.
 *
 * @param page The docs page, with its loading overlays gone.
 * @param timeout How long the grids may take to stop changing.
 * @returns The settled measurement.
 */
export async function settledExamples(page: Page, timeout = 15000): Promise<ExampleLayout> {
  let previous = '';
  let examples: ExampleLayout = [];

  await expect.poll(async() => {
    examples = await measureExamples(page);

    const signature = JSON.stringify(examples);
    const settled = signature === previous;

    previous = signature;

    return settled;
  }, {
    message: 'the example grids stop changing',
    timeout,
  }).toBe(true);

  return examples;
}
