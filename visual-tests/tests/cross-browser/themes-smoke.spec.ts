import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import { collapseNestedColumn, openHeaderDropdownMenu, openContextMenu, selectCell, setColumnSorting, setAdditionalColumnSorting, SortDirection } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const urls = [
  '/',
  '/?theme=dark'
];

urls.forEach(url => {
  const testFileName = path.basename(__filename, '.spec.ts');
  const themeSuffix = url.includes('theme=dark') ? '-dark' : '';
  testCrossBrowser(`Colapse nested headers for ${url}`, async ({ tablePage }) => {
    await tablePage.goto(url);

    const table = tablePage.locator('#root');

    await table.waitFor();

    await collapseNestedColumn('I');

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(`${testFileName}${themeSuffix}`) });
  });
  testCrossBrowser(`Open context menus for ${url}`, async ({ tablePage }) => {
  
    await tablePage.goto(url);
    const table = tablePage.locator('#root');

    await table.waitFor();
    await openHeaderDropdownMenu(4);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(`${testFileName}${themeSuffix}`, url, 'dropDown') });

    const cell = await selectCell(5, 1);
    await openContextMenu(cell);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(`${testFileName}${themeSuffix}`, url, 'context') });
  });
  testCrossBrowser(`Sort multpiple columns ${url}`, async ({ tablePage }) => {
  
    await tablePage.goto(url);
    const table = tablePage.locator('#root');

    await table.waitFor();
    await setColumnSorting('Age', SortDirection.Descending);
    await setAdditionalColumnSorting('Interest', SortDirection.Ascending);
  
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(`${testFileName}${themeSuffix}`, url, 'sorting') });
  });
});