import path from 'path';
import { testCrossBrowser } from '../../src/test-runner';
import {
  collapseNestedColumn,
  openHeaderDropdownMenu,
  openContextMenu,
  selectCell,
  setColumnSorting,
  setAdditionalColumnSorting,
  SortDirection,
  openEditor,
  createSelection,
  LayoutDirection
} from '../../src/page-helpers';
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

  testCrossBrowser(`Collapse nested headers in theme: ${themeName}`, async({ tablePage }) => {
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

  testCrossBrowser(`Open context menus in RTL mode in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(`${url}&direction=${LayoutDirection.RTL}`);
    await openHeaderDropdownMenu(4);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-rtl-dropDownMenu') });

    const cell = await selectCell(5, 1);

    await openContextMenu(cell);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-rtl-contextMenu') });
  });

  testCrossBrowser(`Sort multiple columns in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(url);
    await setColumnSorting('Age', SortDirection.Descending);
    await setAdditionalColumnSorting('Interest', SortDirection.Ascending);
    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-sorting') });
  });

  testCrossBrowser(`Selection in RTL mode in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(`${url}&direction=${LayoutDirection.RTL}`);

    const cellFrom = await selectCell(3, 0);
    const cellTo = await selectCell(5, 2);

    await createSelection(cellFrom, cellTo);

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-rtl-selection') });
  });

  testCrossBrowser(`Open select editor in RTL mode in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(`${url}&direction=${LayoutDirection.RTL}`);

    const cell = await selectCell(5, 4);

    await openEditor(cell);

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-rtl-selectEditor') });
  });

  testCrossBrowser(`Open date editor in RTL mode in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(`${url}&direction=${LayoutDirection.RTL}`);

    const cell = await selectCell(4, 8);

    await openEditor(cell);

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-rtl-dateEditor') });
  });

  testCrossBrowser(`Highlight autocomplete in theme: ${themeName}`, async({ tablePage }) => {
    await tablePage.goto(url);

    const cell = await selectCell(4, 7);

    await openEditor(cell);

    const cellEditor = tablePage.locator(helpers.findCellEditor());

    await cellEditor.waitFor();
    await cellEditor.clear();
    await cellEditor.type('to');

    await tablePage.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, themeName, '-autoComplete') });
  });
});
