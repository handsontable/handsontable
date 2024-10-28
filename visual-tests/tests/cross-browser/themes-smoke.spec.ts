import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import {
  collapseNestedColumn,
  openHeaderDropdownMenu,
  openContextMenu,
  selectCell,
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection } from '../../src/page-helpers';
import { helpers } from '../../src/helpers';

const baseUrl = 'http://localhost:8083';
const urls = [
  '/?theme=main',
  '/?theme=main-dark',
  '/?theme=horizon',
  '/?theme=horizon-dark'
];

urls.forEach((url) => {
  const testFileName = path.basename(__filename, '.spec.ts');
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const theme = urlParams.get('theme');
  const themeSuffix = theme ? `-${theme}` : '';
  const fullUrl = `${baseUrl}${url}`;
  const screenshotName = `${testFileName}${themeSuffix}`;

  testCrossBrowser(`Colapse nested headers for ${url}`, async({ tablePage }) => {
    await tablePage.goto(fullUrl);

    const table = tablePage.locator('#root');

    await table.waitFor();

    await collapseNestedColumn('I');

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(screenshotName) });
  });
  testCrossBrowser(`Open context menus for ${url}`, async({ tablePage }) => {

    await tablePage.goto(fullUrl);
    const table = tablePage.locator('#root');

    await table.waitFor();
    await openHeaderDropdownMenu(4);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(screenshotName, url, 'dropDown') });

    const cell = await selectCell(5, 1);

    await openContextMenu(cell);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(screenshotName, url, 'context') });
  });
  testCrossBrowser(`Sort multpiple columns ${url}`, async({ tablePage }) => {

    await tablePage.goto(fullUrl);
    const table = tablePage.locator('#root');

    await table.waitFor();
    await setColumnSorting('Age', SortDirection.Descending);
    await setAdditionalColumnSorting('Interest', SortDirection.Ascending);

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(screenshotName, url, 'sorting') });
  });
});
