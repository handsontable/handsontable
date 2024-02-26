import type { Locator } from '@playwright/test';
import PageHolder from './page-holder';
import { helpers } from './helpers';

/**
 * @param {number} row The row index.
 * @param {number} column The column index.
 * @param {string} cellType The type of cell.
 * @returns {Promise<Locator>} The locator of the selected cell.
 */
export function selectCell(row:number, column:number, cellType:string = 'td') : Promise<Locator> {
  const pageHolder = PageHolder.getInstance();
  const page = pageHolder.getPage();
  const table = page.locator(helpers.selectors.mainTable);
  const tbody = table.locator(helpers.selectors.mainTableBody);

  return Promise.resolve(tbody.locator(helpers.findCell({ row, column, cellType })));
}

/**
 * @param {Locator} cell The locator of the cell.
 * @returns {void}
 */
export async function openEditor(cell:Locator) {

  await cell.click();
  await cell.press('Enter');
}

/**
 * @returns {Promise<Locator>} The locator of the cell editor.
 */
export async function selectEditor() {
  const pageHolder = PageHolder.getInstance();
  const page = pageHolder.getPage();
  const table = page.locator(helpers.selectors.mainTable);
  const cellEditor = table.locator(helpers.findCellEditor());

  await cellEditor.waitFor();

  return cellEditor;
}
