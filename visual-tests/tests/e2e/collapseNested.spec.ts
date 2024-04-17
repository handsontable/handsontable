import { test, expect } from '../../src/test-runner';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test(__filename, async({ tablePage }) => {
  await tablePage.goto('/scenario-grid');

  const tableTop = tablePage.locator('#hot > #tableTop > .handsontable');

  await tableTop.getByRole('columnheader', { name: 'Product', exact: true }).locator('div').nth(1).click();
  await expect(tableTop.getByRole('columnheader', { name: 'Pricing', exact: true })).not.toBeVisible();
  const tableBottom = tablePage.locator('#hot > #tableBottom > .handsontable');

  await tableBottom.getByRole('rowheader', { name: '1' }).locator('div').nth(1).click();
  await expect(tableBottom.getByRole('rowheader', { name: '2', exact: true })).not.toBeVisible();
});
