import type { Locator, Page } from '@playwright/test';

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
// full instance type, and narrowing it here would be a TS2430 conflict. Every access is cast.
interface RowSelectionWindow {
  hot: {
    getPlugin(name: 'rowSelection'): { getSelectedRows(): number[] };
    getSelected(): number[][] | undefined;
  };
  rowSelectionEvents: Array<{ selected: number[]; deselected: number[]; source: string }>;
}

/**
 * Helpers shared by the page objects of the PRO-87 fixtures (`RowSelectionPage`,
 * `CheckboxHeaderPage`): both read the same RowSelection state, cell selection, hook log, and
 * header checkbox geometry.
 */

/**
 * How far a header checkbox's vertical center sits from its header cell's, in pixels. Measured in
 * one evaluation, so a re-render cannot land between the two reads.
 *
 * @param {Locator} checkbox The checkbox in a header cell.
 * @returns {Promise<number>}
 */
export async function verticalOffsetInHeader(checkbox: Locator): Promise<number> {
  return checkbox.evaluate((element) => {
    const input = element.getBoundingClientRect();
    const cell = element.closest('th')!.getBoundingClientRect();

    return (input.top + (input.height / 2)) - (cell.top + (cell.height / 2));
  });
}

/**
 * The rows the RowSelection plugin reports as selected, in visual indexes.
 *
 * @param {Page} page The fixture page.
 * @returns {Promise<number[]>}
 */
export async function selectedRows(page: Page): Promise<number[]> {
  return page.evaluate(() => (window as unknown as RowSelectionWindow).hot
    .getPlugin('rowSelection').getSelectedRows());
}

/**
 * The cell selection, which a checkbox press must leave alone.
 *
 * @param {Page} page The fixture page.
 * @returns {Promise<number[][] | undefined>}
 */
export async function cellSelection(page: Page): Promise<number[][] | undefined> {
  return page.evaluate(() => (window as unknown as RowSelectionWindow).hot.getSelected());
}

/**
 * The sources of the `afterRowSelectionChange` calls the fixture logged so far.
 *
 * @param {Page} page The fixture page.
 * @returns {Promise<string[]>}
 */
export async function rowSelectionSources(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as RowSelectionWindow).rowSelectionEvents
    .map(event => event.source));
}
