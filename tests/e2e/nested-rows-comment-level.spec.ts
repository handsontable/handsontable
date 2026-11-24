import { type Page } from '@playwright/test';
import { test, expect, THEMES_TAG } from '../fixtures/test';
import { NestedRowsTreegridPage } from '../fixtures/pages/NestedRowsTreegridPage';

/**
 * The level of a nested row is drawn as the cell's `::after` content. In a cell without a comment it is an
 * inline box of zero size after the text: inline, so Chromium joins it to the value with no space and
 * VoiceOver reads it after the value; zero size, so a wrapped value keeps its row height. The Comments
 * indicator is the same `::after`: a zero-size box whose borders draw the triangle. A
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
 * The computed box of the master copy of a cell's `::after`, the level box of a cell without a comment.
 *
 * @param page The page.
 * @param row Visual row index.
 * @param column Visual column index.
 */
function levelBox(page: Page, row: number, column: number): Promise<Record<string, string>> {
  return page.locator('[data-testid="grid"] .ht_master').getByTestId(`cell-${row}-${column}`)
    .evaluate((TD) => {
      const style = getComputedStyle(TD, '::after');

      return {
        position: style.position,
        display: style.display,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        whiteSpace: style.whiteSpace,
        clipPath: style.clipPath,
        content: style.content,
      };
    });
}

/**
 * The height of a rendered row of the master table at each column width, read once with the level boxes of
 * the row and once with them gone (the `data-ht-row-level` attributes taken off the row's cells, then put
 * back), in one evaluation per width.
 *
 * @param page The page.
 * @param row Visual row index.
 * @param widths The column widths to render.
 */
async function rowHeightsWithAndWithoutLevel(
  page: Page, row: number, widths: number[]
): Promise<{ width: number; withLevel: number; withoutLevel: number }[]> {
  const heights = [];

  for (const width of widths) {
    heights.push(await page.evaluate(([visualRow, columnWidth]) => {
      window.hot.updateSettings({ colWidths: columnWidth });

      const TR = document.querySelectorAll('[data-testid="grid"] .ht_master tbody tr')[visualRow];
      const cells = Array.from(TR.querySelectorAll('td[data-ht-row-level]'));
      const levels = cells.map(TD => TD.getAttribute('data-ht-row-level') ?? '');
      const withLevel = TR.getBoundingClientRect().height;

      cells.forEach(TD => TD.removeAttribute('data-ht-row-level'));

      const withoutLevel = TR.getBoundingClientRect().height;

      cells.forEach((TD, index) => TD.setAttribute('data-ht-row-level', levels[index]));

      return { width: columnWidth, withLevel, withoutLevel };
    }, [row, width]));
  }

  return heights;
}

test.describe('NestedRows level box', { tag: THEMES_TAG }, () => {
  test('the level box of a cell is an inline box of zero size after the text', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });

    const expected = {
      position: 'static',
      display: 'inline',
      fontSize: '0px',
      lineHeight: '0px',
      whiteSpace: 'pre',
      clipPath: 'inset(50%)',
    };

    expect(await levelBox(page, 1, 0)).toEqual({ ...expected, content: '", Level 2, 1 of 3"' });
    expect(await levelBox(page, 2, 1)).toEqual({ ...expected, content: '", Level 2, 2 of 3, expanded"' });
  });

  test('a wrapped value keeps the row height it has without the level', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsTreegridPage(page, theme, bundle);

    await nestedRows.goto({ navigableHeaders: 'off' });
    await page.evaluate(() => {
      window.hot.setDataAtCell(1, 0, 'Red Grape');
    });

    const heights = await rowHeightsWithAndWithoutLevel(page, 1, [50, 60, 70, 80, 90, 100, 110, 120, 130, 140]);
    const widest = heights[heights.length - 1];

    expect(heights.some(({ withLevel }) => withLevel > widest.withLevel)).toBe(true);
    expect(heights.filter(({ withLevel, withoutLevel }) => withLevel !== withoutLevel)).toEqual([]);
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
      expect(await nestedRows.cellName(1, 0)).toBe('A-1 , Level 2, 1 of 3');
      expect((await nestedRows.chromiumAccessibility({ row: 1, column: 0 })).name).toBe('A-1 , Level 2, 1 of 3');
    });
});
