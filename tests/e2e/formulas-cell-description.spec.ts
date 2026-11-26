import { test, expect, BUNDLES_TAG, THEMES_TAG } from '../fixtures/test';
import { FormulasCellDescriptionPage } from '../fixtures/pages/FormulasCellDescriptionPage';

/**
 * A cell that holds a formula tells assistive technology so: its accessible name is the value followed by
 * the formula, such as `3 Formula: =SUM(A1:B1)`. The text is generated content of the cell
 * (`td[data-ht-formula]::after`), so the cell's own text, `textContent` and `innerText` stay the value.
 * axe cannot see this, so each case reads the accessible name, and the first one asks Chromium's own
 * accessibility tree through the protocol.
 */
test.describe('formulas: the accessible description of a formula cell', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  test('a formula cell reads its value, then its formula, and its text stays the value', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =SUM(A1:B1)');
    // Chromium joins the value and the generated block with a space, so a screen reader reads two words.
    await expect(grid.cell(0, 2)).toHaveAccessibleName('3 Formula: =SUM(A1:B1)');
    await expect(grid.cell(0, 2)).toHaveText('3');
    expect(await grid.cell(0, 2).evaluate(td => (td as HTMLElement).innerText)).toBe('3');
    expect(await grid.chromiumAccessibleName(0, 2)).toBe('3 Formula: =SUM(A1:B1)');
  });

  test('a cell with a plain value carries no description', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(1, 2)).toHaveText('5');
    await expect(grid.cell(1, 2)).not.toHaveAttribute('data-ht-formula');
    await expect(grid.cell(0, 0)).not.toHaveAttribute('data-ht-formula');
    expect(await grid.chromiumAccessibleName(1, 2)).toBe('5');
  });

  test('the origin of an array formula carries the description and a spilled cell does not', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.cell(2, 0)).toHaveAttribute('data-ht-formula', 'Formula: =TRANSPOSE(A1:A2)');
    await expect(grid.cell(2, 1)).not.toHaveAttribute('data-ht-formula');
  });

  test('the description follows the formula when the cell is edited', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setCellValue(0, 2, '=A1*B1');

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =A1*B1');

    await grid.setCellValue(0, 2, '7');

    await expect(grid.cell(0, 2)).toHaveText('7');
    await expect(grid.cell(0, 2)).not.toHaveAttribute('data-ht-formula');

    await grid.setCellValue(1, 2, '=A2+B2');

    await expect(grid.cell(1, 2)).toHaveAttribute('data-ht-formula', 'Formula: =A2+B2');
  });

  test('a recycled cell element carries the formula of the cell it shows now', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    // Sorting the first column in descending order moves the formula row to the bottom of the data.
    await grid.sortColumnDescending(0);

    await expect(grid.cell(0, 2)).not.toHaveAttribute('data-ht-formula');
    await expect(grid.cell(2, 2)).not.toHaveAttribute('data-ht-formula');
    await expect(page.locator('td[data-ht-formula]')).toHaveCount(2);
  });

  test('a formula shown as text is not described a second time', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.callFormulas('showFormulas');

    await expect(grid.cell(0, 2)).toHaveText('=SUM(A1:B1)');
    await expect(grid.cell(0, 2)).not.toHaveAttribute('data-ht-formula');

    await grid.callFormulas('hideFormulas');

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =SUM(A1:B1)');
  });

  test('`ariaTags: false` leaves the cell alone', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ ariaTags: 'off' });

    await expect(grid.cell(0, 2)).toHaveText('3');
    await expect(grid.cell(0, 2)).not.toHaveAttribute('role', 'gridcell');
    await expect(grid.cell(0, 2)).not.toHaveAttribute('data-ht-formula');
  });

  test('switching the plugin off removes the description', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.callFormulas('disablePlugin');

    await expect(page.locator('td[data-ht-formula]')).toHaveCount(0);
  });

  test('the phrase comes from the grid language', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setLanguage('xx-XX', { 'Formulas:cellDescription': 'Formel: [formula]' });

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formel: =SUM(A1:B1)');
  });

  test('a cell of an exact-height row is described like any other', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ rows: 'exact' });

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =SUM(A1:B1)');
    await expect(grid.cell(0, 2)).toHaveAccessibleName('3 Formula: =SUM(A1:B1)');
    await expect(grid.cell(0, 2)).toHaveText('3');
  });

  test('the description follows a formula whose value stays the same under renderMode onChange', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ render: 'onChange' });
    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =SUM(A1:B1)');

    // 1 + 2 and 2 + 1 are both 3, so only the formula text changes.
    await grid.setCellValue(0, 2, '=B1+A1');

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =B1+A1');
  });

  test('the generated text is never drawn', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();

    const after = await grid.cell(0, 2).evaluate((td) => {
      const style = getComputedStyle(td, '::after');

      return { width: style.width, height: style.height, clipPath: style.clipPath, position: style.position };
    });

    expect(after).toEqual({ width: '1px', height: '1px', clipPath: 'inset(50%)', position: 'absolute' });
  });

  test('a commented formula cell keeps its comment indicator and its description', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ comment: 'on' });

    await expect(grid.cell(0, 2)).toHaveClass(/htCommentCell/);

    const after = await grid.cell(0, 2).evaluate((td) => {
      const style = getComputedStyle(td, '::after');

      return {
        content: style.content,
        borderTopWidth: style.borderTopWidth,
        borderTopColor: style.borderTopColor,
        clipPath: style.clipPath,
      };
    });

    // The triangle is its border, so it needs a visible color, a size and no clipping.
    expect(after.content).toBe('"\u00a0Formula: =SUM(A1:B1)"');
    expect(after.borderTopWidth).not.toBe('0px');
    expect(after.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(after.clipPath).toBe('none');
    expect(await grid.chromiumAccessibleName(0, 2)).toBe('3 Formula: =SUM(A1:B1)');
  });

  test('a formula that returns an empty string in the first cell is still described', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ first: 'empty' });

    await expect(grid.cell(0, 0)).toHaveText('');
    await expect(grid.cell(0, 0)).toHaveAttribute('data-ht-formula', 'Formula: =IF(1=1,"","x")');

    const content = await grid.cell(0, 0).evaluate(td => getComputedStyle(td, '::after').content);

    expect(content).toBe('"\u00a0Formula: =IF(1=1,\\"\\",\\"x\\")"');
    expect((await grid.chromiumAccessibleName(0, 0)).trim()).toBe('Formula: =IF(1=1,"","x")');
  });

  test('a language that lacks the phrase falls back to the English one', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto();
    await grid.setLanguage('yy-YY', { 'Some:otherPhrase': 'x' });

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =SUM(A1:B1)');
    await expect(grid.cell(0, 2)).toHaveText('3');
  });

  test('the name keeps its order in a right-to-left grid', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ dir: 'rtl' });

    await expect.poll(() => grid.chromiumAccessibleName(0, 2)).toBe('3 Formula: =SUM(A1:B1)');

    await grid.setLanguage('ar-XX', { 'Formulas:cellDescription': 'الصيغة: [formula]' });

    await expect.poll(() => grid.chromiumAccessibleName(0, 2)).toBe('3 الصيغة: =SUM(A1:B1)');
  });

  test('a formula with quotes keeps its order in a right-to-left grid', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ dir: 'rtl', first: 'empty' });

    await expect.poll(async() => (await grid.chromiumAccessibleName(0, 0)).trim()).toBe('Formula: =IF(1=1,"","x")');
  });

  test('a long formula is cut and the cut is marked', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);
    const formula = `=${'A1+'.repeat(80)}A1`;

    await grid.goto();
    await grid.setCellValue(0, 2, formula);

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', `Formula: ${formula.slice(0, 120)}…`);
    await expect(grid.cell(0, 2)).toHaveText('81');
  });

  test('the description adds nothing to what scrolls when the result is wider than its cell', async({ page, theme, bundle }) => {
    const grid = new FormulasCellDescriptionPage(page, theme, bundle);

    await grid.goto({ overflow: 'on', ariaTags: 'off' });

    const without = await grid.scrollWidth();

    await grid.goto({ overflow: 'on', ariaTags: 'on' });

    await expect(grid.cell(0, 2)).toHaveAttribute('data-ht-formula', 'Formula: =REPT("x",400)');
    expect(await grid.scrollWidth()).toBe(without);
  });
});
