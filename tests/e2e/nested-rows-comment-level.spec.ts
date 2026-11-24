import { type Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedRowsTreegridPage } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * The level of a nested row is drawn as the cell's `::after` content. VoiceOver reads a cell's content in
 * the order of its boxes on screen, so the 1px level box sits at the cell's bottom/inline-end corner, after
 * the text. The Comments indicator is the same `::after`: a zero-size box whose borders draw the triangle. A
 * commented cell of a nested row must keep the triangle exactly as a commented cell of a plain grid draws
 * it, and still end its name with the level. The cell's size and the triangle's borders are the theme's, so
 * the spec runs on every theme.
 */

/**
 * The computed box of the master copy of a cell's `::after`, which is the Comments indicator's triangle on
 * a commented cell, with the content it draws.
 *
 * @param page The page.
 * @param row Visual row index.
 * @param column Visual column index.
 */
function afterBox(page: Page, row: number, column: number): Promise<Record<string, string>> {
  return page.locator('[data-testid="grid"] .ht_master').getByTestId(`cell-${row}-${column}`)
    .evaluate((TD) => {
      const style = getComputedStyle(TD, '::after');

      return {
        position: style.position,
        top: style.top,
        insetInlineEnd: style.insetInlineEnd,
        width: style.width,
        height: style.height,
        borderInlineStartWidth: style.borderInlineStartWidth,
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
        content: style.content,
      };
    });
}

/**
 * Where the master copy of a cell's `::after` sits in the cell's padding box, read from its used position,
 * with the cell's padding box size, in one evaluation.
 *
 * @param page The page.
 * @param row Visual row index.
 * @param column Visual column index.
 */
function levelBoxPlacement(page: Page, row: number, column: number): Promise<Record<string, number | string>> {
  return page.locator('[data-testid="grid"] .ht_master').getByTestId(`cell-${row}-${column}`)
    .evaluate((TD) => {
      const style = getComputedStyle(TD, '::after');

      return {
        position: style.position,
        width: style.width,
        height: style.height,
        overflow: style.overflow,
        whiteSpace: style.whiteSpace,
        endGap: TD.clientWidth - parseFloat(style.left) - parseFloat(style.width),
        bottomGap: TD.clientHeight - parseFloat(style.top) - parseFloat(style.height),
      };
    });
}

test.describe('NestedRows level box placement', { tag: THEMES_TAG }, () => {
  test('the level box of a cell sits at its bottom/inline-end corner, 1px and clipped',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.goto({ navigableHeaders: 'off' });

      const expected = {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        whiteSpace: 'pre',
        endGap: 0,
        bottomGap: 0,
      };

      expect(await levelBoxPlacement(page, 1, 0)).toEqual(expected);
      expect(await levelBoxPlacement(page, 2, 1)).toEqual(expected);
    });
});

test.describe('NestedRows level in a commented cell', { tag: THEMES_TAG }, () => {
  test('the Comments triangle keeps its box, and the cell name still ends with the level',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

      await nestedRows.gotoWithComment('off');

      const { content: plainContent, ...plainTriangle } = await afterBox(page, 1, 0);

      expect(plainContent).not.toContain('Level');
      expect(plainTriangle.width).toBe('0px');
      expect(plainTriangle.borderInlineStartWidth).not.toBe('0px');

      await nestedRows.gotoWithComment('on');

      const { content: nestedContent, ...nestedTriangle } = await afterBox(page, 1, 0);

      expect(nestedTriangle).toEqual(plainTriangle);
      expect(nestedContent).not.toBe(plainContent);
      expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3,');
      expect((await nestedRows.chromiumAccessibility({ row: 1, column: 0 })).name).toBe('A-1 , Level 2, 1 of 3,');
    });
});
