import { resolveEdgeSlotWidth } from '../slotWidth';

/**
 * Builds the input of `resolveEdgeSlotWidth()`: a 120px table in a 600px wrapper, the window owning the axis.
 *
 * @param {object} [overrides] The values to change.
 * @returns {object}
 */
function input(overrides = {}) {
  return {
    isWindowAxis: true,
    tableWidth: 120,
    workspaceWidth: 0,
    wrapperOffsetWidth: 600,
    wrapperClientWidth: 600,
    hasRenderedColumns: true,
    fillsWrapperWidth: false,
    ...overrides,
  };
}

describe('resolveEdgeSlotWidth()', () => {
  it('follows a table narrower than the wrapper', () => {
    expect(resolveEdgeSlotWidth(input())).toEqual({ slotWidth: 120, itemWidth: null });
  });

  it('stops at the wrapper for a table wider than it', () => {
    expect(resolveEdgeSlotWidth(input({ tableWidth: 1300 }))).toEqual({ slotWidth: 600, itemWidth: null });
  });

  it('takes the wrapper\'s width for a grid with no column drawn', () => {
    expect(resolveEdgeSlotWidth(input({ hasRenderedColumns: false }))).toEqual({ slotWidth: 600, itemWidth: null });
  });

  it('follows the grid\'s own box, past the wrapper, when the root owns the axis', () => {
    expect(resolveEdgeSlotWidth(input({ isWindowAxis: false, workspaceWidth: 800 })))
      .toEqual({ slotWidth: 800, itemWidth: null });
  });

  it('widens a slot that holds an element filling the wrapper, and keeps the table width for the others', () => {
    expect(resolveEdgeSlotWidth(input({ fillsWrapperWidth: true }))).toEqual({ slotWidth: 600, itemWidth: 120 });
  });

  it('changes nothing for an element filling the wrapper when the table is as wide as the wrapper', () => {
    expect(resolveEdgeSlotWidth(input({ fillsWrapperWidth: true, tableWidth: 1300 })))
      .toEqual({ slotWidth: 600, itemWidth: null });
  });

  it('changes nothing for an element filling the wrapper when the root owns the axis', () => {
    expect(resolveEdgeSlotWidth(input({ fillsWrapperWidth: true, isWindowAxis: false, workspaceWidth: 300 })))
      .toEqual({ slotWidth: 300, itemWidth: null });
  });
});
