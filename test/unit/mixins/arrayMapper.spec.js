import indexMapper from 'handsontable/mixins/indexMapper';

describe('indexMapper mixin', () => {
  describe('insertItems', () => {
    it('should add items to _arrayMap to the given place', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.insertItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(13);
      expect(indexMapper._arrayMap).toEqual([0, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      indexMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      indexMapper.insertItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(13);
      expect(indexMapper._arrayMap).toEqual([1, 10, 11, 12, 6, 3, 4, 5, 7, 8, 9, 0, 2]);
    });
  });

  describe('removeItems', () => {
    it('should remove items from _arrayMap and returns removed items', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.removeItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(7);
      expect(indexMapper._arrayMap).toEqual([0, 4, 5, 6, 7, 8, 9]);

      indexMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      indexMapper.removeItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(7);
      expect(indexMapper._arrayMap).toEqual([1, 5, 7, 8, 9, 0, 2]);
    });

    it('should remove an array of item indices from _arrayMap and return removed items', () => {
      indexMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      indexMapper.removeItems([1, 3, 4, 7]);

      expect(indexMapper._arrayMap.length).toBe(6);
      expect(indexMapper._arrayMap).toEqual([1, 3, 7, 8, 0, 2]);
    });
  });

  describe('unshiftItems', () => {
    it('should remove items from _arrayMap', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.unshiftItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(7);
      expect(indexMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6]);

      indexMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      indexMapper.unshiftItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(7);
      expect(indexMapper._arrayMap).toEqual([1, 3, 4, 5, 6, 0, 2]);
    });
  });

  describe('shiftItems', () => {
    it('should add items to _arrayMap', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.shiftItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(13);
      expect(indexMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

      indexMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      indexMapper.shiftItems(1, 3);

      expect(indexMapper._arrayMap.length).toBe(13);
      expect(indexMapper._arrayMap).toEqual([4, 1, 2, 3, 9, 6, 7, 8, 10, 11, 12, 0, 5]);
    });
  });

  describe('Move indexes', () => {
    it('should move given indexes', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.moveItems(8, 0);
      indexMapper.moveItems(3, 1);
      indexMapper.moveItems(5, 2);

      expect(indexMapper._arrayMap.length).toBe(10);
      expect(indexMapper._arrayMap).toEqual([8, 2, 4, 0, 1, 3, 5, 6, 7, 9]);
    });

    it('should return to their index', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      indexMapper.moveItems(5, 0);
      indexMapper.moveItems(8, 1);

      expect(indexMapper._arrayMap.length).toBe(10);
      expect(indexMapper._arrayMap).toEqual([5, 8, 0, 1, 2, 3, 4, 6, 7, 9]);

      indexMapper.moveItems(1, 8);

      expect(indexMapper._arrayMap.length).toBe(10);
      expect(indexMapper._arrayMap).toEqual([5, 0, 1, 2, 3, 4, 6, 7, 8, 9]);

      indexMapper.moveItems(0, 5);

      expect(indexMapper._arrayMap.length).toBe(10);
      expect(indexMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('clearMap', () => {
    it('should clear _arrayMap', () => {
      indexMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      expect(indexMapper._arrayMap.length).toBe(10);

      indexMapper.clearMap();

      expect(indexMapper._arrayMap.length).toBe(0);
      expect(indexMapper._arrayMap).toEqual([]);
    });
  });
});
