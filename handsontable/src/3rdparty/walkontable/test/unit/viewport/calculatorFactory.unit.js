import { directionalBandOverscan } from '../../../src/viewport/calculatorFactory';

describe('directionalBandOverscan', () => {
  const NO_PREVIOUS_OVERSCAN = { startOffset: 0, endOffset: 0 };

  describe('scroll toward the end (positive delta)', () => {
    it('should extend the end side by half the band size', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 6 }); // ceil(11 / 2) = 6
    });

    it('should cap the extension at the axis maximum', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 39, count: 30 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 8 }); // ceil(30 / 2) = 15, capped at 8
    });

    it('should clamp the extension to the tracks left before the dataset end', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 86, end: 96, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 3 }); // only tracks 97-99 remain
    });

    it('should apply no overscan when the band already touches the dataset end', () => {
      const plan = directionalBandOverscan(
        250, NO_PREVIOUS_OVERSCAN, { start: 89, end: 99, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });

  describe('scroll toward the start (negative delta)', () => {
    it('should extend the start side by half the band size', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 6 });
    });

    it('should clamp the extension to the tracks left before the dataset start', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 3, end: 13, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 3 });
    });

    it('should apply no overscan when the band already touches the dataset start', () => {
      const plan = directionalBandOverscan(
        -250, NO_PREVIOUS_OVERSCAN, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });

  describe('zero delta (the other axis scrolled)', () => {
    it('should preserve an existing start-side overscan', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 5, endOffset: 1 }, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: -1, extension: 6 });
    });

    it('should preserve an existing end-side overscan', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 1, endOffset: 5 }, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toEqual({ side: 1, extension: 6 });
    });

    it('should not invent an overscan side for a band that was never overscanned', () => {
      const plan = directionalBandOverscan(
        0, NO_PREVIOUS_OVERSCAN, { start: 10, end: 20, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });

    it('should not read the asymmetric offsets of the clamped `auto` override (0/1 at a ' +
       'dataset edge) as an existing overscan', () => {
      // At scroll position 0 the ±1 'auto' override records offsets 0 (clamped start) and 1 —
      // only an offset greater than 1 proves a previous overscan.
      const plan = directionalBandOverscan(
        0, { startOffset: 0, endOffset: 1 }, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });

    it('should apply no overscan when the preserved side has no tracks left', () => {
      const plan = directionalBandOverscan(
        0, { startOffset: 5, endOffset: 1 }, { start: 0, end: 10, count: 11 }, 100, 8
      );

      expect(plan).toBeNull();
    });
  });
});
