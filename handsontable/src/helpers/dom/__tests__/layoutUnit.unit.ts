import { resolveFractionalHeight, snapToLayoutUnit } from '../layoutUnit';

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
});
