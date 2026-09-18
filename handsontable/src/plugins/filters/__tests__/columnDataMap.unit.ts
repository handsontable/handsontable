import { ColumnDataMap } from 'handsontable/plugins/filters/columnDataMap';
import type { CellProperties } from 'handsontable/settings';

describe('ColumnDataMap', () => {
  /**
   * Builds a map over three rows whose resolver records every call and returns a different object
   * for every entry.
   *
   * @param calls - Collects the entry position of every resolver call.
   * @returns {ColumnDataMap}
   */
  function buildMap(calls: number[] = []) {
    return new ColumnDataMap([5, 7, 9], ['a', 'b', 'c'], (index: number) => {
      calls.push(index);

      return { tag: `meta-${index}` } as unknown as CellProperties;
    });
  }

  it('should expose the read as parallel row and value arrays', () => {
    const columnDataMap = buildMap();

    expect(columnDataMap.length).toBe(3);
    expect(columnDataMap.rows).toEqual([5, 7, 9]);
    expect(columnDataMap.values).toEqual(['a', 'b', 'c']);
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

  it('should materialize the entry array from toArray, one own meta per entry', () => {
    const calls: number[] = [];
    const entries = buildMap(calls).toArray();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.map(entry => Object.keys(entry)))
      .toEqual([['row', 'meta', 'value'], ['row', 'meta', 'value'], ['row', 'meta', 'value']]);
    expect(entries).toEqual([
      { row: 5, meta: { tag: 'meta-0' } as unknown as CellProperties, value: 'a' },
      { row: 7, meta: { tag: 'meta-1' } as unknown as CellProperties, value: 'b' },
      { row: 9, meta: { tag: 'meta-2' } as unknown as CellProperties, value: 'c' },
    ]);
    expect(calls).toEqual([0, 1, 2]);
  });

  it('should resolve a memoized read\'s meta once per entry, and still one object per entry', () => {
    const calls: number[] = [];
    const memoized = buildMap(calls).withMemoizedMeta();

    expect(memoized.rows).toEqual([5, 7, 9]);
    expect(memoized.values).toEqual(['a', 'b', 'c']);

    const first = memoized.getMeta(1);

    expect(memoized.getMeta(1)).toBe(first);
    expect(memoized.toArray()[1].meta).toBe(first);
    expect(calls).toEqual([1, 0, 2]);
    // Memoizing must not start sharing one object between rows - that is the failure the scan
    // exists to avoid.
    expect(memoized.getMeta(0)).not.toBe(first);
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
  });
});
