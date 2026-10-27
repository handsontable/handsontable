/**
 * The states the axe discovery run scans beyond the catalog (`../pages.mjs`): surfaces a keyboard or a
 * pointer reaches that no catalog page holds still. Same shape as a catalog entry; `state` names an
 * opener of `DISCOVERY_STATES` in `axe-discovery.spec.ts` (or one of the harness's `STATES`). The
 * gating scan never reads this list, so a page here adds nothing to its baseline.
 */
export const DISCOVERY_PAGES = [
  { id: 'focused-cell', fixture: 'grid.html', state: 'focused-cell',
    surface: 'a cell focused from the keyboard, with its focus ring' },
  { id: 'header-button-hover', fixture: 'filters-value-list.html', cell: [0, 1], state: 'header-button-hover',
    surface: 'a column header\'s menu button under the pointer' },
  { id: 'sort-menu', fixture: 'narrow-header-menu-button.html', root: '[data-testid="menu-sort"]', state: 'dropdown-menu',
    surface: 'the column menu of a sortable grid, left to right' },
  { id: 'filter-option-focused', fixture: 'filters-value-list.html', state: 'filter-option-focused',
    surface: 'an option of the filter value list holding the keyboard focus' },
  { id: 'multi-range', fixture: 'keyboard-shortcuts.html', state: 'multi-range',
    surface: 'a selection of two ranges' },
  { id: 'context-menu-submenu-2', fixture: 'keyboard-shortcuts.html', query: 'menu=nested', state: 'context-menu-submenu-2',
    surface: 'a submenu opened inside a submenu' },
  { id: 'sheets-bar-rename', fixture: 'sheets-bar.html', state: 'sheets-bar-rename',
    surface: 'a sheet tab being renamed' },
  { id: 'dialog-focused', fixture: 'dialog-states.html', query: 'template=confirm', state: 'dialog-focused',
    surface: 'a modal dialog holding the keyboard focus on its first button' },
];
