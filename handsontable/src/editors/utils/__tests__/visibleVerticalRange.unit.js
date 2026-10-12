import { getVisibleVerticalRange } from '../visibleVerticalRange';

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
