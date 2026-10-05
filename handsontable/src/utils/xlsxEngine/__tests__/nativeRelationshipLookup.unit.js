import { sheetRelationships } from '../adapters/native/read';

/**
 * Wraps an array in a `Proxy` that counts how many of its elements are read.
 *
 * @param {Array} array The array to wrap.
 * @returns {{ proxy: Array, reads: Function }}
 */
function countingArray(array) {
  let reads = 0;
  const proxy = new Proxy(array, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) {
        reads += 1;
      }

      return Reflect.get(target, key, receiver);
    },
  });

  return { proxy, reads: () => reads };
}

describe('sheetRelationships', () => {
  it('should resolve every sheet in one pass over the relationships, not one pass per sheet', () => {
    // A workbook declaring N sheets and N relationships made a per-sheet `find()` cost
    // O(sheets x rels): measured 0.84 s with the index and 4.9-9.7 s with the scan on a 914 kB file.
    // A wall-clock bound would flake, so the element reads are counted instead.
    const rels = Array.from({ length: 10000 }, (_, index) => ({
      id: `rId${index}`, type: 'worksheet', target: `worksheets/sheet${index}.xml`,
    }));
    const entries = Array.from({ length: 2048 }, (_, index) => ({ relId: `rId${9999 - index}` }));
    const { proxy, reads } = countingArray(rels);
    const resolved = sheetRelationships(entries, proxy);

    expect(resolved[0]).toBe(rels[9999]);
    expect(resolved[2047]).toBe(rels[9999 - 2047]);
    // One read per relationship, give or take the iteration protocol: a scan per sheet reads up to
    // 2048 x 10000 elements.
    expect(reads()).toBeLessThan(20000);
  });

  it('should resolve a duplicated id to the first relationship carrying it, and a missing id to nothing', () => {
    const first = { id: 'rId1', type: 'styles', target: 'styles.xml' };
    const second = { id: 'rId1', type: 'worksheet', target: 'worksheets/sheet1.xml' };

    expect(sheetRelationships([{ relId: 'rId1' }, { relId: 'rId9' }], [first, second])).toEqual([first, undefined]);
  });
});
