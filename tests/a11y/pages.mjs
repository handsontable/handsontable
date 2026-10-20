/**
 * The pages the axe scan covers (`tests/a11y/axe.spec.ts`), one per distinct
 * accessible surface of the grid. Every page is scanned on the three themes
 * (`A11Y_THEMES` in `tests/lib/a11y-baseline.mjs`), because contrast findings
 * depend on the theme, on the plain UMD bundle.
 *
 * - `id` is the page's name in the baseline (`tests/a11y/axe-baseline.json`) and in
 *   the summary: a kebab-case slug that names the surface, not the fixture, since one
 *   fixture can be scanned in several states.
 * - `fixture` is the file under `tests/fixtures/demo/`; `query` is appended to its
 *   URL after the theme.
 * - `root` is the selector of the grid container the scan includes (the fixture's
 *   `data-testid="grid"` unless the page has several grids). The grid's portal
 *   (`.ht-portal`, where menus and the comment editor render) is always included
 *   too; the rest of the fixture page is not the product and is left out.
 * - `state` names what the spec does before it scans (`STATES` in the spec): a menu
 *   or an editor opened from the keyboard on `cell`, a comment shown through the
 *   plugin API, a parked data-provider fetch released.
 * - `surface` says what the page covers, for the reader of the baseline and of the
 *   summary.
 *
 * A `.mjs` file rather than a `.ts` one, so the tooling test
 * (`tests/lib/__tests__/a11y-baseline.test.mjs`, plain `node --test`) can read the
 * list and refuse a baseline entry whose page is gone.
 */
export const A11Y_PAGES = [
  // The grid itself, in its common shapes.
  { id: 'grid', fixture: 'grid.html', state: 'none',
    surface: 'the plain grid: table semantics, row and column headers, cells, the corner' },
  { id: 'shared-demo', fixture: 'shared-demo-grid.html', state: 'none',
    surface: 'the demo-shaped grid: merged cells, hidden-column indicators, sorting, filters, comments, custom borders' },
  { id: 'complex-demo', fixture: 'complex-demo-states.html', state: 'none',
    surface: 'every feature at once: four nested header levels, nested rows, merged cells, frozen rows and columns, hidden rows and columns' },
  { id: 'read-only', fixture: 'read-only-styling.html', root: '[data-testid="styled"]', state: 'none',
    surface: 'a read-only grid: the dimmed cell text and its contrast' },
  { id: 'checkbox', fixture: 'checkbox-header.html', state: 'none',
    surface: 'checkbox cells and the header checkbox: their labels and checked state' },
  { id: 'nested-headers', fixture: 'nested-headers-rowspan.html', root: '[data-testid="menus-grid"]', state: 'none',
    surface: 'nested headers with rowspans, collapsible groups, sortable and navigable headers' },
  { id: 'collapsible-headers', fixture: 'collapsible-indicator-dropdown-menu.html', state: 'none',
    surface: 'collapsible column groups: the collapse indicators and their expanded state' },
  { id: 'nested-rows', fixture: 'nested-rows-treegrid.html', state: 'none',
    surface: 'nested rows as a tree grid: row levels, the expand and collapse indicators' },
  { id: 'merge-cells', fixture: 'merge-cells-init-renders.html', query: 'scenario=areas', state: 'none',
    surface: 'merged cells: the spanned cell and the cells it covers' },
  { id: 'column-summary', fixture: 'column-summary-read-only.html', state: 'none',
    surface: 'a column summary row: the calculated, read-only cells' },
  { id: 'loading', fixture: 'loading-states.html', state: 'none',
    surface: 'the loading overlay: its icon, title and description over a rendered grid' },
  { id: 'empty-data', fixture: 'empty-data-state-layout.html', state: 'none',
    surface: 'the empty-data state: headers with no rows and the overlay message' },
  { id: 'sheets-bar', fixture: 'sheets-bar.html', state: 'none',
    surface: 'the sheets bar: tabs, the add and all-sheets buttons, the tab pager' },
  { id: 'data-provider-sheets-bar', fixture: 'data-provider-sheets-bar.html', state: 'data-provider',
    surface: 'the sheets bar over server data with pagination and notifications, after the first fetch lands' },
  { id: 'pagination', fixture: 'pagination-pager.html', state: 'none',
    surface: 'the pagination bar: the page buttons, the page-size select, the counter' },
  { id: 'dialog', fixture: 'dialog-states.html', query: 'template=confirm', state: 'none',
    surface: 'a modal dialog over the grid, with its Cancel and OK buttons' },
  { id: 'notification', fixture: 'notification-states.html', state: 'none',
    surface: 'a notification toast with a close button and two actions' },
  { id: 'license-bar', fixture: 'license-bar.html', query: 'width=600', state: 'none',
    surface: 'the license notification bar under the grid and its text contrast' },
  // Menus, opened from the keyboard.
  { id: 'context-menu', fixture: 'context-menu-checked-items.html', state: 'context-menu',
    surface: 'the context menu opened with Shift+F10: items, checkable items, separators' },
  { id: 'context-menu-submenu', fixture: 'context-menu-checked-items.html', state: 'context-menu-submenu',
    surface: 'the Alignment submenu opened with ArrowRight from the context menu' },
  { id: 'dropdown-menu', fixture: 'filters-value-list.html', state: 'dropdown-menu',
    surface: 'the column dropdown menu with the filters: the condition select, the value list and its search field' },
  { id: 'filters-conditions', fixture: 'filters-available-conditions.html', cell: [1, 2], state: 'dropdown-menu',
    surface: 'the filters menu on a numeric column: the condition components and their inputs' },
  // Editors, opened with Enter on the selected cell.
  { id: 'text-editor', fixture: 'grid.html', state: 'editor', surface: 'the open text editor' },
  { id: 'autocomplete-editor', fixture: 'cell-dropdown-arrow.html', query: 'cellType=autocomplete', cell: [0, 0], state: 'editor',
    surface: 'the open autocomplete editor and its choices list' },
  { id: 'dropdown-editor', fixture: 'cell-dropdown-arrow.html', query: 'cellType=dropdown', cell: [0, 0], state: 'editor',
    surface: 'the open dropdown editor and its choices list' },
  { id: 'handsontable-editor', fixture: 'cell-dropdown-arrow.html', query: 'cellType=handsontable', cell: [0, 0], state: 'editor',
    surface: 'the open handsontable editor: a grid inside the editor' },
  { id: 'multiselect-editor', fixture: 'cell-dropdown-arrow.html', query: 'cellType=multiselect', cell: [0, 0], state: 'editor',
    surface: 'the open multiselect editor: the chips, the search field and the option list' },
  { id: 'select-editor', fixture: 'icon-elements.html', query: 'selectEditor=1', cell: [0, 3], state: 'editor',
    surface: 'the open select editor (a native select)' },
  { id: 'date-editor', fixture: 'date-editor.html', cell: [0, 1], state: 'editor',
    surface: 'the open date editor (a native date input)' },
  { id: 'datetime-editor', fixture: 'date-editor.html', cell: [0, 5], state: 'editor',
    surface: 'the open intl-datetime editor' },
  // Other popups.
  { id: 'comments', fixture: 'comments-editor-resize.html', state: 'comment',
    surface: 'the comment editor shown at a commented cell' },
];

/**
 * The fixture URL a page is scanned at, relative to the fixture server (`support/static-server.mjs`,
 * `http://localhost:8123` by default).
 *
 * @param {{fixture: string, query?: string}} page The page.
 * @param {string} theme The theme.
 * @returns {string} The path and query.
 */
export function fixtureUrl(page, theme) {
  return `/tests/fixtures/demo/${page.fixture}?theme=${theme}${page.query ? `&${page.query}` : ''}`;
}

/**
 * How to reach the state a page is scanned in, in words: the steps `STATES` in `axe.spec.ts`
 * performs, for a person or an agent who opens the fixture by hand.
 *
 * @param {{state: string, cell?: [number, number]}} page The page.
 * @returns {string} The steps.
 */
export function stateSteps(page) {
  const [row, col] = page.cell ?? [1, 1];
  const select = `select cell (${row}, ${col}) (hot.selectCell(${row}, ${col}))`;

  return {
    none: 'nothing: the page is scanned as it loads',
    'context-menu': `${select}, then press Shift+F10`,
    'context-menu-submenu': `${select}, press Shift+F10, ArrowDown to "Alignment", then ArrowRight`,
    'dropdown-menu': `${select}, then press Shift+Alt+ArrowDown`,
    editor: `${select}, then press Enter`,
    comment: `${select}, then press Ctrl+Alt+M`,
    'data-provider': 'release the parked first fetch (window.htServer.release(\'ORD\'))',
  }[page.state];
}
