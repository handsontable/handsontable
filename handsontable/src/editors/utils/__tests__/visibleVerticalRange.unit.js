import { getVerticalRoom, getVisibleVerticalRange } from '../visibleVerticalRange';

describe('getVisibleVerticalRange', () => {
  it('returns the viewport when the box is the viewport (no transformed ancestor)', () => {
    expect(getVisibleVerticalRange({ top: 0, height: 720 }, 720)).toEqual({ top: 0, bottom: 720 });
  });

  it('cuts a box that scrolls with the page at the viewport\'s bottom', () => {
    // A transformed ancestor 2900 px tall, the page scrolled so that its top is 1500 px above the viewport.
    expect(getVisibleVerticalRange({ top: -1500, height: 2900 }, 720)).toEqual({ top: 0, bottom: 720 });
  });

  it('keeps the box\'s own edges when it lies inside the viewport (a clipping modal)', () => {
    expect(getVisibleVerticalRange({ top: 100, height: 400 }, 720)).toEqual({ top: 100, bottom: 500 });
  });

  it('collapses to a line when the box is outside the viewport', () => {
    expect(getVisibleVerticalRange({ top: 800, height: 400 }, 720)).toEqual({ top: 800, bottom: 800 });
    expect(getVisibleVerticalRange({ top: -500, height: 400 }, 720)).toEqual({ top: 0, bottom: 0 });
  });
});

describe('getVerticalRoom', () => {
  it('measures the cell against the viewport when the box is the viewport', () => {
    expect(getVerticalRoom({ top: 589, bottom: 618 }, { top: 0, height: 720 }, 720))
      .toEqual({ spaceAbove: 589, spaceBelow: 102 });
  });

  it('measures the cell against the visible part of a box that scrolls with the page', () => {
    // The same cell, the box's bottom 1500 px below the viewport's: the room below ends at the viewport.
    expect(getVerticalRoom({ top: 589, bottom: 618 }, { top: -1500, height: 3720 }, 720))
      .toEqual({ spaceAbove: 589, spaceBelow: 102 });
  });

  it('measures the cell against a box that lies inside the viewport', () => {
    expect(getVerticalRoom({ top: 200, bottom: 230 }, { top: 100, height: 400 }, 720))
      .toEqual({ spaceAbove: 100, spaceBelow: 270 });
  });

  it('never returns negative room', () => {
    expect(getVerticalRoom({ top: 800, bottom: 830 }, { top: 0, height: 720 }, 720))
      .toEqual({ spaceAbove: 800, spaceBelow: 0 });
  });
});
