import { getDistanceOutsideRange, resolveDragDirection } from '../utils';

const BOTH = ['vertical', 'horizontal'];

describe('Autofill utils', () => {
  describe('getDistanceOutsideRange', () => {
    it('should return 0 for an index inside the range, edges included', () => {
      expect(getDistanceOutsideRange(2, 2, 4)).toBe(0);
      expect(getDistanceOutsideRange(3, 2, 4)).toBe(0);
      expect(getDistanceOutsideRange(4, 2, 4)).toBe(0);
    });

    it('should count the indexes between the range and an index past either edge', () => {
      expect(getDistanceOutsideRange(7, 2, 4)).toBe(3);
      expect(getDistanceOutsideRange(0, 2, 4)).toBe(2);
    });
  });

  describe('resolveDragDirection', () => {
    it('should return `null` while the pointer is inside the selection, whatever the current direction', () => {
      expect(resolveDragDirection(null, 0, 0, BOTH)).toBe(null);
      expect(resolveDragDirection('vertical', 0, 0, BOTH)).toBe(null);
      expect(resolveDragDirection('horizontal', 0, 0, BOTH)).toBe(null);
    });

    it('should resolve the only axis the pointer left', () => {
      expect(resolveDragDirection(null, 3, 0, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 0, 2, BOTH)).toBe('horizontal');
    });

    // DEV-140: the fill handle sits on the selection's corner, so a diagonal pointer leaves the
    // selection on both axes at once and used to resolve nothing at all.
    it('should resolve the axis the pointer is further outside on when it left both', () => {
      expect(resolveDragDirection(null, 4, 1, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 1, 3, BOTH)).toBe('horizontal');
    });

    it('should resolve a tie between the two axes as vertical', () => {
      expect(resolveDragDirection(null, 1, 1, BOTH)).toBe('vertical');
      expect(resolveDragDirection(null, 5, 5, BOTH)).toBe('vertical');
    });

    it('should ignore the axis the allowed directions leave out', () => {
      expect(resolveDragDirection(null, 1, 4, ['vertical'])).toBe('vertical');
      expect(resolveDragDirection(null, 4, 1, ['horizontal'])).toBe('horizontal');
    });

    it('should resolve nothing when the pointer left only along an axis the allowed directions leave out', () => {
      expect(resolveDragDirection(null, 0, 3, ['vertical'])).toBe(null);
      expect(resolveDragDirection(null, 3, 0, ['horizontal'])).toBe(null);
    });

    it('should keep the current direction while the pointer stays outside along its axis', () => {
      expect(resolveDragDirection('vertical', 2, 5, BOTH)).toBe('vertical');
      expect(resolveDragDirection('horizontal', 5, 2, BOTH)).toBe('horizontal');
    });

    it('should switch to the other axis once the pointer is back inside along the current one', () => {
      expect(resolveDragDirection('vertical', 0, 2, BOTH)).toBe('horizontal');
      expect(resolveDragDirection('horizontal', 2, 0, BOTH)).toBe('vertical');
    });

    it('should not switch to an axis the allowed directions leave out', () => {
      expect(resolveDragDirection('vertical', 0, 2, ['vertical'])).toBe('vertical');
      expect(resolveDragDirection('horizontal', 2, 0, ['horizontal'])).toBe('horizontal');
    });
  });
});
