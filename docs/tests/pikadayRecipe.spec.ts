import { expect, test } from '@playwright/test';

const frameworkConfigs = [
  { path: 'javascript-data-grid', calendarColumns: 8 },
  { path: 'react-data-grid', calendarColumns: 8 },
  { path: 'angular-data-grid', calendarColumns: 7 },
];

test.describe('Pikaday recipe', () => {
  for (const { path, calendarColumns } of frameworkConfigs) {
    test(`keeps the calendar aligned in ${path}`, async({ page, baseURL }) => {
      await page.goto(`${baseURL}/${path}/recipes/cell-types/pikaday`);

      const dateCell = page.locator('.handsontable td').filter({ hasText: '10/05/2025' }).first();

      await dateCell.dblclick();

      const calendar = page.locator('.pika-single:visible');
      const table = calendar.locator('.pika-table');
      const weekRowCells = table.locator('tbody tr').first().locator('td');

      await expect(calendar).toBeVisible();
      const cellCount = await weekRowCells.count();

      const cellWidths = await weekRowCells.evaluateAll(cells =>
        cells.map(cell => cell.getBoundingClientRect().width));
      const widthDifference = Math.max(...cellWidths) - Math.min(...cellWidths);
      const horizontalMetrics = await table.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));

      expect(cellCount).toBe(calendarColumns);
      expect(widthDifference).toBeLessThanOrEqual(1);
      expect(horizontalMetrics.scrollWidth).toBeLessThanOrEqual(horizontalMetrics.clientWidth);
      await expect(calendar.locator('.pika-button').first()).toHaveCSS('text-align', 'center');
    });
  }
});
