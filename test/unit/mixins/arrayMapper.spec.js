import arrayMapper from 'handsontable/mixins/arrayMapper';

describe('arrayMapper mixin', () => {
  describe('insertItems', () => {
    it('should add items to _arrayMap to the given place', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.insertItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(13);
      expect(arrayMapper._arrayMap).toEqual([0, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      arrayMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      arrayMapper.insertItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(13);
      expect(arrayMapper._arrayMap).toEqual([1, 10, 11, 12, 6, 3, 4, 5, 7, 8, 9, 0, 2]);
    });
  });

  describe('removeItems', () => {
    it('should remove items from _arrayMap and returns removed items', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.removeItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(7);
      expect(arrayMapper._arrayMap).toEqual([0, 4, 5, 6, 7, 8, 9]);

      arrayMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      arrayMapper.removeItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(7);
      expect(arrayMapper._arrayMap).toEqual([1, 5, 7, 8, 9, 0, 2]);
    });
  });

  describe('unshiftItems', () => {
    it('should remove items from _arrayMap', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.unshiftItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(7);
      expect(arrayMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6]);

      arrayMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      arrayMapper.unshiftItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(7);
      expect(arrayMapper._arrayMap).toEqual([1, 3, 4, 5, 6, 0, 2]);
    });
  });

  describe('shiftItems', () => {
    it('should add items to _arrayMap', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.shiftItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(13);
      expect(arrayMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

      arrayMapper._arrayMap = [1, 6, 3, 4, 5, 7, 8, 9, 0, 2];

      arrayMapper.shiftItems(1, 3);

      expect(arrayMapper._arrayMap.length).toBe(13);
      expect(arrayMapper._arrayMap).toEqual([4, 1, 2, 3, 9, 6, 7, 8, 10, 11, 12, 0, 5]);
    });
  });

  describe('Move indexes', () => {
    it('should move given index', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.moveItems(8, 0); // [8, 0, 1, 2, 3, 4, 5, 6, 7, 9]
      arrayMapper.moveItems(3, 1); // [8, 2, 0, 1, 3, 4, 5, 6, 7, 9]
      arrayMapper.moveItems(5, 2);
      expect(arrayMapper._arrayMap).toEqual([8, 2, 4, 0, 1, 3, 5, 6, 7, 9]);
    });

    it('should move given indexes #1', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.moveItems([3, 2, 1, 0], 5);
      expect(arrayMapper._arrayMap).toEqual([4, 5, 6, 7, 8, 3, 2, 1, 0, 9]);
    });

    it('should move given indexes #2', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.moveItems([0, 1, 2, 3], 5);
      expect(arrayMapper._arrayMap).toEqual([4, 5, 6, 7, 8, 0, 1, 2, 3, 9]);
    });

    it('should return to their index', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      arrayMapper.moveItems(5, 0); // [5, 0, 1, 2, 3, 4, 6, 7, 8, 9]
      arrayMapper.moveItems(8, 1);

      expect(arrayMapper._arrayMap).toEqual([5, 8, 0, 1, 2, 3, 4, 6, 7, 9]);

      arrayMapper.moveItems(1, 8);

      expect(arrayMapper._arrayMap).toEqual([5, 0, 1, 2, 3, 4, 6, 7, 8, 9]);

      arrayMapper.moveItems(0, 5);

      expect(arrayMapper._arrayMap).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('clearMap', () => {
    it('should clear _arrayMap', () => {
      arrayMapper._arrayMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

      expect(arrayMapper._arrayMap.length).toBe(10);

      arrayMapper.clearMap();

      expect(arrayMapper._arrayMap.length).toBe(0);
      expect(arrayMapper._arrayMap).toEqual([]);
    });
  });
});
