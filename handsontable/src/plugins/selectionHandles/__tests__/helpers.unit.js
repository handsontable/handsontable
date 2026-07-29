import { clampEdge } from '../helpers';

describe('clampEdge', () => {
  it('prevents top and start edges from crossing the opposite edge', () => {
    expect(clampEdge({ edge: 'top', target: 8, oppositeIndex: 4 })).toBe(4);
    expect(clampEdge({ edge: 'start', target: 7, oppositeIndex: 3 })).toBe(3);
  });

  it('prevents bottom and end edges from crossing the opposite edge', () => {
    expect(clampEdge({ edge: 'bottom', target: 2, oppositeIndex: 6 })).toBe(6);
    expect(clampEdge({ edge: 'end', target: 1, oppositeIndex: 5 })).toBe(5);
  });

  it('does not allow header coordinates', () => {
    expect(clampEdge({ edge: 'top', target: -1, oppositeIndex: 4 })).toBe(0);
  });

  it('does not modify a valid drag target', () => {
    expect(clampEdge({ edge: 'top', target: 3, oppositeIndex: 5 })).toBe(3);
  });
});
