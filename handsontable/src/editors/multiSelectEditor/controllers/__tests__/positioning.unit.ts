import {
  getDropdownInlineSpace,
  getFlippedInlineStartOffset,
  shouldFlipDropdownHorizontally,
} from '../positioning';

describe('shouldFlipDropdownHorizontally', () => {
  it('returns false when the dropdown fits in the remaining inline-end space', () => {
    expect(shouldFlipDropdownHorizontally(200, 500, 400)).toBe(false);
  });

  it('returns true when the dropdown does not fit on the inline end and there is more room on the inline start', () => {
    // DEV-1198: a list wider than the space to the right of the cell must open to the left.
    expect(shouldFlipDropdownHorizontally(250, 400, 120)).toBe(true);
  });

  it('returns false when the dropdown does not fit on either side but the inline end still has more room', () => {
    expect(shouldFlipDropdownHorizontally(300, 100, 200)).toBe(false);
  });

  it('returns false when both sides have equal remaining space', () => {
    expect(shouldFlipDropdownHorizontally(200, 150, 150)).toBe(false);
  });

  it('returns false when the dropdown width equals the remaining inline-end space', () => {
    expect(shouldFlipDropdownHorizontally(120, 400, 120)).toBe(false);
  });

  it('returns false for a zero-width dropdown', () => {
    expect(shouldFlipDropdownHorizontally(0, 400, 10)).toBe(false);
  });

  it('returns true when the start side is bigger even if the list still overhangs there', () => {
    // HandsontableEditor parity: the DEV-1198 fixture (grid 320, row header ~50,
    // last column 80, list ~350) offers ~270 on the start side. The flip still
    // happens; a leftover overhang is the same tradeoff autocomplete already makes.
    expect(shouldFlipDropdownHorizontally(350, 270, 80)).toBe(true);
  });
});

describe('getFlippedInlineStartOffset', () => {
  it('shifts the dropdown so its inline end aligns with the cell inline end', () => {
    // Cell starts at 200, is 80px wide; dropdown is 250px → left = 200 - (250 - 80) = 30.
    expect(getFlippedInlineStartOffset(200, 250, 80)).toBe(30);
  });
});

describe('getDropdownInlineSpace', () => {
  it('computes start and end space from the given cell rect', () => {
    // start 200 + width 80 = 280 to the cell's inline end; workspace 400 → 200 on the end side.
    expect(getDropdownInlineSpace({ start: 200, width: 80 }, 400)).toEqual({
      spaceInlineStart: 280,
      spaceInlineEnd: 200,
    });
  });

  it('changes the result when a different cell rect is passed', () => {
    const leftCell = getDropdownInlineSpace({ start: 50, width: 80 }, 400);
    const rightCell = getDropdownInlineSpace({ start: 250, width: 80 }, 400);

    expect(leftCell.spaceInlineStart).toBe(130);
    expect(rightCell.spaceInlineStart).toBe(330);
    expect(leftCell.spaceInlineEnd).not.toBe(rightCell.spaceInlineEnd);
  });

  it('switches to viewport width and applies the window-scroll offset', () => {
    expect(getDropdownInlineSpace(
      { start: 200, width: 80 },
      400,
      { inlineStartOffset: -50, viewportWidth: 800 }
    )).toEqual({
      spaceInlineStart: 230,
      spaceInlineEnd: 650,
    });
  });

  it('clamps a window-scrolled start that would go negative', () => {
    expect(getDropdownInlineSpace(
      { start: 10, width: 20 },
      400,
      { inlineStartOffset: -100, viewportWidth: 800 }
    )).toEqual({
      spaceInlineStart: 0,
      spaceInlineEnd: 820,
    });
  });
});
