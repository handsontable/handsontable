/**
 * Which rows the "select all" checkbox acts on.
 *
 * - `'all'` - every row of the dataset, including the rows the Filters plugin filtered out.
 * - `'filtered'` - the rows that pass the active filters, on every page.
 * - `'currentPage'` - the rows of the page the Pagination plugin shows.
 */
export type SelectAllScope = 'all' | 'filtered' | 'currentPage';

/**
 * The state the "select all" checkbox shows.
 */
export type HeaderCheckboxState = 'checked' | 'unchecked' | 'mixed' | 'disabled';

/**
 * The result of {@link computeHeaderCheckboxState}.
 */
export interface HeaderCheckboxSummary {
  /**
   * The state the "select all" checkbox shows.
   */
  state: HeaderCheckboxState;
  /**
   * The number of selected rows in the scope.
   */
  selected: number;
  /**
   * The number of selectable rows in the scope.
   */
  total: number;
}

/**
 * The questions the scope resolution asks the grid. Kept as a plain interface so the rules can be
 * unit-tested without a Handsontable instance.
 */
export interface ScopeHost {
  /**
   * The number of physical rows (the length of the index mapper, trimmed rows included).
   */
  countPhysicalRows(): number;
  /**
   * The number of visual rows (rows that are not trimmed).
   */
  countVisualRows(): number;
  /**
   * Translates a visual row index into a physical one.
   */
  toPhysicalRow(visualRow: number): number | null;
  /**
   * The visual range of the current page, or `null` when the grid is not paginated.
   */
  getCurrentPageRange(): [number, number] | null;
  /**
   * Tells whether the TrimRows plugin trimmed the physical row. Such a row is out of every scope.
   */
  isExcludedByTrimRows(physicalRow: number): boolean;
  /**
   * Tells whether the HiddenRows plugin hid the physical row. Such a row is out of every scope.
   */
  isExcludedByHiddenRows(physicalRow: number): boolean;
  /**
   * Tells whether the row can be selected at all (`isRowSelectable`, NestedRows levels).
   */
  isRowSelectable(physicalRow: number): boolean;
}

/**
 * Tells whether the value is one of the supported scopes.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
export function isSelectAllScope(value: unknown): value is SelectAllScope {
  return value === 'all' || value === 'filtered' || value === 'currentPage';
}

/**
 * Collects the physical indexes of the selectable rows in the scope, in visual order where one
 * exists (`'filtered'`, `'currentPage'`) and in physical order otherwise (`'all'`).
 *
 * @param {ScopeHost} host The grid adapter.
 * @param {SelectAllScope} scope The scope to resolve.
 * @returns {number[]}
 */
export function collectRowsInScope(host: ScopeHost, scope: SelectAllScope): number[] {
  const rows: number[] = [];
  const pushIfInScope = (physicalRow: number | null) => {
    if (
      physicalRow === null ||
      host.isExcludedByTrimRows(physicalRow) ||
      host.isExcludedByHiddenRows(physicalRow) ||
      !host.isRowSelectable(physicalRow)
    ) {
      return;
    }

    rows.push(physicalRow);
  };

  if (scope === 'all') {
    const physicalRowsCount = host.countPhysicalRows();

    for (let physicalRow = 0; physicalRow < physicalRowsCount; physicalRow++) {
      pushIfInScope(physicalRow);
    }

    return rows;
  }

  let first = 0;
  let last = host.countVisualRows() - 1;
  const pageRange = scope === 'currentPage' ? host.getCurrentPageRange() : null;

  if (pageRange) {
    [first, last] = pageRange;
  }

  for (let visualRow = first; visualRow <= last && visualRow >= 0; visualRow++) {
    pushIfInScope(host.toPhysicalRow(visualRow));
  }

  return rows;
}

/**
 * Computes what the "select all" checkbox shows for the rows in its scope. The checkbox describes
 * exactly the rows a click acts on, so the same row list feeds both.
 *
 * @param {number[]} rowsInScope Physical indexes of the selectable rows in the scope.
 * @param {Function} isSelected Tells whether a physical row is selected.
 * @returns {HeaderCheckboxSummary}
 */
export function computeHeaderCheckboxState(
  rowsInScope: number[],
  isSelected: (physicalRow: number) => boolean,
): HeaderCheckboxSummary {
  const total = rowsInScope.length;
  let selected = 0;

  for (let i = 0; i < total; i++) {
    if (isSelected(rowsInScope[i])) {
      selected += 1;
    }
  }

  let state: HeaderCheckboxState = 'mixed';

  if (total === 0) {
    state = 'disabled';
  } else if (selected === 0) {
    state = 'unchecked';
  } else if (selected === total) {
    state = 'checked';
  }

  return { state, selected, total };
}

/**
 * Resolves which rows a click on the "select all" checkbox selects or deselects. A checkbox that is
 * checked deselects every row in scope; one that is unchecked or mixed selects every row in scope
 * (the same "mixed checks everything" rule the checkbox cell type applies to the Space key).
 *
 * @param {HeaderCheckboxState} state The state the checkbox shows before the click.
 * @returns {boolean|null} `true` to select, `false` to deselect, `null` to do nothing.
 */
export function resolveHeaderToggleTarget(state: HeaderCheckboxState): boolean | null {
  if (state === 'disabled') {
    return null;
  }

  return state !== 'checked';
}
