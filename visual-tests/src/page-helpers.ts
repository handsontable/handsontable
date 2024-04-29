import type { Locator } from '@playwright/test';
import PageHolder from './page-holder';
import { helpers } from './helpers';

// eslint-disable-next-line no-shadow
export enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
  None = 'none',
}

// eslint-disable-next-line no-shadow
export enum CellBorder {
  Top = 'Top',
  Right = 'Right',
  Bottom = 'Bottom',
  Left = 'Left',
}

// eslint-disable-next-line no-shadow
export enum FilterConditions {
  None = 'None',
  IsEmpty = 'Is empty',
  IsNotEmpty = 'Is not empty',
  IsEqualTo = 'Is equal to',
  IsNotEqualTo = 'Is not equal to',
  Before = 'Before',
  After = 'After',
  IsBetween = 'Is between',
  Tomorrow = 'Tomorrow',
  Today = 'Today',
  Yesterday = 'Yesterday',
}

/**
 * Get the page instance.
 *
 * @returns {Page} The page instance.
 */
function getPageInstance() {
  return PageHolder.getInstance().getPage();
}

/**
 * Get the default table instance.
 *
 * @returns {Locator} The locator of the main table.
 */
function getDefaultTableInstance() {
  return getPageInstance().locator(helpers.selectors.mainTable);
}

/**
 * Select cell by row and column index.
 *
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {Locator} tableLocator The locator of the table.
 * @param {string} cellType The type of cell.
 * @returns {Locator} The locator of the selected cell.
 */
export async function selectCell(
  row: number,
  column: number,
  tableLocator = getDefaultTableInstance(),
  cellType: string = 'td'
): Promise<Locator> {
  const tbody = tableLocator.locator(helpers.selectors.mainTableBody);

  return tbody.locator(helpers.findCell({ row, column, cellType }));
}

/**
 * Select cloned cell by row and column index.
 *
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {Locator} tableLocator The locator of the table.
 * @param {string} cellType The type of cell.
 * @returns {Locator} The locator of the selected cell.
 */
export async function selectClonedCell(
  row: number,
  column: number,
  tableLocator = getDefaultTableInstance(),
  cellType: string = 'th'
) {
  const tbody = tableLocator.locator(helpers.selectors.cloneTopTable);

  return tbody.locator(helpers.findCell({ row, column, cellType }));
}

/**
 * @param {Locator} cell The locator of the cell.
 */
export async function openEditor(cell: Locator) {
  await cell.click();
  await cell.press('Enter');
}

/**
 * @returns {Locator} The locator of the cell editor.
 */
export async function selectEditor() {
  const table = getPageInstance().locator(helpers.selectors.mainTable);
  const cellEditor = table.locator(helpers.findCellEditor());

  await cellEditor.waitFor();

  return cellEditor;
}

/**
 * Triggers the arrow keys events.
 *
 */
export async function tryToEscapeFromTheComponentsFocus() {
  // try to select another menu item using arrow keys (it should not be possible)
  await getPageInstance().keyboard.press('ArrowDown');
  await getPageInstance().keyboard.press('ArrowUp');
  await getPageInstance().keyboard.press('ArrowRight');
  await getPageInstance().keyboard.press('ArrowLeft');
}

/**
 * Create a selection from one cell to another.
 *
 * @param {Locator} cellFrom Start cell.
 * @param {Locator} cellTo End cell.
 */
export async function createSelection(cellFrom: Locator, cellTo: Locator) {
  const cellFromBox = await cellFrom.boundingBox();
  const cellToBox = await cellTo.boundingBox();

  await getPageInstance().mouse.move(cellFromBox!.x + 10, cellFromBox!.y + 10);
  await getPageInstance().mouse.down();
  await getPageInstance().mouse.move(cellToBox!.x + 10, cellToBox!.y + 10);
  await getPageInstance().mouse.up();
}

/**
 * @param {Locator} cell Cell locator.
 */
export async function clickWithPositionAndModifiers(cell: Locator) {
  await cell.click({
    position: { x: 1, y: 1 },
    modifiers: [helpers.modifier],
  });
}

/**
 * @param {Locator} cell Cell locator.
 */
export async function clickWithPosition(cell: Locator) {
  await cell.click({
    position: { x: 1, y: 1 },
  });
}

/**
 * @param {Locator} cell Cell locator.
 */
export async function clickCell(cell: Locator) {
  await cell.click();
}

/**
 * @param {Locator} cell Cell locator.
 * @param {number} size Cell locator.
 */
export async function makeSelectionFromCell(cell: Locator, size: number) {
  const cellCoordinates = await cell.boundingBox();

  await getPageInstance().mouse.move(
    cellCoordinates!.x + (cellCoordinates!.width / 2),
    cellCoordinates!.y + (cellCoordinates!.height / 2)
  );
  await getPageInstance().mouse.down();
  await getPageInstance().mouse.move(
    cellCoordinates!.x + (cellCoordinates!.width / 2) + size,
    cellCoordinates!.y + (cellCoordinates!.height / 2) + size
  );
  await getPageInstance().mouse.up();
}

/**
 * @param {number} columnIndex Cell locator.
 */
export async function openHeaderDropdownMenu(columnIndex: number) {
  const table = getPageInstance().locator(helpers.selectors.mainTable);
  const changeTypeButton = table.locator(
    helpers.findDropdownMenuExpander({ col: columnIndex })
  );

  await changeTypeButton.click();
}

/**
 * @param {string} option Cell locator.
 */
export async function selectFromDropdownMenu(option: string) {
  const dropdownMenu = getPageInstance().locator(
    helpers.selectors.dropdownMenu
  );

  await dropdownMenu.locator(option).click();
}

/**
 * @param {string} option Cell locator.
 */
export async function selectCo(option: string) {
  const dropdownMenu = getPageInstance().locator(
    helpers.selectors.dropdownMenu
  );

  await dropdownMenu.locator(option).click();
}

/**
 * @param {string} columnName Column name.
 */
export async function selectColumnHeaderByNameAndOpenMenu(columnName: string) {
  await getPageInstance()
    .getByRole('columnheader', { name: columnName, exact: true })
    .click({
      button: 'right',
      modifiers: ['Shift'],
    });
}

/**
 * @returns {number} Column count.
 */
export async function columnsCount() {
  const count = await getPageInstance().getByRole('columnheader').count();

  return count;
}

/**
 * @returns {number} Rows count.
 */
export async function rowsCount() {
  const count = await getPageInstance().getByRole('rowheader').count();

  return count;
}

/**
 * @param {string} name Column name.
 * @param {SortDirection} direction Sort direction.
 */
export async function setColumnSorting(name: string, direction: SortDirection) {
  const columnHeader = await getPageInstance().getByRole('columnheader', {
    name,
  });

  let sortAttribute = await columnHeader.getAttribute('aria-sort');

  while (sortAttribute !== direction) {
    // eslint-disable-next-line no-await-in-loop
    await columnHeader.locator('span').click();

    // eslint-disable-next-line no-await-in-loop
    sortAttribute = await columnHeader.getAttribute('aria-sort');
  }
}

/**
 * @param {string} name Column name.
 * @param {SortDirection} direction Sort direction.
 */
export async function setAdditionalColumnSorting(
  name: string,
  direction: SortDirection
) {
  const columnHeader = await getPageInstance().getByRole('columnheader', {
    name,
  });

  let sortAttribute = await columnHeader.getAttribute('aria-sort');

  while (sortAttribute !== direction) {
    // eslint-disable-next-line no-await-in-loop
    await columnHeader.locator('span').click({ modifiers: ['Meta'] });

    // eslint-disable-next-line no-await-in-loop
    sortAttribute = await columnHeader.getAttribute('aria-sort');
  }
}

/**
 * @param {string} value Filter value.
 */
export async function filterByValue(value: string) {
  await getPageInstance().getByText('Clear', { exact: true }).click();
  await getPageInstance()
    .getByPlaceholder('Search')
    .pressSequentially(value, { delay: 100 });
  await getPageInstance().getByRole('button', { name: 'OK' }).click();
}

/**
 * @param {FilterConditions} condition Filter condition.
 * @param {string} value Filter value.
 * @param {string} secondValue Second filter value.
 */
export async function filterByCondition(
  condition: FilterConditions,
  value?: string,
  secondValue?: string
) {
  await getPageInstance()
    .getByRole('listbox')
    .locator('.htUISelectCaption')
    .click();
  await getPageInstance().getByText(condition, { exact: true }).click();

  if (value !== undefined) {
    await getPageInstance()
      .getByRole('textbox', { name: 'Value', exact: true })
      .pressSequentially(value);
  }

  if (secondValue !== undefined) {
    await getPageInstance()
      .getByRole('textbox', { name: 'Second value', exact: true })
      .pressSequentially(secondValue);
  }
  await getPageInstance().getByRole('button', { name: 'OK' }).click();
}

/**
 * Take a screenshot.
 */
export async function takeScreenshot() {
  await getPageInstance().screenshot({ path: helpers.screenshotPath() });
}

/**
 * Take a screenshot.
 *
 * @param {Locator} cell The locator of the cell.
 * @param {CellBorder} border The border to set.
 */
export async function setCellBorders(cell: Locator, border: CellBorder) {
  await cell.click({ button: 'right' });
  await getPageInstance().getByText('Borders').hover();
  await getPageInstance().getByText(border).click();
}

/**
 * @param {string} columnName Column name.
 * @param {Locator} table The locator of the table.
 */
export async function collapseNestedColumn(columnName:string, table = getDefaultTableInstance()) {
  await table.getByRole('columnheader', { name: columnName, exact: true }).locator('div').nth(1).click();
}

/**
 * @param {string} rowNumber The row number.
 * @param {Locator} table The locator of the table.
 */
export async function collapseNestedRow(rowNumber:number, table = getDefaultTableInstance()) {
  await table.getByRole('rowheader', { name: rowNumber.toString() }).locator('div').nth(1).click();
}
