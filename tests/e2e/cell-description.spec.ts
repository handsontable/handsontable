import { test, expect, BUNDLES_TAG, THEMES_TAG } from '../fixtures/test';
import { CellDescriptionPage } from '../fixtures/pages/CellDescriptionPage';

/**
 * A cell tells assistive technology what it holds beyond its text: that it is read only, that it holds a link,
 * that it is a merged block. The text is the cell's accessible description, not part of its name: a hidden
 * element in the grid's root holds it and the cell points at it through `aria-describedby`, after the reference
 * to its column header. So the cell's name, its own text, its box and its styles stay as they were. axe cannot
 * see a description, so each case asks Chromium's own accessibility tree through the protocol.
 */
test.describe('cell description: what a cell holds beyond its text', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('a read-only cell is described as read only and keeps its name', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    const { name, description } = await grid.chromiumAccessibility(0, 1);

    expect(name).toBe('locked');
    expect(description).toMatch(/(^|\s)read only$/);
    await expect(grid.cell(0, 1)).toHaveText('locked');
    await expect(grid.cell(0, 1)).toHaveAccessibleName('locked');
    await expect(grid.cell(0, 1)).toHaveAccessibleDescription(/read only$/);
  });

  test('the cell still points at its column header first', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.describedByTexts(0, 1)).toEqual(['B', 'read only']);
  });

  test('a cell with nothing to add points at its column header and nothing else', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.describedByTexts(0, 0)).toEqual(['A']);
    expect(await grid.describedByTexts(3, 1)).toEqual(['B']);
    expect((await grid.chromiumAccessibility(0, 0)).name).toBe('plain');
  });

  test('a cell that holds a link is described as a link', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    const { name, description } = await grid.chromiumAccessibility(0, 2);

    expect(name).toBe('https://example.com/one');
    expect(description).toMatch(/(^|\s)link$/);
  });

  test('a read-only formula is described as read only and keeps the name the formula gives it', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    const { name, description } = await grid.chromiumAccessibility(0, 3);

    expect(name).toBe('3 Formula: =SUM(1,2)');
    expect(description).toMatch(/(^|\s)read only$/);
  });

  test('a merged block is described by its last row and column, headers counted like aria-rowindex', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(1, 0)).toHaveAttribute('rowspan', '2');
    // The block ends in the cell B3. That cell is row 4 and column 3 for a screen reader: one header row and one
    // row header column come before the data.
    await expect(grid.cell(2, 1)).toHaveAttribute('aria-colindex', '3');
    await expect(grid.cell(2, 1).locator('xpath=..')).toHaveAttribute('aria-rowindex', '4');

    const { name, description } = await grid.chromiumAccessibility(1, 0);

    expect(name).toBe('merged');
    expect(description).toMatch(/merged through row 4 column 3$/);
  });

  test('a merged block of a grid without headers counts from its own first row and column', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ headers: 'off' });

    // With no header the cell points at its description alone.
    expect(await grid.describedByTexts(1, 0)).toEqual(['merged through row 3 column 2']);
    expect(await grid.describedByTexts(0, 1)).toEqual(['read only']);
  });

  test('the description follows the cell when it becomes read only and editable again', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setReadOnly(3, 0, true);

    expect(await grid.describedByTexts(3, 0)).toEqual(['A', 'read only']);

    await grid.setReadOnly(3, 0, false);

    expect(await grid.describedByTexts(3, 0)).toEqual(['A']);
  });

  test('the description follows the cell under renderMode onChange', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ render: 'onChange' });
    await grid.setReadOnly(3, 0, true);

    expect(await grid.describedByTexts(3, 0)).toEqual(['A', 'read only']);

    await grid.setReadOnly(3, 0, false);

    expect(await grid.describedByTexts(3, 0)).toEqual(['A']);
  });

  test('a HYPERLINK formula is described as a link', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.describedByTexts(3, 3)).toEqual(['D', 'link']);
  });

  test('a link that a formula shows as text is no longer described as a link', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    expect(await grid.describedByTexts(3, 2)).toEqual(['C', 'link']);

    await grid.callPlugin('formulas', 'showFormulas');

    await expect(grid.cell(3, 2)).toHaveText('=C1');
    expect(await grid.describedByTexts(3, 2)).toEqual(['C']);
  });

  test('switching a plugin off takes its part out of the description, and back on puts it in', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.callPlugin('autoLink', 'disablePlugin');

    expect(await grid.describedByTexts(0, 2)).toEqual(['C']);

    await grid.callPlugin('autoLink', 'enablePlugin');

    expect(await grid.describedByTexts(0, 2)).toEqual(['C', 'link']);
  });

  test('switching a plugin off and on takes effect under renderMode onChange', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ render: 'onChange' });

    expect(await grid.describedByTexts(0, 2)).toEqual(['C', 'link']);

    await grid.callPlugin('autoLink', 'disablePlugin');

    expect(await grid.describedByTexts(0, 2)).toEqual(['C']);

    await grid.callPlugin('autoLink', 'enablePlugin');

    expect(await grid.describedByTexts(0, 2)).toEqual(['C', 'link']);
  });

  test('a merged block gives up its description when it is unmerged, and gets it back when it is merged again', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ render: 'onChange' });
    await grid.setMerged(false);

    expect(await grid.describedByTexts(1, 0)).toEqual(['A']);

    await grid.setMerged(true);

    expect(await grid.describedByTexts(1, 0)).toEqual(['A', 'merged through row 4 column 3']);
  });

  test('a read-only grid describes every cell it renders with a few shared elements', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ readonlygrid: 'on' });

    const counts = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.ht_master tbody td'));
      const described = cells.filter(td => (td.getAttribute('aria-describedby') ?? '').includes('ht-description-'));
      const elements = document.querySelectorAll('[id^="ht-description-"]');

      return { cells: cells.length, described: described.length, elements: elements.length };
    });

    expect(counts.described).toBe(counts.cells);
    // Read only, read only with a link, read only with the merged block. Never one element per cell.
    expect(counts.elements).toBeLessThanOrEqual(4);
  });

  test('a repaint, and a scroll over recycled cells, write no description reference again', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ readonlygrid: 'on' });

    // Every cell is described, and the header reference Walkontable writes is not reset and written again.
    expect(await grid.countDescribedByWrites()).toEqual({ repaint: 0, scroll: 0 });
  });

  test('`ariaTags: false` leaves every cell and the root alone', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ ariaTags: 'off' });

    await expect(page.locator('[id^="ht-description-"]')).toHaveCount(0);
    await expect(page.locator('td[aria-describedby]')).toHaveCount(0);
    expect((await grid.chromiumAccessibility(0, 1)).description).toBe('');
  });

  test('the phrases come from the grid language', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setLanguage('xx-XX', {
      'CellDescription:readOnly': 'nur lesen',
      'CellDescription:link': 'Link',
      'CellDescription:merged': 'verbunden bis Zeile [row] Spalte [column]',
    });

    expect(await grid.describedByTexts(0, 1)).toEqual(['B', 'nur lesen']);
    expect(await grid.describedByTexts(0, 2)).toEqual(['C', 'Link']);
    expect(await grid.describedByTexts(1, 0)).toEqual(['A', 'verbunden bis Zeile 4 Spalte 3']);
  });

  test('a language that lacks the phrases falls back to the English ones', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setLanguage('yy-YY', { 'Some:otherPhrase': 'x' });

    expect(await grid.describedByTexts(0, 1)).toEqual(['B', 'read only']);
  });

  test('a read-only cell has no generated content, no position and the box of an editable one', async({
    page, theme, bundle,
  }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto();

    const style = await page.evaluate(() => {
      const read = (testId: string) => {
        const td = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement;

        return {
          position: getComputedStyle(td).position,
          after: getComputedStyle(td, '::after').content,
          height: td.getBoundingClientRect().height,
        };
      };

      return { readOnly: read('cell-0-1'), plain: read('cell-0-0'), link: read('cell-0-2') };
    });

    expect(style.readOnly.after).toBe('none');
    expect(style.link.after).toBe('none');
    expect(style.readOnly.position).toBe(style.plain.position);
    expect(style.readOnly.height).toBe(style.plain.height);
  });

  test('a grid without ARIA has the same cell boxes as one with it', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);
    const boxes = async() => grid.page.evaluate(() => {
      return Array.from(document.querySelectorAll('.ht_master tbody td'))
        .map((td) => {
          const box = td.getBoundingClientRect();

          return `${Math.round(box.width)}x${Math.round(box.height)}`;
        }).join(',');
    });

    await grid.goto({ ariaTags: 'off' });

    const without = await boxes();

    await grid.goto({ ariaTags: 'on' });

    expect(await boxes()).toBe(without);
  });

  test('a commented read-only cell keeps its comment indicator untouched', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ comment: 'on' });

    await expect(grid.cell(0, 1)).toHaveClass(/htCommentCell/);

    const after = await grid.cell(0, 1).evaluate((td) => {
      const style = getComputedStyle(td, '::after');

      return { content: style.content, borderTopWidth: style.borderTopWidth, clipPath: style.clipPath };
    });

    expect(after.content).not.toContain('read only');
    expect(after.borderTopWidth).not.toBe('0px');
    expect(after.clipPath).toBe('none');
    expect((await grid.chromiumAccessibility(0, 1)).description).toMatch(/(^|\s)read only$/);
  });

  test('the description is read after the name in a right-to-left grid', async({ page, theme, bundle }) => {
    const grid = new CellDescriptionPage(page, theme, bundle);

    await grid.goto({ dir: 'rtl' });

    await expect.poll(async() => (await grid.chromiumAccessibility(0, 1)).name).toBe('locked');
    await expect.poll(async() => (await grid.chromiumAccessibility(0, 1)).description).toMatch(/read only$/);

    await grid.setLanguage('ar-XX', { 'CellDescription:readOnly': 'للقراءة فقط' });

    expect(await grid.describedByTexts(0, 1)).toEqual(['B', 'للقراءة فقط']);
  });
});
