import { isHeightBelow, resolveFractionalHeight, snapToLayoutUnit } from '../layoutUnit';

describe('layoutUnit', () => {
  describe('snapToLayoutUnit', () => {
    it('should leave a value that is already on the layout grid unchanged', () => {
      expect(snapToLayoutUnit(118.265625)).toBe(118.265625);
      expect(snapToLayoutUnit(29)).toBe(29);
      expect(snapToLayoutUnit(0)).toBe(0);
    });

    it('should move a value to the nearest step of 1/64', () => {
      // 118.266 is what a computed style serializes for a box laid out at 118.265625.
      expect(snapToLayoutUnit(118.266)).toBe(118.265625);
      expect(snapToLayoutUnit(63.64)).toBe(63.640625);
    });

    it('should remove float noise', () => {
      expect(snapToLayoutUnit(29.000000000001)).toBe(29);
    });
  });

  describe('resolveFractionalHeight', () => {
    it('should return the fraction that the whole-pixel read dropped, on the layout grid', () => {
      expect(resolveFractionalHeight('118.266px', 118)).toBe(118.265625);
    });

    it('should return the same height when the used height is a whole pixel', () => {
      expect(resolveFractionalHeight('229px', 229)).toBe(229);
    });

    it('should take a fraction above or below the whole-pixel read', () => {
      // `offsetHeight` rounds to the nearest pixel, so the fraction can lie on either side of it.
      expect(resolveFractionalHeight('117.734px', 118)).toBe(117.734375);
    });

    it('should snap on the grid of the zoomed layout, then bring the value back', () => {
      // Under `zoom: 1.25` the browser lays the row out on 1/64px steps of the ZOOMED space.
      // 99.8625 * 1.25 = 124.828125, which is on that grid; a snap in the unzoomed space gives 99.859375.
      expect(resolveFractionalHeight('99.8625px', 100, 1.25) * 1.25).toBe(124.828125);
      expect(resolveFractionalHeight('99.8625px', 100)).toBe(99.859375);
    });

    it('should fall back to the whole-pixel read for a height that is not a length', () => {
      expect(resolveFractionalHeight('auto', 118)).toBe(118);
      expect(resolveFractionalHeight('', 118)).toBe(118);
    });

    it('should fall back to the whole-pixel read when the used height is a pixel or more away', () => {
      // Not a refinement of it: the two reads describe different boxes.
      expect(resolveFractionalHeight('120px', 118)).toBe(118);
      expect(resolveFractionalHeight('119px', 118)).toBe(118);
    });
  });

  describe('isHeightBelow', () => {
    it('should not count a height as below itself', () => {
      expect(isHeightBelow(118.265625, 118.265625)).toBe(false);
      expect(isHeightBelow(41, 41)).toBe(false);
    });

    it('should count a provided height below the content it is shorter than', () => {
      expect(isHeightBelow(40.6, 40.890625)).toBe(true);
      expect(isHeightBelow(118, 118.265625)).toBe(true);
    });

    it('should not count a height above the other, or one a layout step apart', () => {
      expect(isHeightBelow(40.9, 40.890625)).toBe(false);
      expect(isHeightBelow(40.89, 40.890625)).toBe(false);
    });
  });
});
