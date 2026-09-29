import { helpers } from '../../src/helpers';
import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import {
  columnsCount,
  selectColumnHeaderByNameAndOpenMenu,
  selectFromContextMenu,
} from '../../src/page-helpers';

/**
 * Checks that hiding two columns through the context menu, then showing them again, renders the
 * hidden-column indicators and then the restored grid. The column counts are asserted; the two captures
 * show the headers. Owned by DEV-2981.
 */
visualTest('Test column hiding', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ tablePage }) => {
  expect(await columnsCount()).toBe(9);

  await selectColumnHeaderByNameAndOpenMenu('Name');
  await selectFromContextMenu('Hide column');

  expect(await columnsCount()).toBe(8);

  await selectColumnHeaderByNameAndOpenMenu('In stock');
  await selectFromContextMenu('Hide column');

  expect(await columnsCount()).toBe(7);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
  await tablePage.getByRole('columnheader', { name: 'Company name' }).click();
  await tablePage.getByRole('columnheader', { name: 'Progress' }).click({ modifiers: ['Shift'] });

  await selectColumnHeaderByNameAndOpenMenu('Progress');

  await selectFromContextMenu('Show columns');

  expect(await columnsCount()).toBe(9);

  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
