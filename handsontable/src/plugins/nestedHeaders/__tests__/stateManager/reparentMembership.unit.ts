import StateManager from 'handsontable/plugins/nestedHeaders/stateManager';
import type { ColumnArrangement } from 'handsontable/plugins/nestedHeaders/stateManager/columnArrangement';

/**
 * The subset of a derived header cell the containment checks read. Real cells (from
 * `getHeaderSettings`) carry more, but only these fields drive run boundaries and assertions.
 */
interface HeaderCell {
  label?: string;
  origColspan?: number;
  isPlaceholder?: boolean;
  columnIndex?: number;
}

type HeaderMatrix = (HeaderCell | null)[][];

/**
 * A mutable visual-to-physical arrangement. `order[visualColumn]` is the physical column currently
 * shown at that visual position. Swap `order` to simulate a column move, exactly like the live
 * column index mapper does after `manualColumnMove`.
 */
interface MutableArrangement extends ColumnArrangement {
  order: number[];
}

/**
 * Builds a mutable arrangement seeded with the identity order for `columnsCount` columns.
 *
 * @param {number} columnsCount The number of columns.
 * @returns {MutableArrangement} The arrangement whose `order` can be reassigned between moves.
 */
function mutableArrangement(columnsCount: number): MutableArrangement {
  const arrangement: MutableArrangement = {
    order: Array.from({ length: columnsCount }, (_, index) => index),
    getPhysicalFromVisual(visualColumnIndex: number) {
      return arrangement.order[visualColumnIndex] ?? visualColumnIndex;
    },
  };

  return arrangement;
}

/**
 * Applies a single physical-column move to an order array, mirroring `manualColumnMove.moveColumn`:
 * the physical column at `fromVisual` is pulled out and re-inserted so it lands at `toVisual`.
 *
 * @param {number[]} order The current visual-to-physical order.
 * @param {number} fromVisual The visual index the column is dragged from.
 * @param {number} toVisual The visual index the column is dropped at.
 * @returns {number[]} The new order after the move.
 */
function moveInOrder(order: number[], fromVisual: number, toVisual: number): number[] {
  const next = order.slice();
  const [physical] = next.splice(fromVisual, 1);

  next.splice(toVisual, 0, physical);

  return next;
}

/**
 * Reads the full derived header matrix from the state manager: `matrix[level][column]` is that
 * cell's node data (label, origColspan, isPlaceholder, columnIndex).
 *
 * @param {StateManager} state The state manager to read from.
 * @param {number} layersCount The number of header levels.
 * @param {number} columnsCount The number of columns.
 * @returns {Array[]} The header matrix.
 */
function readMatrix(state: StateManager, layersCount: number, columnsCount: number): HeaderMatrix {
  const matrix: HeaderMatrix = [];

  for (let level = 0; level < layersCount; level++) {
    matrix[level] = [];

    for (let column = 0; column < columnsCount; column++) {
      matrix[level][column] = state.getHeaderSettings(level, column);
    }
  }

  return matrix;
}

/**
 * Returns the set of column indexes at which a new (non-placeholder) header cell starts on the given
 * level. These are the group boundaries of that level; a coarser level has a subset of the
 * boundaries of the level below it when the nesting is valid.
 *
 * @param {Array[]} matrix The header matrix from {@link readMatrix}.
 * @param {number} level The header level.
 * @param {number} columnsCount The number of columns.
 * @returns {Set<number>} The starting column indexes of that level's runs.
 */
function runBoundaries(matrix: HeaderMatrix, level: number, columnsCount: number): Set<number> {
  const boundaries = new Set<number>();

  for (let column = 0; column < columnsCount; column++) {
    const cell = matrix[level][column];

    if (cell && cell.isPlaceholder !== true) {
      boundaries.add(column);
    }
  }

  return boundaries;
}

/**
 * Returns every place the multi-level nesting invariant is violated in a header matrix: an outer
 * group boundary that is NOT also an inner boundary means an inner run crosses that boundary (a
 * straddle), so the level-(L+1) cell is not contained within a single level-L cell. The inner run
 * partition must refine the outer one; this lists where it does not.
 *
 * @param {Array[]} matrix The header matrix from {@link readMatrix}.
 * @param {number} layersCount The number of header levels.
 * @param {number} columnsCount The number of columns.
 * @returns {Array<{level: number, boundary: number}>} The straddles found (empty when valid).
 */
function nestingViolations(
  matrix: HeaderMatrix, layersCount: number, columnsCount: number
): { level: number, boundary: number }[] {
  const violations: { level: number, boundary: number }[] = [];

  for (let level = 0; level < layersCount - 1; level++) {
    const outer = runBoundaries(matrix, level, columnsCount);
    const inner = runBoundaries(matrix, level + 1, columnsCount);

    outer.forEach((boundary) => {
      if (!inner.has(boundary)) {
        violations.push({ level, boundary });
      }
    });
  }

  return violations;
}

/**
 * Asserts the multi-level nesting invariant across the whole matrix: every level-(L+1) header cell
 * is contained within a single level-L cell. A straddle (an inner run crossing an outer boundary) is
 * exactly the 3-level failure mode being checked.
 *
 * @param {StateManager} state The state manager to read from.
 * @param {number} layersCount The number of header levels.
 * @param {number} columnsCount The number of columns.
 */
function expectNestingContained(state: StateManager, layersCount: number, columnsCount: number) {
  const matrix = readMatrix(state, layersCount, columnsCount);

  expect(nestingViolations(matrix, layersCount, columnsCount)).toEqual([]);
}

/**
 * Reads the labels of a single level as a flat array (placeholders read as `''`).
 *
 * @param {StateManager} state The state manager to read from.
 * @param {number} level The header level.
 * @param {number} columnsCount The number of columns.
 * @returns {string[]} The labels at that level in visual order.
 */
function levelLabels(state: StateManager, level: number, columnsCount: number): string[] {
  const labels: string[] = [];

  for (let column = 0; column < columnsCount; column++) {
    labels.push(state.getHeaderSettings(level, column)?.label ?? '');
  }

  return labels;
}

/**
 * Builds a non-placeholder header cell starting at `columnIndex` with the given span, for the
 * checker self-test fixtures.
 *
 * @param {number} columnIndex The cell's starting column index.
 * @param {number} origColspan The cell's span.
 * @returns {object} A header cell.
 */
function cell(columnIndex: number, origColspan: number): HeaderCell {
  return { columnIndex, origColspan, isPlaceholder: false };
}

/**
 * Builds a placeholder header cell (a continuation column of a spanning cell), for the checker
 * self-test fixtures.
 *
 * @returns {object} A placeholder header cell.
 */
function ph(): HeaderCell {
  return { isPlaceholder: true };
}

describe('StateManager re-parenting across multi-level nesting', () => {
  const THREE_LEVEL = [
    [{ label: 'P', colspan: 3 }, { label: 'Q', colspan: 3 }],
    [{ label: 'Pa', colspan: 2 }, 'Pb', 'Qa', { label: 'Qb', colspan: 2 }],
    ['a', 'b', 'c', 'd', 'e', 'f'],
  ];

  /**
   * Drives one column move through the real pipeline: updates the arrangement to the post-move order,
   * re-parents the moved column, then rebuilds the tree - the same sequence the plugin runs on
   * `manualColumnMove`.
   *
   * @param {StateManager} state The state manager.
   * @param {MutableArrangement} arrangement The mutable arrangement.
   * @param {number} fromVisual The visual index dragged from.
   * @param {number} toVisual The visual index dropped at.
   */
  function move(state: StateManager, arrangement: MutableArrangement, fromVisual: number, toVisual: number) {
    arrangement.order = moveInOrder(arrangement.order, fromVisual, toVisual);
    state.reparentColumns([toVisual]);
    state.rebuildState();
  }

  it('should keep the 3-level nesting contained after a single re-parent into a sibling group', () => {
    const state = new StateManager();

    state.setState(THREE_LEVEL);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // Move physical 5 ('f', authored under Qb/Q) into Pa's span, between physical 0 and 1.
    move(state, arrangement, 5, 1);

    expectNestingContained(state, 3, 6);
    // The leaf level follows the data.
    expect(levelLabels(state, 2, 6)).toEqual(['a', 'f', 'b', 'c', 'd', 'e']);
  });

  it('should keep nesting contained after a second move separates an already re-parented column', () => {
    const state = new StateManager();

    state.setState(THREE_LEVEL);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // 1) 'f' (physical 5) adopted into Pa.
    move(state, arrangement, 5, 1);
    expectNestingContained(state, 3, 6);

    // 2) Now drag physical 0 ('a') far right, separating 'f' from the rest of Pa. The neighbor 'f'
    //    that drives the next decision is itself already overridden - the inductive step.
    move(state, arrangement, 0, 5);
    expectNestingContained(state, 3, 6);
  });

  it('should keep nesting contained when a non-moved column is displaced by a later move', () => {
    const state = new StateManager();

    state.setState(THREE_LEVEL);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // 1) 'f' adopted into Pa (writes a physical-keyed override on physical 5).
    move(state, arrangement, 5, 1);
    expectNestingContained(state, 3, 6);

    // 2) Move an unrelated column ('d', physical 3) elsewhere. 'f' is only displaced, not re-resolved,
    //    so its stale override must not produce a straddle.
    move(state, arrangement, 4, 0);
    expectNestingContained(state, 3, 6);
  });

  it('should keep nesting contained when an entire inner group is dragged into another group', () => {
    const state = new StateManager();

    state.setState(THREE_LEVEL);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // Move the whole Qb group (physical 4 and 5) into the middle of P, one column at a time.
    move(state, arrangement, 4, 1); // physical 4 -> visual 1
    expectNestingContained(state, 3, 6);
    move(state, arrangement, 5, 2); // physical 5 -> visual 2 (next to its sibling)
    expectNestingContained(state, 3, 6);
  });

  it('should adopt a whole group moved as a block into another cohesive group', () => {
    const state = new StateManager();

    state.setState([
      [{ label: 'Personal', colspan: 3 }, { label: 'Work', colspan: 3 }],
      [{ label: 'Name', colspan: 2 }, 'Age', { label: 'Company', colspan: 2 }, 'Role'],
      ['First', 'Last', 'Age', 'Org', 'Dept', 'Title'],
    ]);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // Move the Company group (physical 3, 4) as a block to between Name and Age (visual 2, 3). Both
    // moved columns are adjacent to each other, so the block is judged against its flanking columns.
    arrangement.order = [0, 1, 3, 4, 2, 5];
    state.reparentColumns([2, 3]);
    state.rebuildState();

    expectNestingContained(state, 3, 6);
    // Personal adopts the whole block (spans First, Last, Org, Dept, Age) rather than splitting.
    expect(state.getHeaderSettings(0, 0).label).toBe('Personal');
    expect(state.getHeaderSettings(0, 0).origColspan).toBe(5);
    // Company stays one intact banner (a sub-group) inside Personal.
    expect(state.getHeaderSettings(1, 2).label).toBe('Company');
    expect(state.getHeaderSettings(1, 2).origColspan).toBe(2);
  });

  it('should keep nesting contained across a long chain of compounding moves', () => {
    const state = new StateManager();

    state.setState(THREE_LEVEL);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // A chain where each move uses columns the previous moves already re-parented as neighbors.
    const chain: [number, number][] = [[5, 1], [0, 5], [3, 0], [4, 2], [1, 4], [2, 0]];

    chain.forEach(([fromVisual, toVisual]) => {
      move(state, arrangement, fromVisual, toVisual);
      expectNestingContained(state, 3, 6);
    });

    // Never throws, never produces a straddle - and the leaf level always carries six distinct labels.
    const leaves = levelLabels(state, 2, 6).slice().sort();

    expect(leaves).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('should keep nesting contained when re-parenting interleaves two cohesive sibling groups', () => {
    const state = new StateManager();

    // Two cohesive top groups, each with two cohesive inner groups - the interleaving conflict case.
    state.setState([
      [{ label: 'P', colspan: 4 }, { label: 'Q', colspan: 4 }],
      [
        { label: 'Pa', colspan: 2 }, { label: 'Pb', colspan: 2 },
        { label: 'Qa', colspan: 2 }, { label: 'Qb', colspan: 2 },
      ],
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ]);

    const arrangement = mutableArrangement(8);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // Interleave a Q leaf into the middle of a P inner group, then a P leaf into Q.
    move(state, arrangement, 4, 1); // physical 4 ('e', Qa/Q) between physical 0 and 1 (inside Pa/P)
    expectNestingContained(state, 3, 8);
    move(state, arrangement, 7, 5); // physical 7 ('h', Qb/Q) into the P side again
    expectNestingContained(state, 3, 8);
  });

  it('should keep nesting contained when columnDropMode differs across levels (adopt outer, split inner)', () => {
    const state = new StateManager();

    // Outer 'Top' is cohesive; inner 'L' opts into splitting. A leaf moved out of L splits L into
    // banners while Top stays one banner - the inner split must still nest inside Top.
    state.setState([
      [{ label: 'Top', colspan: 4 }],
      [{ label: 'L', colspan: 2, columnDropMode: 'split' }, { label: 'R', colspan: 2 }],
      ['a', 'b', 'c', 'd'],
    ]);

    const arrangement = mutableArrangement(4);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    move(state, arrangement, 0, 3); // physical 0 ('a', L) out to the end, still inside Top's span
    expectNestingContained(state, 3, 4);

    // Top stays a single cohesive banner over all four columns.
    expect(state.getHeaderSettings(0, 0).label).toBe('Top');
    expect(state.getHeaderSettings(0, 0).origColspan).toBe(4);
    // L splits into same-label banners (the opt-in behavior) - and each banner nests under Top.
    expect(levelLabels(state, 1, 4)).toEqual(['L', 'R', '', 'L']);
  });

  it('should keep nesting contained when a cohesive inner group sits under a splitting outer group', () => {
    const state = new StateManager();

    // The dangerous direction: outer groups split (columnDropMode: 'split'), inner groups are cohesive
    // (default). A column dropped strictly inside a cohesive inner group would adopt it at the inner
    // level, but the outer adopt is suppressed (the outer group splits) - the inner owner's
    // parent must still constrain the outer owner, or the inner run straddles an outer boundary.
    state.setState([
      [{ label: 'P', colspan: 3, columnDropMode: 'split' }, { label: 'Q', colspan: 3, columnDropMode: 'split' }],
      [{ label: 'Pg', colspan: 2 }, 'Ps', 'Qs', { label: 'Qg', colspan: 2 }],
      ['a', 'b', 'c', 'd', 'e', 'f'],
    ]);

    const arrangement = mutableArrangement(6);

    state.setColumnArrangement(arrangement);
    state.rebuildState();

    // 'f' (physical 5, authored Qg/Q) dropped strictly inside Pg, between physical 0 and 1.
    move(state, arrangement, 5, 1);

    expectNestingContained(state, 3, 6);
    // 'f' is adopted into the cohesive inner group Pg (now spans 3); the splitting outer group P
    // grows to contain it rather than the inner run straddling the P|Q boundary.
    expect(state.getHeaderSettings(1, 0).label).toBe('Pg');
    expect(state.getHeaderSettings(1, 0).origColspan).toBe(3);
    expect(state.getHeaderSettings(0, 0).label).toBe('P');
    expect(state.getHeaderSettings(0, 0).origColspan).toBe(4);
  });
});

describe('nestingViolations checker (self-discrimination)', () => {
  it('should report no violation for a properly nested matrix', () => {
    // P(0..3) over [Pa(0..1), Pb(2..3)] over leaves - inner boundaries {0,2} refine outer {0}.
    const matrix = [
      [cell(0, 4), ph(), ph(), ph()],
      [cell(0, 2), ph(), cell(2, 2), ph()],
      [cell(0, 1), cell(1, 1), cell(2, 1), cell(3, 1)],
    ];

    expect(nestingViolations(matrix, 3, 4)).toEqual([]);
  });

  it('should report a violation when an inner run straddles an outer boundary', () => {
    // Outer splits at column 2 ({0,2}), but the inner run spans 0..3 as one cell ({0}) - a straddle.
    const matrix = [
      [cell(0, 2), ph(), cell(2, 2), ph()],
      [cell(0, 4), ph(), ph(), ph()],
      [cell(0, 1), cell(1, 1), cell(2, 1), cell(3, 1)],
    ];

    expect(nestingViolations(matrix, 3, 4)).toEqual([{ level: 0, boundary: 2 }]);
  });
});
