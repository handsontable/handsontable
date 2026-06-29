import {
  getDecreasedIndexes,
  getIncreasedIndexes,
} from 'handsontable/translations/maps/utils';

describe('actionsOnIndexes', () => {
  describe('getDecreasedIndexes', () => {
    it('returns an unchanged copy when nothing was removed', () => {
      const values = [0, 1, 2, 3];
      const result = getDecreasedIndexes(values, []);

      expect(result).toEqual([0, 1, 2, 3]);
      expect(result).not.toBe(values);
    });

    it('decreases each remaining index by the count of removed indexes below it', () => {
      // Sequence 0..4 with physical indexes 1 and 3 removed leaves [0, 2, 4],
      // which reindexes to a dense [0, 1, 2].
      expect(getDecreasedIndexes([0, 2, 4], [1, 3])).toEqual([0, 1, 2]);
    });

    it('handles unsorted removed indexes', () => {
      expect(getDecreasedIndexes([0, 2, 4], [3, 1])).toEqual([0, 1, 2]);
    });

    it('matches the brute-force decrement for bulk removal', () => {
      const removed = [0, 5, 10, 15, 20, 25];
      const remaining = Array.from({ length: 30 }, (_, i) => i)
        .filter(i => removed.includes(i) === false);
      const bruteForce = remaining.map(v => v - removed.filter(r => r < v).length);

      expect(getDecreasedIndexes(remaining, removed)).toEqual(bruteForce);
    });
  });

  describe('getIncreasedIndexes', () => {
    it('increases indexes at or after the first inserted index', () => {
      expect(getIncreasedIndexes([0, 1, 2, 3], [1, 2])).toEqual([0, 3, 4, 5]);
    });
  });
});
