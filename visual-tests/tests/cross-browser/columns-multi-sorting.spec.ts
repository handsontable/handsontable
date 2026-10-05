import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
} from '../../src/page-helpers';

/**
 * Checks that a two-column sort (Country descending, then Qty ascending) renders both sort indicators
 * and their order numbers, CSS pseudo-elements, in Chromium, Firefox and WebKit. One capture in each
 * browser, after asserting both headers' sort order and the first Qty of the United States rows. The
 * sort itself is asserted by the Jasmine multi-column sorting suite. Owned by DEV-3257.
 */
visualTest('Test column multi-sorting', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  await setColumnSorting('Country', SortDirection.Descending);
  await setAdditionalColumnSorting('Qty', SortDirection.Ascending);

  await expect(tablePage.getByRole('columnheader', { name: 'Country' }))
    .toHaveAttribute('aria-sort', SortDirection.Descending);
  await expect(tablePage.getByRole('columnheader', { name: 'Qty' }))
    .toHaveAttribute('aria-sort', SortDirection.Ascending);

  const cell = await selectCell(3, 4); // first Qty for United States

  expect(await cell.innerText()).toBe('15');

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
