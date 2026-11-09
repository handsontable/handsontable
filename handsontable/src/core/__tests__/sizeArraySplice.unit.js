import { insertSizeSlots, removeSizeSlots, moveSizeSlots } from '../sizeArraySplice';

describe('sizeArraySplice', () => {
  describe('insertSizeSlots', () => {
    it('should insert empty slots at the physical index', () => {
      expect(insertSizeSlots([100, 120, 140], 1, 2)).toEqual([100, undefined, undefined, 120, 140]);
    });

    it('should return a new array and keep the given one untouched', () => {
      const sizes = [100, 120];

      expect(insertSizeSlots(sizes, 0, 1)).not.toBe(sizes);
      expect(sizes).toEqual([100, 120]);
    });

    it('should leave an array shorter than the index as it is', () => {
      const sizes = [100];

      expect(insertSizeSlots(sizes, 3, 1)).toBe(sizes);
    });
  });

  describe('removeSizeSlots', () => {
    it('should drop the sizes at the given physical indexes', () => {
      expect(removeSizeSlots([100, 120, 140, 160], [0, 2])).toEqual([120, 160]);
    });

    it('should return a new array and keep the given one untouched', () => {
      const sizes = [100, 120];

      expect(removeSizeSlots(sizes, [0])).not.toBe(sizes);
      expect(sizes).toEqual([100, 120]);
    });

    it('should keep every remaining size at its index in a sparse array', () => {
      // eslint-disable-next-line no-sparse-arrays
      const removed = removeSizeSlots([, , 30, , , 80], [0]);

      expect(removed.length).toBe(5);
      expect(removed[1]).toBe(30);
      expect(removed[4]).toBe(80);
    });

    it('should return the given array when no removed index names one of its sizes', () => {
      const sizes = [100, 120];

      expect(removeSizeSlots(sizes, [5, 9])).toBe(sizes);
    });
  });

  describe('moveSizeSlots', () => {
    it('should move a block down to the index it takes after the removal', () => {
      // the same arguments `MetaManager#removeRow(0, 1)` then `createRow(2, 1)` take
      expect(moveSizeSlots([10, 20, 30, 40], 0, 2, 1)).toEqual([20, 30, 10, 40]);
    });

    it('should move a block up', () => {
      expect(moveSizeSlots([10, 20, 30, 40], 2, 0, 2)).toEqual([30, 40, 10, 20]);
    });

    it('should pad the array when the block lands past its end', () => {
      expect(moveSizeSlots([10, 20], 0, 3, 1)).toEqual([20, undefined, undefined, 10]);
    });

    it('should leave an array that ends before the block untouched in its sizes', () => {
      expect(moveSizeSlots([10], 2, 0, 1)).toEqual([undefined, 10]);
    });

    it('should return the given array when the block does not move', () => {
      const sizes = [10, 20];

      expect(moveSizeSlots(sizes, 1, 1, 1)).toBe(sizes);
    });
  });
});
