import { getListWithInsertedItems } from 'handsontable/translations/maps/utils/physicallyIndexed';

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
});
