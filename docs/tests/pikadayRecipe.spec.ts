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
      const calendarMetrics = await calendar.evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      const textAlignmentErrors = await calendar.locator('.pika-button').evaluateAll(buttons =>
        buttons.map((button) => {
          const range = button.ownerDocument.createRange();

          range.selectNodeContents(button);

          const textRect = range.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();

          return Math.abs(
            textRect.left + textRect.width / 2 - (buttonRect.left + buttonRect.width / 2),
          );
        }).filter(offset => offset > 1));

      expect(cellCount).toBe(calendarColumns);
      expect(widthDifference).toBeLessThanOrEqual(1);
      expect(horizontalMetrics.scrollWidth).toBeLessThanOrEqual(horizontalMetrics.clientWidth);
      expect(calendarMetrics.scrollWidth).toBeLessThanOrEqual(calendarMetrics.clientWidth);
      expect(textAlignmentErrors).toEqual([]);
      await expect(calendar.locator('.pika-button').first()).toHaveCSS('text-align', 'center');
    });
  }
});
