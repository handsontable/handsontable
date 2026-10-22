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
 *   `data-testid="grid"` unless the page has several grids). That grid's own portal
 *   (`rootPortalElement`, where menus and the comment editor render) is always included
 *   too; the rest of the fixture page is not the product and is left out.
 * - `state` names what the spec does before it scans (`STATES` in the spec): a menu
 *   or an editor opened from the keyboard on `cell`, the comment editor opened with
 *   Ctrl+Alt+M, a selection laid, a parked data-provider fetch released, or a cell left
 *   pending.
 * - `device` names a Playwright device to emulate from the first load, for a surface that
 *   exists on a phone only.
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
  { id: 'formula-builder', fixture: 'formula-builder.html', cell: [0, 2], state: 'editor',
    surface: 'the formula bar (address box and formula input) and the open formula editor with a colored reference' },
  { id: 'formula-builder-suggestions', fixture: 'formula-builder.html', cell: [0, 2], state: 'formula-suggestions',
    surface: 'the formula editor\'s function suggestions list, which hyperformula-ui mounts in the document body' },
  { id: 'formula-builder-function-help', fixture: 'formula-builder.html', cell: [0, 2], state: 'formula-function-help',
    surface: 'the formula editor\'s function help popup, which hyperformula-ui mounts in the document body' },
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
    surface: 'the comment editor opened with Ctrl+Alt+M at a commented cell' },
  // Surfaces that only draw when a plugin, a selection or a pending value asks for them.
  { id: 'freeze-bar', fixture: 'freeze-bar.html', state: 'none',
    surface: 'the freeze bars on the header corners' },
  { id: 'selection-handles', fixture: 'selection-features.html', state: 'selection-hover',
    surface: 'the drag handles on the edges of a desktop selection' },
  { id: 'mobile-selection-handles', fixture: 'mobile-handles.html', device: 'iPhone 13', state: 'selection',
    surface: 'the selection handles a phone draws on a selection' },
  { id: 'auto-link', fixture: 'auto-link.html', state: 'none',
    surface: 'the links the autoLink option draws in cells' },
  { id: 'row-selection', fixture: 'checkbox-header.html', query: 'mode=bound', state: 'none',
    surface: 'the row selection checkboxes and their select-all checkbox' },
  { id: 'async-values', fixture: 'async-values.html', cell: [0, 1], state: 'async-pending',
    surface: 'a cell whose value is pending: the indicator, the message and aria-busy' },
  { id: 'time-editor', fixture: 'date-editor.html', cell: [0, 4], state: 'editor',
    surface: 'the open time editor' },
  { id: 'intl-date-editor', fixture: 'intl-date-editor-ime-fast-edit.html', cell: [0, 0], state: 'editor',
    surface: 'the open intl-date editor (a native date input)' },
  { id: 'intl-time-editor', fixture: 'intl-date-editor-ime-fast-edit.html', cell: [0, 2], state: 'editor',
    surface: 'the open intl-time editor (a native time input)' },
  { id: 'password-editor', fixture: 'filters-password-value-list.html', cell: [0, 0], state: 'editor',
    surface: 'the open password editor' },
  // The dark color scheme: the theme's dark class on the container (`?scheme=dark`).
  { id: 'dark-grid', fixture: 'grid.html', query: 'scheme=dark', state: 'none',
    surface: 'the plain grid in the dark color scheme' },
  { id: 'dark-context-menu', fixture: 'grid.html', query: 'scheme=dark', state: 'context-menu',
    surface: 'the context menu in the dark color scheme' },
  { id: 'dark-dropdown-menu', fixture: 'filters-value-list.html', query: 'scheme=dark', state: 'dropdown-menu',
    surface: 'the dropdown menu with the filters in the dark color scheme' },
  { id: 'dark-dialog', fixture: 'dialog-states.html', query: 'template=confirm&scheme=dark', state: 'none',
    surface: 'a modal dialog and its buttons in the dark color scheme' },
  // Right to left.
  { id: 'rtl-grid', fixture: 'grid-layouts.html', query: 'layout=rtl-nested-headers', state: 'none',
    surface: 'a right-to-left grid with nested headers' },
  { id: 'rtl-dropdown-menu', fixture: 'narrow-header-menu-button.html', root: '[data-testid="menu-sort-rtl"]',
    state: 'dropdown-menu', surface: 'the dropdown menu of a right-to-left grid' },
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
  const before = page.device ? `emulate ${page.device} (touch and a mobile user agent) before the page loads` : '';
  const steps = {
    none: 'nothing: the page is scanned as it loads',
    'context-menu': `${select}, then press Shift+F10`,
    'context-menu-submenu': `${select}, press Shift+F10, ArrowDown to "Alignment", then ArrowRight`,
    'dropdown-menu': `${select}, then press Shift+Alt+ArrowDown`,
    editor: `${select}, then press Enter`,
    comment: `${select}, then press Ctrl+Alt+M`,
    'data-provider': 'release the parked first fetch (window.htServer.release(\'ORD\'))',
    selection: select,
    'selection-hover': `select cells (${row}, ${col}) to (${row + 2}, ${col + 2}) (hot.selectCells([[${row}, ${col}, ${row + 2}, ${col + 2}]])), then move the pointer over cell (${row + 1}, ${col + 1})`,
    'async-pending': `start a request that never settles for cell (${row}, ${col}) (window.startRequest(${row}, ${col}))`,
    'formula-suggestions': `${select}, press Enter, select the editor's text (Ctrl/Cmd+A), then type "=SU"`,
    'formula-function-help': `${select}, press Enter, select the editor's text (Ctrl/Cmd+A), then type "=SUM("`,
  }[page.state];

  return before && steps ? `${before}, then ${steps}` : steps;
}
