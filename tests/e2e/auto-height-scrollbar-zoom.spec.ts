import { test, expect } from '../fixtures/test';
import { AutoHeightScrollbarZoomPage } from '../fixtures/pages/AutoHeightScrollbarZoomPage';

/**
 * DEV-2525: a `height: 'auto'` grid grew scrollbars it should never have whenever the browser
 * rendered below 100% — a zoom level under 100%, or Windows display scaling under 100%.
 *
 * The grid's scroll box is sized from a sum, and the sum dropped two sub-pixel terms: the cells'
 * bottom border, which a browser cannot paint thinner than one device pixel (1.111px at 90%,
 * 1.25px at 80%), and the column header height, read through the whole-pixel `offsetHeight`. The
 * box came out a fraction shorter than the table inside it and the browser answered with a
 * vertical scrollbar — then that bar took ~15px of width from columns already stretched to the
 * full width, and a horizontal scrollbar followed it in.
 *
 * The shortfall is a CONSTANT, not a per-row drift (that part is #6280, fixed separately and
 * covered by `row-height-device-scale.spec.ts`), so the 5-row case matters as much as the 40-row
 * one and both are run here.
 *
 * WHICH ASSERTION DISCRIMINATES, and why the file carries both kinds. `the scroll box holds the
 * whole table` is the one that fails on the unfixed code here — all eight of its cases do. The two
 * scrollbar assertions do NOT: this fixture drives the zoom through CSS `zoom`, which leaves
 * `devicePixelRatio` at 1, and at that ratio Chrome rounds a sub-pixel overflow away instead of
 * painting a bar. They still earn their place — they pin the user-visible contract, and they are
 * what a return of the pre-#13269 per-row accumulation (whole pixels, not a fraction) would trip —
 * but they are a backstop here, not the proof.
 *
 * Under a real `--force-device-scale-factor` the bar IS painted from the same fraction, and that is
 * where the defect was measured: 12 device scales from 0.5 to 1.25, in the standalone harness at
 * `PLAN-DEV-2525-zoom-repro/`. That harness cannot run inside these projects, because the launch
 * flag needs `viewport: null` and every project's `devices['Desktop Chrome']` pins
 * `deviceScaleFactor` instead — the same constraint `row-height-device-scale.spec.ts` documents.
 */

const ZOOMS = [0.9, 0.8, 0.75, 0.67];

test.describe('auto-height grid below 100% zoom', () => {
  let grid: AutoHeightScrollbarZoomPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoHeightScrollbarZoomPage(page, theme, bundle);
  });

  test('the leg really runs the theme it claims', async({ theme }) => {
    // Guards the matrix itself. The fixture links the theme stylesheet, but the rules only apply
    // through the container's `ht-theme-*` class — miss it and all six legs render the default
    // theme while reporting as three.
    await grid.goto(0.9);
    expect(await grid.activeTheme()).toBe(`ht-theme-${theme}`);
  });

  test('the zoom really inflated the cell border', async() => {
    // Guards every assertion below: no inflated border means no defect to catch, and the rest of
    // this file would pass on code that still has it. 1px is the declared width.
    await grid.goto(0.9);
    expect(await grid.cellBorderBottomWidth()).toBeGreaterThan(1);
  });

  test('a grid at 100% has no scrollbars — the control', async() => {
    await grid.goto(1);

    const { vertical, horizontal } = await grid.scrollbarSizes();

    expect(vertical).toBe(0);
    expect(horizontal).toBe(0);
  });

  for (const zoom of ZOOMS) {
    for (const rows of [5, 40]) {
      test(`no vertical scrollbar at ${zoom * 100}% with ${rows} rows`, async() => {
        await grid.goto(zoom, rows);

        expect((await grid.scrollbarSizes()).vertical).toBe(0);
      });

      test(`no horizontal scrollbar at ${zoom * 100}% with ${rows} rows`, async() => {
        // The second half of the symptom, and the one the reporters saw first: the columns are
        // stretched to the width left over after a vertical scrollbar, so an unwanted vertical
        // bar drags a horizontal one in behind it.
        await grid.goto(zoom, rows);

        expect((await grid.scrollbarSizes()).horizontal).toBe(0);
      });

      test(`the scroll box holds the whole table at ${zoom * 100}% with ${rows} rows`, async() => {
        // The mechanism itself, measured directly. Any positive number here is a box shorter than
        // its own content, which is what the browser turns into a scrollbar.
        await grid.goto(zoom, rows);

        expect(await grid.tableOverflowBelowScrollBox()).toBeLessThanOrEqual(0);
      });

      test(`the correction leaves no visible gap at ${zoom * 100}% with ${rows} rows`, async() => {
        // The other edge. The box is rounded up to the next device pixel, so the slack it adds is
        // bounded by one physical pixel — the smallest distance a screen can show. A tolerance of
        // 2 CSS px keeps this honest at 67%, where one device pixel is ~1.5 CSS px, while still
        // failing a correction that overshot by a whole row.
        await grid.goto(zoom, rows);

        expect(await grid.deadSpaceBelowTable()).toBeLessThanOrEqual(2);
      });
    }
  }
});
