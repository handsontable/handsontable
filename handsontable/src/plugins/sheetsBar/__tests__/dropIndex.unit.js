import { computeDropIndex } from '../ui/dropIndex';

describe('computeDropIndex', () => {
  // Three 100px tabs laid out from x=0: centres at 50, 150, 250.
  const centers = [50, 150, 250];

  it('keeps the index while the pointer stays over the dragged tab', () => {
    expect(computeDropIndex(centers, 50, 0)).toBe(0);
    expect(computeDropIndex(centers, 99, 0)).toBe(0);
  });

  it('moves the tab once the pointer passes a neighbour centre', () => {
    expect(computeDropIndex(centers, 151, 0)).toBe(1);
    expect(computeDropIndex(centers, 251, 0)).toBe(2);
  });

  it('moves the tab left when the pointer passes a lower neighbour centre', () => {
    expect(computeDropIndex(centers, 149, 2)).toBe(1);
    expect(computeDropIndex(centers, 49, 2)).toBe(0);
  });

  it('clamps to the ends of the strip', () => {
    expect(computeDropIndex(centers, -500, 1)).toBe(0);
    expect(computeDropIndex(centers, 5000, 1)).toBe(2);
  });

  it('returns the same index for a single tab', () => {
    expect(computeDropIndex([50], 5000, 0)).toBe(0);
  });

  it('does not oscillate when the pointer rests on a neighbour centre', () => {
    expect(computeDropIndex(centers, 150, 0)).toBe(0);
    expect(computeDropIndex(centers, 150, 2)).toBe(2);
  });

  describe('descending centres (RTL)', () => {
    const rtlCenters = [250, 150, 50];

    it('keeps the index while the pointer stays over the dragged tab', () => {
      expect(computeDropIndex(rtlCenters, 250, 0)).toBe(0);
      expect(computeDropIndex(rtlCenters, 201, 0)).toBe(0);
    });

    it('moves the tab once the pointer passes a neighbour centre', () => {
      expect(computeDropIndex(rtlCenters, 149, 0)).toBe(1);
      expect(computeDropIndex(rtlCenters, 49, 0)).toBe(2);
    });

    it('moves the tab left when the pointer passes a higher neighbour centre', () => {
      expect(computeDropIndex(rtlCenters, 151, 2)).toBe(1);
      expect(computeDropIndex(rtlCenters, 251, 2)).toBe(0);
    });

    it('clamps to the ends of the strip', () => {
      expect(computeDropIndex(rtlCenters, 5000, 1)).toBe(0);
      expect(computeDropIndex(rtlCenters, -500, 1)).toBe(2);
    });

    it('does not oscillate when the pointer rests on a neighbour centre', () => {
      expect(computeDropIndex(rtlCenters, 150, 0)).toBe(0);
      expect(computeDropIndex(rtlCenters, 150, 2)).toBe(2);
    });
  });
});
