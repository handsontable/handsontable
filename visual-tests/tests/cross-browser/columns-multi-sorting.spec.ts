import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  selectCell,
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
} from '../../src/page-helpers';

/**
 * Checks that a two-column sort (Country descending, then Qty ascending) renders both sort indicators and
 * their order numbers. Owned by DEV-2981.
 */
visualTest('Test column multi-sorting', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  await setColumnSorting('Country', SortDirection.Descending);
  await setAdditionalColumnSorting('Qty', SortDirection.Ascending);

  await tablePage.screenshot({ path: helpers.screenshotPath() });

  const cell = await selectCell(3, 4); // first Qty for United States

  expect(await cell.innerText()).toBe('15');
});
