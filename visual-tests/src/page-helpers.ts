import { expect, type Locator } from '@playwright/test';
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
  Contains = 'Contains',
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
 * Closes any menu (context or dropdown).
 */
export async function closeTheMenu() {
  await clickRelativeToViewport(0, 0, 'left');
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
 * @param {string | number} columnNameOrIndex The column name or index.
 */
export async function openHeaderDropdownMenu(columnNameOrIndex: string | number) {
  const table = getDefaultTableInstance();
  let element: Locator;

  if (typeof columnNameOrIndex === 'number') {
    element = table.locator(helpers.findDropdownMenuExpander({ col: columnNameOrIndex }));
  } else {
    element = table.locator(`.ht_clone_top th:has-text("${columnNameOrIndex}") .changeType`);
  }

  await element.click();
}

/**
 * @param {string} option Cell locator.
 */
export async function selectFromDropdownMenu(option: string) {
  const contextMenu = getPageInstance().locator(
    helpers.selectors.dropdownMenu
  );

  const element = contextMenu.locator(`[aria-label="${option}"]`);
  const elementClass = await element.getAttribute('class');

  await element.click();

  if (elementClass?.includes('htSubmenu')) {
    await waitForDropdownSubmenuToAppear(option);
  }
}

/**
 * @param {string} option Cell locator.
 */
export async function selectFromContextMenu(option: string) {
  const contextMenu = getPageInstance().locator(
    helpers.selectors.contextMenu
  );

  const element = contextMenu.locator(`[aria-label="${option}"]`);
  const elementClass = await element.getAttribute('class');

  await element.click();

  if (elementClass?.includes('htSubmenu')) {
    await waitForContextSubmenuToAppear(option);
  }
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
 * The header cells that are 1:1 with COLUMNS, which `getByRole('columnheader')` on its own is not.
 *
 * That role matches every header cell the grid draws: both rows of a nested header, and one copy per
 * overlay. Counting through all of them is not counting columns. Measured on `arabic-rtl-demo`
 * (10 columns, a two-row nested header): 17 matches, of which the first seven are the GROUP row, so
 * `nth(2)` lands on the label above column 5 and `nth(5)` on a spacer above column 8. The spec that
 * asked for columns 2 and 5 photographed 5 through 8, and had done so for as long as the goldens
 * existed.
 *
 * The group row is also the unstable one. Its cells are a function of the rendered window: a
 * colspanned label is drawn across the part of its span that is rendered, and the columns outside it
 * fall back to spacers, so a window that starts or ends one column over changes how many cells sit
 * before the leaf row — and every index after them moves with it. The same `nth(5)` then picks a
 * different column in two runs of the same build, which is what turned up as
 * `selection-arabic-rtl-demo-2.png` (#13568) and `selection-nested-headers-demo-{2,3}.png` (#13587)
 * flipping between two correct-looking images. Only the two demos in that spec's list that HAVE a
 * nested header ever flaked; the three with a single header row never did, because a single header
 * row has no group cells to shift. Nothing waits that out, either: the wrong element is chosen before
 * the capture, so the settle in `test-runner.ts` has nothing left to settle.
 *
 * The last header row is the one that always has exactly one cell per RENDERED column, whatever the
 * nesting above it. The corner cell is excluded by role — it carries `gridcell button` ("Select whole
 * grid"), not `columnheader`. Rendered, not total: the grid virtualizes, so this list starts at the
 * first column in the viewport rather than at column 0, and {@link columnPositionOf} is what turns a
 * source column into a position inside it.
 */
const COLUMN_HEADER_CELLS = '.ht_clone_top thead tr:last-child > th[role="columnheader"]';

/**
 * The same cells for the FROZEN columns, which the top overlay also draws but cannot be clicked in.
 *
 * A frozen column's header exists twice, at the same coordinates: once in the top overlay and once in
 * the corner overlay that is painted over it. Measured on `cell-types-demo`: a click at the centre of
 * the top overlay's copy is received by the corner's, so Playwright's hit-target check fails the
 * target it was given and the call times out on "intercepts pointer events" — and the corner's copy
 * is the one that takes the click. The corner renders exactly the frozen prefix, from index 0, so no
 * window arithmetic applies to it.
 */
const FROZEN_COLUMN_HEADER_CELLS =
  '.ht_clone_top_inline_start_corner thead tr:last-child > th[role="columnheader"]';

/**
 * The row-header cells, scoped for the same reason as {@link COLUMN_HEADER_CELLS}.
 *
 * Rows have no equivalent of the group row, so this selects what an unscoped `getByRole('rowheader')`
 * already selected — the inline-start overlay's headers, in row order. It is written out anyway
 * because the two helpers are read together, and because the unscoped form is only accidentally
 * right: it depends on no other overlay drawing a row header above this one in document order. Rows
 * virtualize like columns, so this list is the rendered window too.
 */
const ROW_HEADER_CELLS = '.ht_clone_inline_start tbody > tr > th[role="rowheader"]';

/**
 * The row headers frozen to the TOP, which the corner overlay covers exactly as it covers a frozen
 * column's header. Measured on `custom-borders-demo` (`fixedRowsTop: 2`): the corner holds those two
 * row headers and intercepts the inline-start overlay's copies of them.
 *
 * Rows frozen to the BOTTOM are covered the same way by `ht_clone_bottom_inline_start_corner`, and
 * are not resolved here because they sit at the end of the row list rather than at a known index -
 * addressing them by index would need the row count. No spec does; one that tries fails loudly on
 * the same interception rather than photographing the wrong row.
 */
const FROZEN_ROW_HEADER_CELLS = '.ht_clone_top_inline_start_corner tbody > tr > th[role="rowheader"]';

/**
 * Finds where a SOURCE column or row sits inside the rendered window, or -1 when it is not rendered.
 *
 * The headers cannot answer this themselves. A header's `aria-colindex` is `visibleColumnIndex + 1` -
 * relative to the window, so it restarts at 2 whatever is scrolled off to the left. The DATA cells
 * carry the absolute one (`sourceColumnIndex` in the cells renderer), and body rows carry an absolute
 * `aria-rowindex`, so the master's first rendered row is the grid's own map from source index to
 * position. Measured on `large-dataset-demo` (many columns in a 500px viewport): at rest the first
 * header is `A` and the first cell's `aria-colindex` is 2; scrolled to 3000px the first header is
 * `BA` and the first cell's is 54. Both lists move together, which is what makes one an index into
 * the other.
 *
 * This searches for the absolute index rather than subtracting a window offset, so a frozen prefix
 * that the master renders at the head of the window needs no special case — it is simply found where
 * it is.
 *
 * A grid with no data rows carries no absolute index at all, so this refuses there rather than
 * guessing — an empty `rendered` is how the caller tells that case apart from a target that is simply
 * scrolled out of view.
 *
 * @param {Locator} table The grid's root locator.
 * @param {number} index Zero-based source column or row index.
 * @param {'column' | 'row'} axis Which axis `index` counts along.
 * @returns {Promise<{position: number, rendered: number[]}>} The position within the rendered window
 * (-1 when the target is not rendered, or when no data row exists to read the window from), and every
 * source index the window currently holds (empty in that second case).
 */
async function positionInRenderedWindow(table: Locator, index: number, axis: 'column' | 'row') {
  return table.evaluate((grid, [wanted, which]: [number, string]) => {
    const rows = [...grid.querySelectorAll('.ht_master tbody tr')];

    if (rows.length === 0) {
      // No data rows means no absolute index anywhere in the DOM: a header's own `aria-colindex` is
      // window-relative, and the cells that carry the absolute one are what is missing. Headers still
      // virtualize on a grid with `colHeaders` and no data (`empty-data-state-demo` renders its
      // headers over zero body rows), so treating the index as its own position here would be the
      // guess this function exists to remove — and past the rendered count it degrades into a
      // Playwright timeout with nothing to read. Refuse, and let the caller say why.
      return { position: -1, rendered: [] };
    }

    if (which === 'row') {
      // `aria-rowindex` counts the header rows first, so the offset is how many of them there are.
      const headerRows = grid.querySelectorAll('.ht_master thead tr').length;
      const sources = rows.map(row => Number(row.getAttribute('aria-rowindex')) - headerRows - 1);

      return { position: sources.indexOf(wanted), rendered: sources };
    }

    // `aria-colindex` counts the row headers first, and every rendered row carries the same columns.
    const rowHeaders = rows[0].querySelectorAll('th').length;
    const sources = [...rows[0].querySelectorAll('td')]
      .map(cell => Number(cell.getAttribute('aria-colindex')) - rowHeaders - 1);

    return { position: sources.indexOf(wanted), rendered: sources };
  }, [index, axis] as [number, string]);
}

/**
 * Resolves a header by SOURCE index, choosing the copy a pointer can actually reach.
 *
 * Two corrections sit between "index" and "the element to click". The frozen headers are drawn twice
 * and only the corner overlay's copy takes a click; they are a prefix in both axes, and the overlay
 * that holds them renders exactly those, so its count is where the prefix ends. Everything past it is
 * addressed through {@link positionInRenderedWindow}, because the scrollable overlays hold the
 * rendered window rather than the whole grid.
 *
 * A column or row that is not rendered has no header to click, so this refuses rather than clicking
 * the nearest one — the failure a silent `.nth()` would have produced is the bug this whole file is
 * fixing.
 *
 * @param {string} cells Selector for the axis's header cells in the overlay that scrolls.
 * @param {string} frozenCells Selector for the frozen prefix's cells in the overlay painted on top.
 * @param {number} index Zero-based source index along the axis.
 * @param {'column' | 'row'} axis Which axis `index` counts along.
 * @returns {Promise<Locator>} The header cell to click.
 */
async function headerCellAt(
  cells: string,
  frozenCells: string,
  index: number,
  axis: 'column' | 'row',
): Promise<Locator> {
  const table = getPageInstance().locator(helpers.selectors.mainTable);
  const frozen = table.locator(frozenCells);
  const frozenCount = await frozen.count();

  if (index < frozenCount) {
    return frozen.nth(index);
  }

  const { position, rendered } = await positionInRenderedWindow(table, index, axis);

  if (position < 0) {
    throw new Error(rendered.length === 0
      ? `${axis} ${index} cannot be addressed by index on a grid with no data rows: the only absolute `
        + 'column and row indexes the grid puts in the DOM are the ones on cells, and there are none, '
        + 'while the headers themselves still virtualize. Address the header by name instead '
        + '(getByRole(\'columnheader\', { name })). A FROZEN header is still addressable by index, '
        + 'because the corner overlay renders exactly that prefix. See headerCellAt() in '
        + 'visual-tests/src/page-helpers.ts.'
      : `${axis} ${index} is not rendered, so it has no header to click. The grid currently renders `
        + `${axis}s ${rendered[0]}-${rendered[rendered.length - 1]}; scroll the target into view first, `
        + 'or address the header by name. See headerCellAt() in visual-tests/src/page-helpers.ts.');
  }

  return table.locator(cells).nth(position);
}

/**
 * Clicks the header of COLUMN `columnIndex` — the column, not the nth header cell in the grid.
 *
 * See {@link COLUMN_HEADER_CELLS} for why those are different and which screenshots the difference
 * cost. The highlight assertion afterwards is what makes the capture that usually follows
 * deterministic: a click resolves as soon as the event is dispatched, and the selection is painted a
 * frame later, so without it a screenshot can record the grid mid-update. It is anchored on purpose -
 * the header beside an active one carries `ht__active_highlight-prev`, which an unanchored pattern
 * would accept, and then a click that landed one header over would still pass.
 *
 * @param {number} columnIndex Zero-based column index.
 * @param {ModifierKey} modifiers Optional click modifiers.
 */
export async function selectColumnHeaderByIndex(columnIndex: number, modifiers: ModifierKey[] = []) {
  const header = await headerCellAt(
    COLUMN_HEADER_CELLS, FROZEN_COLUMN_HEADER_CELLS, columnIndex, 'column');

  await header.click({ modifiers });
  await expect(header).toHaveClass(/(^|\s)ht__(active_)?highlight(\s|$)/);
}
/**
 * Clicks the header of ROW `rowIndex`.
 *
 * @param {number} rowIndex Zero-based row index.
 * @param {ModifierKey} modifiers Optional click modifiers.
 */
export async function selectRowHeaderByIndex(rowIndex: number, modifiers: ModifierKey[] = []) {
  const header = await headerCellAt(ROW_HEADER_CELLS, FROZEN_ROW_HEADER_CELLS, rowIndex, 'row');

  await header.click({ modifiers });
  await expect(header).toHaveClass(/(^|\s)ht__(active_)?highlight(\s|$)/);
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
 * @param {string | number} columnNameOrIndex Column name or index.
 */
export async function clearColumn(columnNameOrIndex: string | number) {
  openHeaderDropdownMenu(columnNameOrIndex);

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
  const page = getPageInstance();

  await page.getByRole('listbox').locator('.htUISelectCaption').click();
  await page.getByText(condition, { exact: true }).click();

  if (value !== undefined) {
    const valueInput = page.getByRole('textbox', { name: 'Value', exact: true });

    // BEFORE the click, not after it. Choosing a condition focuses this input on a 10 ms timer
    // (`filters/component/condition.ts`, the `index === 0` branch), and the click focuses it too — so
    // an assertion placed after the click passes on its first poll and waits for nothing, leaving the
    // timer free to fire mid-typing. Waiting for the hand-off first is what makes the state
    // deterministic; the click then only places the caret. The filters visual spec
    // `tab-navigation-through-condition-components` waits the same way. The second input has no such
    // timer (the engine defers only the first).
    await expect(valueInput).toBeFocused();
    await valueInput.click();
    await valueInput.pressSequentially(value);
  }

  if (secondValue !== undefined) {
    const secondValueInput = page.getByRole('textbox', { name: 'Second value', exact: true });

    await secondValueInput.waitFor({ state: 'visible' });
    await secondValueInput.click();
    await secondValueInput.pressSequentially(secondValue);
  }

  await page.getByRole('button', { name: 'OK' }).click();
}

/**
 * Clicks the "Go to first page" button in the pagination section.
 *
 * @param {string} value The value to select in the page size dropdown.
 */
export async function forPaginationChangePageSize(value: string) {
  const select = getPageInstance()
    .locator('.ht-page-size-section')
    .locator('select[name="pageSize"]');

  await select.selectOption(value);
}

/**
 * Clicks the "Go to first page" button in the pagination section.
 */
export async function forPaginationClickFirstPageButton() {
  const button = getPageInstance()
    .locator('.ht-page-navigation-section')
    .locator('.ht-page-first');

  await button.click();
}

/**
 * Clicks the "Go to previous page" button in the pagination section.
 */
export async function forPaginationClickPrevPageButton() {
  const button = getPageInstance()
    .locator('.ht-page-navigation-section')
    .locator('.ht-page-prev');

  await button.click();
}

/**
 * Clicks the "Go to next page" button in the pagination section.
 */
export async function forPaginationClickNextPageButton() {
  const button = getPageInstance()
    .locator('.ht-page-navigation-section')
    .locator('.ht-page-next');

  await button.click();
}

/**
 * Clicks the "Go to last page" button in the pagination section.
 */
export async function forPaginationClickLastPageButton() {
  const button = getPageInstance()
    .locator('.ht-page-navigation-section')
    .locator('.ht-page-last');

  await button.click();
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
  // eslint-disable-next-line no-restricted-syntax -- DEV-2797: fixed delay inherited from the 2024 import; replace with the asserted state (toBeVisible / toBeFocused / a settled helper) when this family is consolidated
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
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: the resize handle appears on hover with no class to wait for yet; replace with a hover-state probe when this helper is reworked
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
    // eslint-disable-next-line no-restricted-syntax -- DEV-2797: the resize handle appears on hover with no class to wait for yet; replace with a hover-state probe when this helper is reworked
    await getPageInstance().waitForTimeout(500);

    // Drag the resize handle to resize the row
    await getPageInstance().mouse.down();
    await getPageInstance().mouse.move(box.x + (box.width / 2), box.y + box.height + resizeAmount, { steps: 10 }); // Adjust the value to resize the row
    await getPageInstance().mouse.up();
  }
}

/**
 * Converts viewport-relative offsets to absolute viewport coordinates (CSS pixels).
 * Positive offsets are from left/top; negative are from right/bottom.
 *
 * @param {number} offsetX The offset X. Positive values move the mouse from the left position (0), negative
 * values move the mouse from the right position (viewport width).
 * @param {number} offsetY The offset Y. Positive values move the mouse from the top position (0), negative
 * values move the mouse from the bottom position (viewport height).
 * @returns {object} The x and y coordinates.
 */
function viewportOffsetToCoordinates(offsetX: number, offsetY: number): { x: number; y: number } {
  const viewportSize = getPageInstance().viewportSize();
  let x = offsetX;
  let y = offsetY;

  if (offsetX < 0) {
    x = Math.max(0, viewportSize!.width + offsetX);
  }
  if (offsetY < 0) {
    y = Math.max(0, viewportSize!.height + offsetY);
  }

  x = Math.min(x, viewportSize!.width);
  y = Math.min(y, viewportSize!.height);

  return { x, y };
}

/**
 * Clicks the page at the specified offset relative to the viewport.
 *
 * @param {number} offsetX The offset X. Positive values move the mouse from the left position (0), negative
 * values move the mouse from the right position (viewport width).
 * @param {number} offsetY The offset Y. Positive values move the mouse from the top position (0), negative
 * values move the mouse from the bottom position (viewport height).
 * @param {string} button The button to click.
 */
export async function clickRelativeToViewport(
  offsetX: number,
  offsetY: number,
  button: 'left' | 'right' = 'left',
) {
  const { x, y } = viewportOffsetToCoordinates(offsetX, offsetY);

  await getPageInstance().mouse.click(x, y, {
    button,
  });
}

/**
 * Double-clicks the page at the specified offset relative to the viewport.
 * Uses Playwright's native dblclick so the browser fires a real `dblclick` DOM event (clickCount: 2).
 *
 * @param {number} offsetX The offset X. Positive values move the mouse from the left position (0), negative
 * values move the mouse from the right position (viewport width).
 * @param {number} offsetY The offset Y. Positive values move the mouse from the top position (0), negative
 * values move the mouse from the bottom position (viewport height).
 * @param {string} button The button to click.
 */
export async function doubleClickRelativeToViewport(
  offsetX: number,
  offsetY: number,
  button: 'left' | 'right' = 'left',
) {
  const { x, y } = viewportOffsetToCoordinates(offsetX, offsetY);

  await getPageInstance().mouse.dblclick(x, y, {
    button,
  });
}

/**
 * Scrolls the Handsontable to the most bottom.
 */
export async function scrollTableToTheBottom() {
  await getPageInstance().evaluate(async(selector) => {
    // eslint-disable-next-line no-restricted-globals
    const element = document.querySelector(selector);

    if (element) {
      element.scrollTop = element.scrollHeight;

      await new Promise((resolve) => {
        const listener = () => {
          element.removeEventListener('scroll', listener);
          resolve(selector);
        };

        element.addEventListener('scroll', listener);
      });
    }
  }, `${helpers.selectors.mainTable} .wtHolder`);
}

/**
 * Scrolls the Handsontable to the most end (horizontally).
 */
export async function scrollTableToTheInlineEnd() {
  await getPageInstance().evaluate(async(selector) => {
    // eslint-disable-next-line no-restricted-globals
    const element = document.querySelector(selector);

    if (element) {
      if (element.parentElement?.getAttribute('dir') === 'rtl') {
        element.scrollLeft = -element.scrollWidth;
      } else {
        element.scrollLeft = element.scrollWidth;
      }

      await new Promise((resolve) => {
        const listener = () => {
          element.removeEventListener('scroll', listener);
          resolve(selector);
        };

        element.addEventListener('scroll', listener);
      });
    }
  }, `${helpers.selectors.mainTable} .wtHolder`);
}

/**
 * Scrolls the browser window to the specified coordinates.
 *
 * @param {number} x The x-coordinate to scroll to.
 * @param {number} y The y-coordinate to scroll to.
 */
export async function scrollWindowTo(x: number, y: number) {
  /* eslint-disable no-restricted-globals */
  await getPageInstance().evaluate(([xPos, yPos]) => {
    return new Promise((resolve) => {
      const listener = () => {
        window.removeEventListener('scroll', listener);
        resolve([xPos, yPos]);
      };

      window.addEventListener('scroll', listener);
      window.scrollTo(xPos, yPos);
    });
  }, [x, y]);
}

/**
 * Waits for the context submenu to appear on the page.
 *
 * @param {string} submenuName The name of the submenu.
 */
export async function waitForContextSubmenuToAppear(submenuName: string) {
  await getPageInstance().waitForSelector(`.htContextMenuSub_${submenuName}`);
}

/**
 * Waits for the dropdown submenu to appear on the page.
 *
 * @param {string} submenuName The name of the submenu.
 */
export async function waitForDropdownSubmenuToAppear(submenuName: string) {
  await getPageInstance().waitForSelector(`.htDropdownMenuSub_${submenuName}`);
}

/**
 * Updates Handsontable settings.
 *
 * @param {object} options Handsontable settings options.
 */
export async function forHandsontableUpdateSettings(options) {
  await getPageInstance().evaluate(async(hotOptions) => {
    // eslint-disable-next-line no-restricted-globals
    const hotInstance = document.defaultView?.hotInstance;

    hotInstance.updateSettings(hotOptions);
  }, options);
}
