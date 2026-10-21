import { sumBlockWidthsOutsideBand } from '../utils';

describe('MergeCells sumBlockWidthsOutsideBand', () => {
  // Column `n` is `10 + n` pixels wide, so every sum names the columns it counted.
  const getWidth = (column: number) => 10 + column;

  it('should sum the block columns after an inline-start band', () => {
    // Block over columns 0-5, frozen band 0-1: columns 2-5 lie after it.
    expect(sumBlockWidthsOutsideBand(0, 5, [0, 1], getWidth)).toEqual({ before: 0, after: 12 + 13 + 14 + 15 });
  });

  it('should sum the block columns before an inline-end band', () => {
    // Block over columns 6-9, end band from column 8: columns 6-7 lie before it.
    expect(sumBlockWidthsOutsideBand(6, 9, [8, Infinity], getWidth)).toEqual({ before: 16 + 17, after: 0 });
  });

  it('should return zeroes for a block inside the band', () => {
    expect(sumBlockWidthsOutsideBand(1, 2, [0, 3], getWidth)).toEqual({ before: 0, after: 0 });
  });

  it('should count a block that starts after the band only from its own first column', () => {
    expect(sumBlockWidthsOutsideBand(4, 5, [0, 1], getWidth)).toEqual({ before: 0, after: 14 + 15 });
  });

  it('should treat an empty band (no frozen column) as one the whole block lies after', () => {
    expect(sumBlockWidthsOutsideBand(0, 2, [0, -1], getWidth)).toEqual({ before: 0, after: 10 + 11 + 12 });
  });
});
