import {
  collectRowsInScope,
  computeHeaderCheckboxState,
  isSelectAllScope,
  resolveHeaderToggleTarget,
  type ScopeHost,
} from '../rowScope';

/**
 * Builds a grid adapter over a plain description of the rows. `visual` lists the physical rows in
 * visual order: a physical row missing from it is filtered out (trimmed by the Filters plugin).
 */
function createHost({
  physicalCount = 6,
  visual = [0, 1, 2, 3, 4, 5],
  page = null as [number, number] | null,
  trimmedByTrimRows = [] as number[],
  hiddenByHiddenRows = [] as number[],
  unselectable = [] as number[],
} = {}): ScopeHost {
  return {
    countPhysicalRows: () => physicalCount,
    countVisualRows: () => visual.length,
    toPhysicalRow: visualRow => visual[visualRow] ?? null,
    getCurrentPageRange: () => page,
    isExcludedByTrimRows: physicalRow => trimmedByTrimRows.includes(physicalRow),
    isExcludedByHiddenRows: physicalRow => hiddenByHiddenRows.includes(physicalRow),
    isRowSelectable: physicalRow => !unselectable.includes(physicalRow),
  };
}

describe('rowScope', () => {
  describe('collectRowsInScope', () => {
    it('should include the rows the filters removed in the "all" scope', () => {
      const host = createHost({ visual: [4, 0, 2] });

      expect(collectRowsInScope(host, 'all')).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should include only the rows that pass the filters, in visual order, in the "filtered" scope', () => {
      const host = createHost({ visual: [4, 0, 2] });

      expect(collectRowsInScope(host, 'filtered')).toEqual([4, 0, 2]);
    });

    it('should include only the rows of the current page in the "currentPage" scope', () => {
      const host = createHost({ visual: [5, 4, 3, 2, 1, 0], page: [2, 3] });

      expect(collectRowsInScope(host, 'currentPage')).toEqual([3, 2]);
    });

    it('should treat "currentPage" as "filtered" when the grid is not paginated', () => {
      const host = createHost({ visual: [1, 3] });

      expect(collectRowsInScope(host, 'currentPage')).toEqual([1, 3]);
    });

    it('should leave out the rows trimmed by TrimRows and hidden by HiddenRows in every scope', () => {
      const host = createHost({ trimmedByTrimRows: [1], hiddenByHiddenRows: [3] });

      expect(collectRowsInScope(host, 'all')).toEqual([0, 2, 4, 5]);
      expect(collectRowsInScope(host, 'filtered')).toEqual([0, 2, 4, 5]);
      expect(collectRowsInScope(host, 'currentPage')).toEqual([0, 2, 4, 5]);
    });

    it('should leave out the rows that cannot be selected', () => {
      const host = createHost({ unselectable: [0, 5] });

      expect(collectRowsInScope(host, 'all')).toEqual([1, 2, 3, 4]);
    });

    it('should return no rows for an empty page range', () => {
      const host = createHost({ page: [-1, -1] });

      expect(collectRowsInScope(host, 'currentPage')).toEqual([]);
    });
  });

  describe('computeHeaderCheckboxState', () => {
    it('should report "unchecked" when no row in the scope is selected', () => {
      expect(computeHeaderCheckboxState([0, 1, 2], () => false))
        .toEqual({ state: 'unchecked', selected: 0, total: 3 });
    });

    it('should report "checked" when every row in the scope is selected', () => {
      expect(computeHeaderCheckboxState([0, 1, 2], () => true))
        .toEqual({ state: 'checked', selected: 3, total: 3 });
    });

    it('should report "mixed" with the counts when some rows in the scope are selected', () => {
      expect(computeHeaderCheckboxState([0, 1, 2], row => row === 1))
        .toEqual({ state: 'mixed', selected: 1, total: 3 });
    });

    it('should count only the rows in the scope, not a selected row outside it', () => {
      const selected = new Set([1, 9]);

      expect(computeHeaderCheckboxState([0, 1], row => selected.has(row)))
        .toEqual({ state: 'mixed', selected: 1, total: 2 });
    });

    it('should report "disabled" when the scope holds no selectable row', () => {
      expect(computeHeaderCheckboxState([], () => true))
        .toEqual({ state: 'disabled', selected: 0, total: 0 });
    });
  });

  describe('resolveHeaderToggleTarget', () => {
    it('should select everything from the "unchecked" and "mixed" states', () => {
      expect(resolveHeaderToggleTarget('unchecked')).toBe(true);
      expect(resolveHeaderToggleTarget('mixed')).toBe(true);
    });

    it('should deselect everything from the "checked" state', () => {
      expect(resolveHeaderToggleTarget('checked')).toBe(false);
    });

    it('should do nothing from the "disabled" state', () => {
      expect(resolveHeaderToggleTarget('disabled')).toBeNull();
    });
  });

  describe('isSelectAllScope', () => {
    it('should accept only the three documented scopes', () => {
      expect(isSelectAllScope('all')).toBe(true);
      expect(isSelectAllScope('filtered')).toBe(true);
      expect(isSelectAllScope('currentPage')).toBe(true);
      expect(isSelectAllScope('page')).toBe(false);
      expect(isSelectAllScope(undefined)).toBe(false);
    });
  });
});
