import {
  getListWithInsertedItems,
  getListWithRemovedItems,
} from 'handsontable/translations/maps/utils/physicallyIndexed';

describe('physicallyIndexed', () => {
  describe('getListWithInsertedItems', () => {
    it('should properly insert new items to the list at the beginning', () => {
      const startList = [false, false, false, false];
      const finalList = getListWithInsertedItems(startList, undefined, [0, 1, 2], true);

      expect(finalList.length).toBe(7);
      expect(finalList).toEqual([true, true, true, false, false, false, false]);
    });

    it('should properly insert new items to the list at the end', () => {
      const startList = [false, false, false, false];
      const finalList = getListWithInsertedItems(startList, undefined, [4, 5, 6], true);

      expect(finalList.length).toBe(7);
      expect(finalList).toEqual([false, false, false, false, true, true, true]);
    });

    it('should properly insert new items to the list in the middle of list', () => {
      const startList = [false, false, false, false];
      const finalList = getListWithInsertedItems(startList, undefined, [2, 3, 4], true);

      expect(finalList.length).toBe(7);
      expect(finalList).toEqual([false, false, true, true, true, false, false]);
    });

    it('should do nothing if insertedIndexes is an empty array', () => {
      const startList = [false, false, false, false];
      const finalList = getListWithInsertedItems(startList, undefined, [], true);

      expect(finalList.length).toBe(4);
      expect(finalList).toEqual([false, false, false, false]);
    });
  });

  describe('getListWithRemovedItems', () => {
    it('removes items by index (small removal — linear includes path)', () => {
      const startList = ['a', 'b', 'c', 'd', 'e'];

      expect(getListWithRemovedItems(startList, [1, 3])).toEqual(['a', 'c', 'e']);
    });

    it('removes items by index (bulk removal — Set path above the threshold)', () => {
      const startList = Array.from({ length: 50 }, (_, i) => i);
      const removed = startList.filter(i => i % 2 === 0); // 25 indexes → Set branch
      const expected = startList.filter(i => i % 2 === 1);

      expect(getListWithRemovedItems(startList, removed)).toEqual(expected);
    });

    it('produces the same result regardless of which branch runs', () => {
      const startList = Array.from({ length: 40 }, (_, i) => `v${i}`);
      const removedBulk = Array.from({ length: 20 }, (_, i) => i * 2); // Set path
      const bruteForce = startList.filter((_, i) => removedBulk.includes(i) === false);

      expect(getListWithRemovedItems(startList, removedBulk)).toEqual(bruteForce);
    });

    it('returns the full list when nothing is removed', () => {
      const startList = [false, true, false];

      expect(getListWithRemovedItems(startList, [])).toEqual([false, true, false]);
    });
  });
});
