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

const urls = [
  '/?theme=main',
  '/?theme=main-dark',
  '/?theme=horizon',
  '/?theme=horizon-dark'
];

urls.forEach((url) => {
  const testFileName = path.basename(__filename, '.spec.ts');
  const themeName = `-${url.replace('/?theme=', '')}`;

  testCrossBrowser(`Colapse nested headers in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(url);

    await collapseNestedColumn('I');

    await tablePage.screenshot(
      { path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-collapseNestedColumn') }
    );
  });

  testCrossBrowser(`Open context menus in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(url);
    await openHeaderDropdownMenu(4);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-dropDownMenu') });

    const cell = await selectCell(5, 1);

    await openContextMenu(cell);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-contextMenu') });
  });

  testCrossBrowser(`Sort multpiple columns in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(url);
    await setColumnSorting('Age', SortDirection.Descending);
    await setAdditionalColumnSorting('Interest', SortDirection.Ascending);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-sorting') });
  });
});
