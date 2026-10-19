import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AsyncValuesPage } from '../fixtures/pages/AsyncValuesPage';

/**
 * The AsyncValues plugin: a cell filled from a promise shows a spinner while the request
 * is pending and an error state when it fails, an edit cancels the request and drops its late result,
 * and a sort while the request is pending still lands the value on its record.
 */
test.describe('async cell values', { tag: THEMES_TAG }, () => {
  test('a pending cell shows a spinner at its inline end without growing the row', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    const heightBefore = (await asyncPage.cell(0, 1).boundingBox())!.height;

    await asyncPage.start(0, 1);

    const indicator = asyncPage.indicator(0, 1);

    await expect(indicator).toBeVisible();
    await expect(asyncPage.cell(0, 1)).toHaveAttribute('aria-busy', 'true');
    await expect(asyncPage.cell(0, 1)).toHaveText('Old A');
    await expect(indicator).toHaveCSS('animation-name', 'ht-async-values-spin');

    const cellBox = (await asyncPage.cell(0, 1).boundingBox())!;
    const indicatorBox = (await indicator.boundingBox())!;

    expect(cellBox.height).toBe(heightBefore);
    expect(indicatorBox.x).toBeGreaterThan(cellBox.x + (cellBox.width / 2));
    expect(indicatorBox.x + indicatorBox.width).toBeLessThanOrEqual(cellBox.x + cellBox.width);
    expect(indicatorBox.y).toBeGreaterThanOrEqual(cellBox.y);
    expect(indicatorBox.y + indicatorBox.height).toBeLessThanOrEqual(cellBox.y + cellBox.height);
  });

  test('the spinner and the error background follow their own theme variables', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();
    // Values no theme uses, so a rule that read another variable cannot match them by accident.
    await asyncPage.setThemeVariables({
      '--ht-async-indicator-color': 'rgb(1, 2, 3)',
      '--ht-async-error-background-color': 'rgb(4, 5, 6)',
    });
    await asyncPage.start(0, 1);

    await expect(asyncPage.indicator(0, 1)).toBeVisible();
    expect(await asyncPage.indicatorColor(0, 1)).toBe('rgb(1, 2, 3)');

    await asyncPage.reject(await asyncPage.start(2, 1), 'Product not found');

    await expect(asyncPage.cell(2, 1)).toHaveClass(/htAsyncError/);
    expect((await asyncPage.errorColors(2, 1)).cell).toBe('rgb(4, 5, 6)');
  });

  test('a resolved request writes the value and removes the spinner', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    const id = await asyncPage.start(1, 1);

    await expect(asyncPage.indicator(1, 1)).toBeVisible();
    await asyncPage.resolve(id, 'Widget B');

    await expect(asyncPage.cell(1, 1)).toHaveText('Widget B');
    await expect(asyncPage.indicator(1, 1)).toHaveCount(0);
    await expect(asyncPage.cell(1, 1)).not.toHaveAttribute('aria-busy');
  });

  test('a rejected request keeps the previous value and paints the error state', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    const id = await asyncPage.start(2, 1);

    await asyncPage.reject(id, 'Product not found');

    await expect(asyncPage.cell(2, 1)).toHaveClass(/htAsyncError/);
    await expect(asyncPage.cell(2, 1)).toContainText('Old C');
    await expect(asyncPage.cell(2, 1)).toHaveAttribute('title', 'Product not found');
    // The message is part of the cell's accessible text, and takes no room on screen.
    await expect(asyncPage.cell(2, 1).locator('.htAsyncErrorMessage')).toHaveText('Product not found');
    expect((await asyncPage.cell(2, 1).locator('.htAsyncErrorMessage').boundingBox())!.width).toBeLessThanOrEqual(1);
    await expect(asyncPage.indicator(2, 1)).toHaveCount(0);

    const colors = await asyncPage.errorColors(2, 1);

    expect(colors.cell).toBe(colors.token);

    // The other row parity, which the row-striping rule paints with another selector.
    await asyncPage.reject(await asyncPage.start(1, 1), 'Product not found');
    await expect(asyncPage.cell(1, 1)).toHaveClass(/htAsyncError/);

    const otherColors = await asyncPage.errorColors(1, 1);

    expect(otherColors.cell).toBe(otherColors.token);
  });

  test('typing into a pending cell cancels the request and ignores its late result', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    const id = await asyncPage.start(0, 1);

    await asyncPage.cell(0, 1).click();
    await page.keyboard.type('Typed');
    await page.keyboard.press('Enter');

    await expect(asyncPage.cell(0, 1)).toHaveText('Typed');
    await expect.poll(() => asyncPage.result(id)).toEqual(expect.objectContaining({
      status: 'cancelled', reason: 'edit',
    }));
    expect(await asyncPage.isAborted(id)).toBe(true);
    await expect(asyncPage.indicator(0, 1)).toHaveCount(0);

    // The late result is settled before a control request on another cell, so the control landing
    // proves the late result had its turn.
    const control = await asyncPage.start(1, 1);

    await asyncPage.resolve(id, 'Late');
    await asyncPage.resolve(control, 'Control');

    await expect(asyncPage.cell(1, 1)).toHaveText('Control');
    await expect(asyncPage.cell(0, 1)).toHaveText('Typed');
  });

  test('editing a cell the request depends on cancels it', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    const id = await asyncPage.start(1, 1);

    await asyncPage.cell(1, 0).click();
    await page.keyboard.type('Z-999');
    await page.keyboard.press('Enter');

    await expect.poll(() => asyncPage.result(id)).toEqual(expect.objectContaining({
      status: 'cancelled', reason: 'dependency',
    }));
    await expect(asyncPage.indicator(1, 1)).toHaveCount(0);
    await expect(asyncPage.cell(1, 1)).toHaveText('Old B');
  });

  test('sorting while a request is pending lands the value on its record', async({ page, theme, bundle }) => {
    const asyncPage = new AsyncValuesPage(page, theme, bundle);

    await asyncPage.goto();

    // Row 0 (price 30) is the last row once the Price column is sorted ascending.
    const id = await asyncPage.start(0, 1);

    await page.locator('.ht_clone_top span.colHeader', { hasText: 'Price' }).click();

    await expect(asyncPage.cell(0, 0)).toHaveText('B-200');
    await expect(asyncPage.indicator(2, 1)).toBeVisible();
    await expect(asyncPage.indicator(0, 1)).toHaveCount(0);

    await asyncPage.resolve(id, 'Widget A');

    await expect(asyncPage.cell(2, 1)).toHaveText('Widget A');
    await expect(asyncPage.cell(2, 0)).toHaveText('A-100');
    expect(await asyncPage.sourceRow(0)).toEqual({ sku: 'A-100', name: 'Widget A', price: 30 });
  });
});
