import type { Locator } from '@playwright/test';
import PageHolder from './page-holder';
import { helpers } from './helpers';

type ModifierKey = 'Meta' | 'Control' | 'Alt' | 'ControlOrMeta' | 'Shift';

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

// eslint-disable-next-line no-shadow
export enum LayoutDirection {
  LTR = 'ltr',
  RTL = 'rtl',
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
  const page = getPageInstance();
  const mainTableLocator = page.locator(helpers.selectors.mainTable);
  const themesMainTableLocator = page.locator(helpers.selectors.themesMainTable);

  return mainTableLocator.first().or(themesMainTableLocator.first());
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
  await cell.waitFor(); // Ensure the cell is available
  await retry(async() => {
    await cell.click();
    await cell.press('Enter');
  });
}

/**
 * @param {Locator} cell The locator of the cell.
 */
export async function openContextMenu(cell: Locator) {
  await cell.waitFor(); // Ensure the cell is available
  await retry(async() => {
    await cell.click({ button: 'right' });
  });
}

/**
 * @param {string} alignment The alignment to set.
 * @param {Locator} cell The locator of the cell.
 */
export async function setCellAlignment(alignment: string, cell: Locator) {
  await cell.waitFor(); // Ensure the cell is available
  await cell.click();
  await cell.click({ button: 'right' });
  const menu = await getPageInstance().getByRole('menu');

  await menu.waitFor();
  await menu.getByRole('menuitem', { name: 'Alignment' }).hover();
  await menu.getByText(alignment, { exact: true }).click();
}

/**
 * Retry a function multiple times.
 *
 * @param {Function} fn - The function to retry.
 * @param {number} retries - The number of retries.
 */
async function retry(fn: Function, retries: number = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await fn();

      return;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
    }
  }
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
export async function clickCell(cell:Locator) {

  await cell
    .click();
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
  const table = getDefaultTableInstance();
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
export async function selectFromContextMenu(option: string) {
  const contextMenu = getPageInstance().locator(
    helpers.selectors.contextMenu
  );

  await contextMenu.locator(option).click();
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
 * @param {Locator} table The locator of the table.
 */
export async function selectColumnHeaderByNameAndOpenMenu(
  columnName: string,
  table = getDefaultTableInstance(),
) {
  await table
    .getByRole('columnheader', { name: columnName, exact: true })
    .click({
      button: 'right',
    });
}

/**
 * @param {number} columnIndex Cell locator.
 * @param {ModifierKey} modifiers Optional click modifiers.
 */
export async function selectColumnHeaderByIndex(columnIndex: number, modifiers: ModifierKey[] = []) {
  const table = getPageInstance().locator(helpers.selectors.mainTable);

  await table.getByRole('columnheader').nth(columnIndex).click({ modifiers });
}
/**
 * @param {number} rowIndex Cell locator.
 * @param {ModifierKey} modifiers Optional click modifiers.
 */
export async function selectRowHeaderByIndex(rowIndex: number, modifiers: ModifierKey[] = []) {
  const table = getPageInstance().locator(helpers.selectors.mainTable);

  await table.getByRole('rowheader').nth(rowIndex).click({ modifiers });
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
 * @param {number} index Column index.
 */
export async function clearColumn(index: number) {
  openHeaderDropdownMenu(index);
  await getPageInstance().getByText('Clear column').click();

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
  await getPageInstance().getByText('Clear', { exact: true }).click(); // deselect all checkboxes
  await getPageInstance()
    .getByPlaceholder('Search')
    .pressSequentially(value, { delay: 100 });
  await getPageInstance().getByText('Select all', { exact: true }).click(); // select only that filtered one
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
  await getPageInstance().waitForTimeout(500);

}

/**
 * Undo the last action.
 */
export async function undo() {
  const isMac = process.platform === 'darwin';

  if (isMac) {
    await getPageInstance().keyboard.press('Meta+Z');
  } else {
    await getPageInstance().keyboard.press('Control+Z');
  }
}

/**
 * Redo the last action.
 */
export async function redo() {
  const isMac = process.platform === 'darwin';

  if (isMac) {
    await getPageInstance().keyboard.press('Meta+Y');
  } else {
    await getPageInstance().keyboard.press('Control+Y');
  }
}

/**
 * @param {string} columnName Column name.
 * @param {number} resizeAmount Resize amount.
 */
export async function resizeColumn(columnName: string, resizeAmount: number) {
  const columnHeader = getPageInstance().getByRole('columnheader', { name: columnName });

  const box = await columnHeader.boundingBox();

  if (box) {
    await getPageInstance().mouse.move(box.x + box.width - 3, box.y + (box.height / 2));
    await getPageInstance().waitForTimeout(500);

    // Drag the resize handle to resize the column
    await getPageInstance().mouse.down();
    await getPageInstance().mouse.move(box.x + box.width + resizeAmount, box.y + (box.height / 2), { steps: 10 }); // Adjust the value to resize the column
    await getPageInstance().mouse.up();
  }
}

/**
 * @param {number} rowIndex Row index.
 * @param {number} resizeAmount Resize amount.
 * @param {Locator} tableLocator The locator of the page.
 */
export async function resizeRow(rowIndex: number, resizeAmount: number, tableLocator = getDefaultTableInstance()) {

  const box = await tableLocator.getByRole('rowheader').nth(rowIndex).boundingBox();

  if (box) {
    // Move to the bottom border of the row header
    await getPageInstance().mouse.move(box.x + (box.width / 2), box.y + box.height - 3);
    // Add a small delay to ensure the hover action is registered
    await getPageInstance().waitForTimeout(500);

    // Drag the resize handle to resize the row
    await getPageInstance().mouse.down();
    await getPageInstance().mouse.move(box.x + (box.width / 2), box.y + box.height + resizeAmount, { steps: 10 }); // Adjust the value to resize the row
    await getPageInstance().mouse.up();
  }
}
