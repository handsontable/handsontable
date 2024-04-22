import { test, expect } from '../../src/test-runner';
import { takeScreenshot, collapseNestedColumn, collapseNestedRow } from '../../src/page-helpers';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test(__filename, async({ tablePage }) => {
  await tablePage.goto('/scenario-grid');

  const tableTop = tablePage.locator('#tableTop > .handsontable');
  const tableBottom = tablePage.locator('#tableBottom > .handsontable');

  tableTop.waitFor();
  tableBottom.waitFor();

  collapseNestedColumn('Category', tableTop);
  await expect(tableTop.getByRole('columnheader', { name: 'Industry', exact: true })).not.toBeVisible();

  collapseNestedColumn('System', tableTop);
  await expect(tableTop.getByRole('columnheader', { name: 'OS', exact: true })).not.toBeVisible();

  collapseNestedRow(1, tableBottom);
  await expect(tableBottom.getByRole('rowheader', { name: '2', exact: true })).not.toBeVisible();

  collapseNestedRow(11, tableBottom);
  await expect(tableBottom.getByRole('rowheader', { name: '12', exact: true })).not.toBeVisible();

  collapseNestedRow(21, tableBottom);
  await expect(tableBottom.getByRole('rowheader', { name: '22', exact: true })).not.toBeVisible();

  await takeScreenshot();

});
