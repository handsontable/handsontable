import { expect } from '@playwright/test';
import { helpers } from '../../src/helpers';
import { openHeaderDropdownMenu, selectCell, } from '../../src/page-helpers';
import { test } from '../../src/test-runner';

test('hide and show columns', async({ page }) => {

  expect(await page.getByRole('columnheader').count()).toBe(9);

  await page.getByRole('columnheader', { name: 'Name', exact: true }).click({
    button: 'right',
    modifiers: ['Shift'],
  });
  await page.getByText('Hide column').click();
  expect(await page.getByRole('columnheader').count()).toBe(8);

  await page.getByRole('columnheader', { name: 'Company name' }).click();
  await page.getByRole('columnheader', { name: 'Sell date' }).click({
    button: 'right',
    modifiers: ['Shift'],
  });
  await page.getByText('Show column').click();
  expect(await page.getByRole('columnheader').count()).toBe(9);
  await page.screenshot({ path: helpers.screenshotPath() });

});

test('filter', async({ page }) => {

  expect(await page.getByRole('rowheader').count()).toBe(22);
  openHeaderDropdownMenu(9);
  await page.getByText('Clear', { exact: true }).click();
  await page.getByPlaceholder('Search').type('India', { delay: 100 });
  await page.screenshot({ path: helpers.screenshotPath() });

  await page.getByLabel('Filter by value:').getByText('India').click();
  await page.getByRole('button', { name: 'OK' }).click();
  expect(await page.getByRole('rowheader').count()).toBe(6);
  await page.getByRole('columnheader', { name: 'Qty' }).locator('span').click();
  await page.getByRole('columnheader', { name: 'Qty' }).locator('span').click();
  const cell = await selectCell(0, 4);

  expect(await cell.innerText()).toBe('162');
});
