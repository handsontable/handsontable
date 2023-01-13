import { test } from '../imports/test-runner';
import { helpers } from '../imports/helpers';

test(__filename, async({ page }) => {
  const table = page.locator(helpers.selectors.mainTable);

  await table.waitFor();
  // const mainTableFirstColumn = table.locator(helpers.selectors.mainTableFirstColumn);
  // const tbody = table.locator(helpers.selectors.mainTableBody);
  // const thead = table.locator(helpers.selectors.mainTableHead);

  /* your test here */
});
