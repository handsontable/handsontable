import { toStoredRowHeight, DEFAULT_HEIGHT_TOLERANCE } from '../helpers/measuredRowHeight';

describe('toStoredRowHeight', () => {
  describe('a row taller than the default', () => {
    it('should round a fraction below one half up, so the row-header clone is not shorter than the row', () => {
      // 118.265625 stored as 118 leaves the clone's row 0.27px short of the master's.
      expect(toStoredRowHeight(118.265625, 29)).toBe(119);
    });

    it('should round a fraction above one half up', () => {
      expect(toStoredRowHeight(117.734375, 29)).toBe(118);
    });

    it('should keep a whole-pixel height', () => {
      expect(toStoredRowHeight(118, 29)).toBe(118);
    });

    it('should round up a row only a layout step above the tolerance', () => {
      // A row that really is a bit taller than the default needs the room.
      expect(toStoredRowHeight(29 + DEFAULT_HEIGHT_TOLERANCE + (1 / 64), 29)).toBe(30);
    });
  });

  describe('a row at the default height', () => {
    it('should not inflate a default row that a zoomed-out browser measures a fraction above a whole pixel', () => {
      // Below 100% zoom the cells' 1px border is inflated (1.111px at 90%), so a 29px default row
      // measures 29.109375 and the default height reads 29.111. Rounded up it would be 30.
      expect(toStoredRowHeight(29.109375, 29.1111)).toBe(29);
    });

    it('should keep the plain rounding for a row within the tolerance of the default', () => {
      expect(toStoredRowHeight(29 + DEFAULT_HEIGHT_TOLERANCE, 29)).toBe(29);
      expect(toStoredRowHeight(29, 29)).toBe(29);
    });

    it('should round a row measured below the default to the nearest pixel', () => {
      // At 90% CSS zoom the ghost rect is scaled, so a row can measure well below the default.
      expect(toStoredRowHeight(26.09375, 29)).toBe(26);
    });
  });

  it('should treat a missing default height (0) as a default of nothing', () => {
    expect(toStoredRowHeight(18.2, 0)).toBe(19);
  });
});
