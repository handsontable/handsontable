import StateManager from 'handsontable/plugins/nestedHeaders/stateManager';

/**
 * Builds a ColumnArrangement from an explicit visual-to-physical order array.
 *
 * @param {number[]} order The physical column index at each visual position.
 * @returns {object} A ColumnArrangement.
 */
function splitArrangement(order) {
  return {
    getPhysicalFromVisual: visualIndex => order[visualIndex],
  };
}

describe('nestedHeaders StateManager - readers under a moved (split) arrangement', () => {
  const config = [
    [{ label: 'Address', colspan: 2 }, { label: 'Finance', colspan: 2 }],
    ['Street', 'City', 'Revenue', 'Profit'],
  ];

  /**
   * Builds a StateManager, applies a column arrangement, and re-derives the tree.
   *
   * @param {number[]} order The visual-to-physical order to derive against.
   * @returns {StateManager} The configured state manager.
   */
  function buildState(order) {
    const state = new StateManager();

    state.setState(config);
    state.setColumnArrangement(splitArrangement(order));
    state.rebuildState();

    return state;
  }

  // Move physical column 0 (Street) to the visual end: visual order [1, 2, 3, 0].
  // The "Address" group splits into two banners at visual columns 0 and 3.
  describe('a leaf moved out of its group splits the group into two same-label banners', () => {
    it('should resolve both "Address" banners through getHeaderTreeNodeData', () => {
      const state = buildState([1, 2, 3, 0]);

      expect(state.getHeaderTreeNodeData(0, 0).label).toBe('Address');
      expect(state.getHeaderTreeNodeData(0, 0).origColspan).toBe(1);
      expect(state.getHeaderTreeNodeData(0, 1).label).toBe('Finance');
      expect(state.getHeaderTreeNodeData(0, 1).origColspan).toBe(2);
      // The split twin - same label, distinct root at a non-contiguous column.
      expect(state.getHeaderTreeNodeData(0, 3).label).toBe('Address');
      expect(state.getHeaderTreeNodeData(0, 3).origColspan).toBe(1);
    });

    it('should resolve leaf labels that follow the data', () => {
      const state = buildState([1, 2, 3, 0]);

      expect(state.getHeaderTreeNodeData(1, 0).label).toBe('City');
      expect(state.getHeaderTreeNodeData(1, 1).label).toBe('Revenue');
      expect(state.getHeaderTreeNodeData(1, 2).label).toBe('Profit');
      expect(state.getHeaderTreeNodeData(1, 3).label).toBe('Street');
    });

    it('should report the visual (derived) column count', () => {
      expect(buildState([1, 2, 3, 0]).getColumnsCount()).toBe(4);
    });

    it('should return sane left/right edges across the split banners', () => {
      const state = buildState([1, 2, 3, 0]);

      // Second "Address" banner: a width-1 root at column 3.
      expect(state.findLeftMostColumnIndex(0, 3)).toBe(3);
      expect(state.findRightMostColumnIndex(0, 3)).toBe(3);
      // "Finance" spans columns 1-2.
      expect(state.findLeftMostColumnIndex(0, 2)).toBe(1);
      expect(state.findRightMostColumnIndex(0, 1)).toBe(2);
    });

    it('should find the top-most entire header level across the split', () => {
      const state = buildState([1, 2, 3, 0]);

      // Column 0 is a width-1 "Address" banner - the top level fully covers it.
      expect(state.findTopMostEntireHeaderLevel(0, 0)).toBe(-2);
      // Columns 1-2 are exactly the whole "Finance" group - top level.
      expect(state.findTopMostEntireHeaderLevel(1, 2)).toBe(-2);
    });
  });

  it('should keep a whole group intact when its columns stay adjacent', () => {
    // Move the whole Address group to the end: visual order [2, 3, 0, 1].
    const state = buildState([2, 3, 0, 1]);

    expect(state.getHeaderTreeNodeData(0, 0).label).toBe('Finance');
    expect(state.getHeaderTreeNodeData(0, 0).origColspan).toBe(2);
    expect(state.getHeaderTreeNodeData(0, 2).label).toBe('Address');
    expect(state.getHeaderTreeNodeData(0, 2).origColspan).toBe(2);
    expect(state.findLeftMostColumnIndex(0, 3)).toBe(2);
    expect(state.findRightMostColumnIndex(0, 2)).toBe(3);
  });
});
