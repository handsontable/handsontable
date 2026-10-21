import { ColumnDataMap } from 'handsontable/plugins/filters/columnDataMap';
import type { CellProperties } from 'handsontable/settings';

describe('ColumnDataMap', () => {
  const COLUMN = 3;

  /**
   * Builds a map over three rows of physical column 3 whose resolver records every call and returns
   * a different, unstamped object for every entry.
   *
   * @param calls - Collects the entry position of every resolver call.
   * @returns {ColumnDataMap}
   */
  function buildMap(calls: number[] = []) {
    return new ColumnDataMap([5, 7, 9], ['a', 'b', 'c'], COLUMN, (index: number) => {
      calls.push(index);

      return { tag: `meta-${index}` } as unknown as CellProperties;
    });
  }

  /**
   * The meta an entry is expected to carry once `getMeta()` stamped it.
   *
   * @param tag - The resolver's tag for the entry.
   * @param row - The entry's physical row.
   * @returns {object}
   */
  function stampedMeta(tag: string, row: number) {
    return { tag, row, col: COLUMN, visualRow: row, visualCol: COLUMN } as unknown as CellProperties;
  }

  it('should expose the read as parallel row and value arrays', () => {
    const columnDataMap = buildMap();

    expect(columnDataMap.length).toBe(3);
    expect(columnDataMap.rows).toEqual([5, 7, 9]);
    expect(columnDataMap.values).toEqual(['a', 'b', 'c']);
    expect(columnDataMap.column).toBe(COLUMN);
    expect(columnDataMap.getRow(1)).toBe(7);
    expect(columnDataMap.getValue(1)).toBe('b');
  });

  it('should resolve no cell meta until something asks for it', () => {
    const calls: number[] = [];
    const columnDataMap = buildMap(calls);

    expect(columnDataMap.values).toEqual(['a', 'b', 'c']);
    expect(columnDataMap.getValue(2)).toBe('c');
    expect(calls).toEqual([]);

    columnDataMap.getMeta(2);

    expect(calls).toEqual([2]);
  });

  it('should stamp the entry\'s physical coordinates on the meta it returns', () => {
    const columnDataMap = buildMap();

    expect(columnDataMap.getMeta(1)).toEqual(stampedMeta('meta-1', 7));
  });

  it('should materialize the entry array from toArray, one own meta per entry', () => {
    const calls: number[] = [];
    const entries = buildMap(calls).toArray();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.map(entry => Object.keys(entry)))
      .toEqual([['row', 'meta', 'value'], ['row', 'meta', 'value'], ['row', 'meta', 'value']]);
    expect(entries).toEqual([
      { row: 5, meta: stampedMeta('meta-0', 5), value: 'a' },
      { row: 7, meta: stampedMeta('meta-1', 7), value: 'b' },
      { row: 9, meta: stampedMeta('meta-2', 9), value: 'c' },
    ]);
    expect(calls).toEqual([0, 1, 2]);
  });

  it('should resolve a memoized read\'s meta once per entry, and still one object per entry', () => {
    const calls: number[] = [];
    const memoized = buildMap(calls).withMemoizedMeta();

    expect(memoized.rows).toEqual([5, 7, 9]);
    expect(memoized.values).toEqual(['a', 'b', 'c']);
    expect(memoized.column).toBe(COLUMN);

    const first = memoized.getMeta(1);

    expect(memoized.getMeta(1)).toBe(first);
    expect(memoized.toArray()[1].meta).toBe(first);
    expect(calls).toEqual([1, 0, 2]);
    // Memoizing must not start sharing one object between rows – that is the failure the scan
    // exists to avoid.
    expect(memoized.getMeta(0)).not.toBe(first);
  });

  it('should re-stamp a memoized meta on every call', () => {
    const memoized = buildMap().withMemoizedMeta();
    const cellMeta = memoized.getMeta(1);

    // Every meta reader re-stamps a stored object, so between two passes another read may have
    // pointed it at other coordinates.
    cellMeta.row = 0;
    cellMeta.col = 0;
    cellMeta.visualRow = 42;
    cellMeta.visualCol = 42;

    expect(memoized.getMeta(1)).toBe(cellMeta);
    expect(cellMeta).toEqual(stampedMeta('meta-1', 7));
  });

  it('should build an empty read whose meta resolves to undefined', () => {
    const columnDataMap = ColumnDataMap.empty();

    expect(columnDataMap.length).toBe(0);
    expect(columnDataMap.rows).toEqual([]);
    expect(columnDataMap.values).toEqual([]);
    expect(columnDataMap.toArray()).toEqual([]);
    // An empty read used to be an empty array, where `entries[0]?.meta` was `undefined`. Throwing
    // here would turn every guard-less probe into an error.
    expect(columnDataMap.getMeta(0)).toBeUndefined();
    expect(columnDataMap.withMemoizedMeta().getMeta(0)).toBeUndefined();
  });
});
