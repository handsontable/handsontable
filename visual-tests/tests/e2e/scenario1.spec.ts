import { test, expect } from '@playwright/test';
// import PageHolder from '../../src/page-holder';
// import { openHeaderDropdownMenu, selectFromDropdownMenu } from '../../src/page-helpers';

test('interact with Handsontable', async({ page }) => {
  const sortOrder = 'ascending'; // replace with the desired sort order

  // Navigate to the page with the Handsontable grid
  await page.goto('http://localhost:8080');
  expect(await page.getByRole('columnheader').count()).toBe(4);

//   await page.waitForSelector('hot-table');
  await page.getByRole('columnheader', { name: 'Country' }).click();
  await page.getByRole('columnheader', { name: 'In stock' }).click({
    button: 'right',
    modifiers: ['Shift'],
  });
  await page.getByText('Show columns').click();
  expect(await page.getByRole('columnheader').count()).toBe(7);

});
