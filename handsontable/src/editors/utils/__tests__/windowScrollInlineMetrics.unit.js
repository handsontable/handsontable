import { getWindowScrollInlineMetrics } from '../windowScrollInlineMetrics';
import {
  getDropdownInlineSpace,
  shouldFlipDropdownHorizontally,
} from '../../multiSelectEditor/controllers/positioning';

/**
 * A grid instance reduced to the DOM measurements the helper reads, so each case can state the layout it
 * measures: the viewport's width, the grid root's box, the holder's document offset, and the page's scroll.
 *
 * @param {object} layout The measurements.
 * @param {boolean} layout.rtl Whether the grid's layout direction is RTL.
 * @param {number} layout.clientWidth The viewport's width (`documentElement.clientWidth`).
 * @param {object} layout.rootRect The grid root's box in viewport coordinates.
 * @param {number} layout.tableOffsetLeft The holder's left edge in document coordinates.
 * @param {number} layout.scrollX The page's horizontal scroll.
 * @returns {object} The stand-in instance.
 */
function createHot({ rtl, clientWidth, rootRect, tableOffsetLeft, scrollX }) {
  return {
    isRtl: () => rtl,
    rootDocument: { documentElement: { clientWidth } },
    rootElement: { getBoundingClientRect: () => rootRect },
    view: { getTableOffset: () => ({ left: tableOffsetLeft, top: 0 }) },
    rootWindow: { scrollX },
  };
}

describe('getWindowScrollInlineMetrics', () => {
  it('measures an RTL grid from the viewport\'s right edge to the grid root\'s right edge', () => {
    // An RTL page scrolled 3770 px toward its inline end, the grid starting 600 px from the page's right
    // edge: the root spans 3770-4450 in viewport coordinates, 680 px wide in a 1280 px viewport. Neither the
    // scroll (-3770) nor the root's width (680) can stand in for the offset or the width here.
    const hot = createHot({
      rtl: true,
      clientWidth: 1280,
      rootRect: { left: 3770, right: 4450, width: 680 },
      tableOffsetLeft: 0,
      scrollX: -3770,
    });

    expect(getWindowScrollInlineMetrics(hot)).toEqual({ inlineStartOffset: -3170, viewportWidth: 1280 });
  });

  it('measures an LTR grid from the viewport\'s left edge to the grid\'s left edge', () => {
    // The mirror: an LTR page scrolled 3770 px, the grid starting 600 px from the page's left edge.
    const hot = createHot({
      rtl: false,
      clientWidth: 1280,
      rootRect: { left: -3170, right: -2490, width: 680 },
      tableOffsetLeft: 600,
      scrollX: 3770,
    });

    expect(getWindowScrollInlineMetrics(hot)).toEqual({ inlineStartOffset: -3170, viewportWidth: 1280 });
  });

  it('keeps a list near the viewport\'s right edge on an RTL page from flipping off screen (the reported case)', () => {
    // A 1280 px viewport, the page scrolled to its inline end (scrollX -3770), the root as wide as the page
    // (3770-5050). `getEditedCellRect()` counts `start` from the root's right edge, so `start + width` is
    // `root.right - cell.left`.
    const hot = createHot({
      rtl: true,
      clientWidth: 1280,
      rootRect: { left: 3770, right: 5050, width: 1280 },
      tableOffsetLeft: 0,
      scrollX: -3770,
    });
    const metrics = getWindowScrollInlineMetrics(hot);
    const listWidth = 366;
    const nearRightEdge = getDropdownInlineSpace({ start: 5050 - 1200 - 1, width: 101 }, 1000, metrics);
    const nearLeftEdge = getDropdownInlineSpace({ start: 5050 - 200 - 1, width: 101 }, 1000, metrics);

    // Cell 1100-1200: 180 px from the viewport's right edge to the cell's left edge, 1201 px of room to the
    // left. The list fits there, so it opens from the cell's right edge toward the left.
    expect(nearRightEdge).toEqual({ spaceInlineStart: 180, spaceInlineEnd: 1201 });
    expect(shouldFlipDropdownHorizontally(listWidth, nearRightEdge.spaceInlineStart, nearRightEdge.spaceInlineEnd))
      .toBe(false);
    // Cell 100-200: only 201 px to the left, so the list flips toward the right.
    expect(nearLeftEdge).toEqual({ spaceInlineStart: 1180, spaceInlineEnd: 201 });
    expect(shouldFlipDropdownHorizontally(listWidth, nearLeftEdge.spaceInlineStart, nearLeftEdge.spaceInlineEnd))
      .toBe(true);
  });
});
