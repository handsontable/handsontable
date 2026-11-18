import {
  collectAdjacentHiddenPhysicalIndexes,
  collectHeaderSelectedIndexes,
} from 'handsontable/utils/hiddenIndexes';
import type { HotInstance } from 'handsontable/core/types';

describe('collectAdjacentHiddenPhysicalIndexes', () => {
  const identityMap = (count: number): number[] => {
    const indexes = new Array(count);

    for (let i = 0; i < count; i += 1) {
      indexes[i] = i;
    }

    return indexes;
  };

  it('should return an empty array when no neighbor is hidden', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set())).toEqual([]);
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([4]))).toEqual([]);
  });

  it('should collect the contiguous hidden stretch immediately before the visual index, in visual order', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([0, 1]))).toEqual([0, 1]);
  });

  it('should collect the contiguous hidden stretch immediately after the visual index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(0, 5, identityMap(5), new Set([1, 2]))).toEqual([1, 2]);
  });

  it('should collect hidden stretches on both sides of the visual index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([1, 3]))).toEqual([1, 3]);
  });

  it('should collect physical indexes from the visual map, not the visual indexes themselves', () => {
    const notTrimmedIndexes = [10, 20, 30, 40, 50];

    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, notTrimmedIndexes, new Set([20, 40]))).toEqual([20, 40]);
  });

  it('should stop at the first visible neighbor, leaving a non-adjacent hidden index out', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(3, 5, identityMap(5), new Set([1]))).toEqual([]);
    expect(collectAdjacentHiddenPhysicalIndexes(2, 5, identityMap(5), new Set([0, 4]))).toEqual([]);
  });

  it('should include physical index 0, which is a valid hidden index', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(3), new Set([0]))).toEqual([0]);
  });

  it('should stop when a visual slot has no physical index', () => {
    const notTrimmedIndexes = [0, undefined, 2] as number[];

    expect(collectAdjacentHiddenPhysicalIndexes(2, 3, notTrimmedIndexes, new Set([0]))).toEqual([]);
  });

  it('should not walk past visualCount even when the map is longer', () => {
    expect(collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(5), new Set([2, 3, 4]))).toEqual([2]);
  });

  it('should append into the provided target array and return it', () => {
    const target = [99];
    const result = collectAdjacentHiddenPhysicalIndexes(1, 3, identityMap(3), new Set([2]), target);

    expect(result).toBe(target);
    expect(target).toEqual([99, 2]);
  });

  it('should collect a long contiguous stretch after the visual index without overflowing the stack', () => {
    const visualCount = 50001;
    const notTrimmedIndexes = identityMap(visualCount);
    const hiddenPhysicalIndexes = new Set<number>();

    for (let i = 1; i < visualCount; i += 1) {
      hiddenPhysicalIndexes.add(i);
    }

    const result = collectAdjacentHiddenPhysicalIndexes(
      0,
      visualCount,
      notTrimmedIndexes,
      hiddenPhysicalIndexes,
    );

    expect(result).toHaveLength(50000);
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(50000);
  });

  it('should collect a long contiguous stretch before the visual index in visual order', () => {
    const visualCount = 50001;
    const notTrimmedIndexes = identityMap(visualCount);
    const hiddenPhysicalIndexes = new Set<number>();

    for (let i = 0; i < visualCount - 1; i += 1) {
      hiddenPhysicalIndexes.add(i);
    }

    const result = collectAdjacentHiddenPhysicalIndexes(
      visualCount - 1,
      visualCount,
      notTrimmedIndexes,
      hiddenPhysicalIndexes,
    );

    expect(result).toHaveLength(50000);
    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(49999);
  });
});

describe('collectHeaderSelectedIndexes', () => {
  type Layer = {
    from: [number | null, number | null],
    to: [number | null, number | null],
    byColumnHeader?: boolean,
    byRowHeader?: boolean,
    selectAll?: boolean,
  };

  /**
   * A stand-in for the instance with the selection layers given, in layer order. `selectAll` marks a
   * layer made by `selectAll()`; it carries the header flag of each header the grid renders.
   *
   * @param {Layer[]} layers The selection layers.
   * @param {number} [activeLayer] The active layer; the last one when omitted.
   * @returns {HotInstance}
   */
  const createHot = (layers: Layer[], activeLayer = layers.length - 1): HotInstance => {
    const selectedByColumnHeader = new Set<number>();
    const selectedByRowHeader = new Set<number>();
    const selectAllLayers = new Set<number>();

    layers.forEach(({ byColumnHeader, byRowHeader, selectAll }, layer) => {
      if (selectAll) {
        selectAllLayers.add(layer);
      }

      if (byColumnHeader) {
        selectedByColumnHeader.add(layer);
      }

      if (byRowHeader) {
        selectedByRowHeader.add(layer);
      }
    });

    return {
      getSelectedRange: () => (layers.length === 0 ? undefined : layers.map(({ from, to }) => ({
        from: { row: from[0], col: from[1] },
        to: { row: to[0], col: to[1] },
      }))),
      selection: {
        selectedByColumnHeader,
        selectedByRowHeader,
        getActiveSelectionLayerIndex: () => activeLayer,
        isSelectAllLayer: (layer: number) => selectAllLayers.has(layer),
      },
    } as unknown as HotInstance;
  };

  it('should return an empty array when nothing is selected', () => {
    expect(collectHeaderSelectedIndexes(createHot([]), 'col')).toEqual([]);
  });

  it('should collect the columns of a single header range', () => {
    const hot = createHot([{ from: [-1, 2], to: [7, 4], byColumnHeader: true }]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([2, 3, 4]);
  });

  it('should collect the columns of every header range, sorted and without duplicates', () => {
    const hot = createHot([
      { from: [-1, 5], to: [7, 5], byColumnHeader: true },
      { from: [-1, 3], to: [7, 1], byColumnHeader: true },
      { from: [-1, 3], to: [7, 3], byColumnHeader: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([1, 2, 3, 5]);
  });

  it('should leave out a cell range selected beside the header ranges', () => {
    const hot = createHot([
      { from: [-1, 1], to: [7, 1], byColumnHeader: true },
      { from: [5, 4], to: [5, 4] },
      { from: [-1, 3], to: [7, 3], byColumnHeader: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([1, 3]);
  });

  it('should read the asked axis only', () => {
    const hot = createHot([
      { from: [1, -1], to: [1, 5], byRowHeader: true },
      { from: [4, -1], to: [3, 5], byRowHeader: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'row')).toEqual([1, 3, 4]);
    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([]);
  });

  it('should collect a header range on a grid that renders no header (the range starts at index 0)', () => {
    // `selectColumns()` anchors the range at row 0 when `colHeaders` is off, and `selectRows()` at
    // column 0 when `rowHeaders` is off. The flag still says the range is a whole column or row.
    expect(collectHeaderSelectedIndexes(createHot([
      { from: [0, 2], to: [7, 2], byColumnHeader: true },
    ]), 'col')).toEqual([2]);
    expect(collectHeaderSelectedIndexes(createHot([
      { from: [3, 0], to: [3, 5], byRowHeader: true },
    ]), 'row')).toEqual([3]);
  });

  it('should skip a range whose coordinates on the axis are not set', () => {
    const hot = createHot([
      { from: [-1, null], to: [7, null], byColumnHeader: true },
      { from: [-1, 3], to: [7, 3], byColumnHeader: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([3]);
  });

  it('should collect every index of a select-all, without the header index', () => {
    const hot = createHot([{ from: [-1, -1], to: [7, 5], byColumnHeader: true, byRowHeader: true, selectAll: true }]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([0, 1, 2, 3, 4, 5]);
    expect(collectHeaderSelectedIndexes(hot, 'row')).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('should leave out a select-all layer that is not the active layer', () => {
    const layers: Layer[] = [
      { from: [-1, -1], to: [7, 5], byColumnHeader: true, byRowHeader: true, selectAll: true },
      { from: [-1, 3], to: [7, 3], byColumnHeader: true },
    ];

    // Select-all, then Ctrl/Cmd+click header D: only D.
    expect(collectHeaderSelectedIndexes(createHot(layers), 'col')).toEqual([3]);
    // The focus moved back onto the select-all layer: every column.
    expect(collectHeaderSelectedIndexes(createHot(layers, 0), 'col')).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should leave out an inactive select-all layer on a grid that renders one header', () => {
    // With column headers only, `selectAll()` sets the column flag alone.
    const columnsOnly: Layer[] = [
      { from: [-1, 0], to: [7, 5], byColumnHeader: true, selectAll: true },
      { from: [-1, 3], to: [7, 3], byColumnHeader: true },
    ];
    // With row headers only, it sets the row flag alone.
    const rowsOnly: Layer[] = [
      { from: [0, -1], to: [7, 5], byRowHeader: true, selectAll: true },
      { from: [4, -1], to: [4, 5], byRowHeader: true },
    ];

    expect(collectHeaderSelectedIndexes(createHot(columnsOnly), 'col')).toEqual([3]);
    expect(collectHeaderSelectedIndexes(createHot(rowsOnly), 'row')).toEqual([4]);
  });

  it('should leave out a select-all layer on the axis whose header the grid does not render', () => {
    // A grid with column headers only: the select-all carries no row flag, so it hides no rows.
    const hot = createHot([{ from: [-1, 0], to: [7, 5], byColumnHeader: true, selectAll: true }]);

    expect(collectHeaderSelectedIndexes(hot, 'col')).toEqual([0, 1, 2, 3, 4, 5]);
    expect(collectHeaderSelectedIndexes(hot, 'row')).toEqual([]);
  });

  it('should stop once it found as many indexes as the limit', () => {
    const hot = createHot([
      { from: [-1, 0], to: [7, 4], byColumnHeader: true },
      { from: [-1, 9], to: [7, 9], byColumnHeader: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'col', 1)).toEqual([0]);
    expect(collectHeaderSelectedIndexes(hot, 'col', 2)).toEqual([0, 1]);
  });

  it('should stop at the limit on a long select-all', () => {
    const hot = createHot([
      { from: [-1, -1], to: [999999, 5], byColumnHeader: true, byRowHeader: true, selectAll: true },
    ]);

    expect(collectHeaderSelectedIndexes(hot, 'row', 2)).toEqual([0, 1]);
  });
});
