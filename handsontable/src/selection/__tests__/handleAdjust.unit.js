import { clampEdge } from '../handleAdjust';

describe('clampEdge', () => {
  it('clamps a dragged top edge so it cannot cross the bottom edge (no flip)', () => {
    // range rows 2..5, dragging TOP toward row 9 -> clamp to row 5 (min 1-row height)
    expect(clampEdge({ edge: 'top', target: 9, oppositeIndex: 5 })).toBe(5);
  });

  it('clamps a dragged bottom edge so it cannot cross the top edge', () => {
    expect(clampEdge({ edge: 'bottom', target: 0, oppositeIndex: 2 })).toBe(2);
  });

  it('leaves a valid drag untouched', () => {
    expect(clampEdge({ edge: 'top', target: 3, oppositeIndex: 5 })).toBe(3);
  });

  it('clamps negative targets to 0 (never into headers)', () => {
    expect(clampEdge({ edge: 'top', target: -4, oppositeIndex: 5 })).toBe(0);
  });
});

