import { test, expect, THEMES_TAG } from '../fixtures/test';
import {
  RowHeaderWidthPerLevelPage,
  type RowHeaderWidthCase,
} from '../fixtures/pages/RowHeaderWidthPerLevelPage';

/**
 * `modifyRowHeaderWidth` sizes each row header level. The engine reads the answer twice: for the
 * `col` elements of the row headers, and for the total row header width the hider and the inline-end
 * overlay are placed with. Both must read it the same way, per level, or the frozen end column drawn
 * by the inline-end overlay sits off the column the master draws under it, and the holder scrolls past
 * the end of the table.
 */
const CASES: Array<[RowHeaderWidthCase, string]> = [
  ['rowSelection', 'row selection checkboxes in the row header'],
  ['rowSelectionWidth80', 'row selection checkboxes with rowHeaderWidth: 80'],
  ['rowSelectionPerLevel', 'row selection checkboxes with rowHeaderWidth: [60, 40]'],
  ['rowSelectionRtl', 'row selection checkboxes in a right-to-left grid'],
  ['nestedRows', 'nested rows with row selection checkboxes'],
  ['extraLevelHook', 'a modifyRowHeaderWidth handler widening every level of two'],
  ['extraLevelRowSelection', 'row selection checkboxes beside an extra row header level'],
];

test.describe('Row header width resolved per level', { tag: THEMES_TAG }, () => {
  CASES.forEach(([gridCase, label]) => {
    test(`keeps the frozen end column on its column with ${label}`, async({ page, theme, bundle }) => {
      const grid = new RowHeaderWidthPerLevelPage(page, theme, bundle);

      await grid.goto(gridCase, 'wide');

      await expect.poll(async() => {
        const { master, clone } = await grid.lastColumnEdges();

        return Math.round(clone - master);
      }).toBe(0);
    });

    test(`scrolls no further than the table with ${label}`, async({ page, theme, bundle }) => {
      const grid = new RowHeaderWidthPerLevelPage(page, theme, bundle);

      await grid.goto(gridCase, 'narrow');
      await grid.scrollToEnd();

      expect(await grid.gapAfterLastColumn()).toBe(0);

      await expect.poll(async() => {
        const { master, clone } = await grid.lastColumnEdges();

        return Math.round(clone - master);
      }).toBe(0);
    });
  });
});
