import { test, expect } from '@playwright/test';

test('interact with Handsontable', async ({ page }) => {
  // Navigate to the page with the Handsontable grid
  await page.goto('http://localhost:8080');

  // Open hidden columns
  // This depends on how you hide/show columns in your application
  // Here's an example of clicking a button with the ID 'toggle-columns'
  await page.click('#toggle-columns');

  // Scroll the table vertically and horizontally
  // This assumes the Handsontable grid has the ID 'handsontable'
  await page.evalOnSelector('#handsontable', table => {
    table.scrollTop = 100;
    table.scrollLeft = 100;
  });

  // Search for the company name using the keyboard shortcut cmd/ctrl + F
  // This assumes the company name is 'Acme Corp'
  await page.keyboard.press('Control+f');
  await page.keyboard.type('Acme Corp');

  // Copy the contents of the found cell
  // This assumes the found cell has a specific CSS class 'found-cell'
  const cellContent = await page.evalOnSelector('.found-cell', cell => cell.textContent);
  await page.keyboard.copy();

  // Open a dropdown menu and filter the content of the column with the pasted content
  // This depends on how your dropdown menu and filtering work
  // Here's an example of clicking a filter button and typing the cell content into a filter input
  await page.click('#filter-button');
  await page.fill('#filter-input', cellContent);

  // Sort filtered column in the descending mode
  // This depends on how your sorting works
  // Here's an example of clicking a sort button
  await page.click('#sort-button');
});