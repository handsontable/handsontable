import { clampEdge, getHiddenHandleEdges } from '../handleAdjust';

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

describe('getHiddenHandleEdges', () => {
  it('hides top when the selection touches row 0 and end when it touches the last column', () => {
    const hidden = getHiddenHandleEdges({
      fromRow: 0, toRow: 4, fromCol: 1, toCol: 9,
      lastRow: 20, lastCol: 9, isRtl: false,
    });

    expect(hidden).toEqual(new Set(['top', 'end']));
  });

  it('mirrors start/end in RTL', () => {
    const hidden = getHiddenHandleEdges({
      fromRow: 2, toRow: 4, fromCol: 0, toCol: 5,
      lastRow: 20, lastCol: 9, isRtl: true,
    });

    // fromCol === 0 is the inline-start edge
    expect(hidden.has('start')).toBe(true);
  });
});
