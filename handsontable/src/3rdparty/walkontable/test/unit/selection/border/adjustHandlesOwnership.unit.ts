import {
  getAxisSegment,
  getCenterSegment,
  getHandleOwnership,
  getHandlesSpan,
  getMoveZoneOwnership,
  getOverlaySegment,
  isTrackEdgeVisible,
  ownsEdgeOnOwnAxis,
} from 'walkontable/selection/border/adjustHandlesOwnership';
import type {
  AdjustHandlesAxisLayout,
  AxisSegment,
  AxisVisibleRange,
} from 'walkontable/selection/border/adjustHandlesOwnership';

/**
 * Builds an axis layout: `total` tracks, `fixedStart` frozen at the start, `fixedEnd` at the end.
 *
 * @param {object} options The axis description.
 * @returns {AdjustHandlesAxisLayout}
 */
function axisLayout({
  total = 20,
  fixedStart = 0,
  fixedEnd = 0,
  overlaySegment = 'main',
  partial = [0, total - 1],
  full = partial,
}: {
  total?: number,
  fixedStart?: number,
  fixedEnd?: number,
  overlaySegment?: AxisSegment,
  partial?: [number, number],
  full?: [number, number],
}): AdjustHandlesAxisLayout {
  return {
    total,
    main: [fixedStart, total - fixedEnd - 1],
    overlaySegment,
    visible: { partial, full },
  };
}

describe('getOverlaySegment', () => {
  it.each([
    ['master', 'main', 'main'],
    ['top', 'start', 'main'],
    ['bottom', 'end', 'main'],
    ['inline_start', 'main', 'start'],
    ['top_inline_start_corner', 'start', 'start'],
    ['bottom_inline_start_corner', 'end', 'start'],
  ])('should map the %s overlay to the %s row segment and the %s column segment', (name, row, column) => {
    expect(getOverlaySegment(name, 'row')).toBe(row);
    expect(getOverlaySegment(name, 'column')).toBe(column);
  });
});

describe('getAxisSegment', () => {
  it('should split the axis at both freeze lines', () => {
    const axis = axisLayout({ total: 10, fixedStart: 2, fixedEnd: 2 });

    expect([0, 1, 2, 7, 8, 9].map(index => getAxisSegment(axis, index)))
      .toEqual(['start', 'start', 'main', 'main', 'end', 'end']);
  });
});

describe('isTrackEdgeVisible', () => {
  const visible: AxisVisibleRange = { partial: [3, 9], full: [4, 8] };

  it('should show both edges of a fully visible track', () => {
    expect(isTrackEdgeVisible(visible, 5, 'start')).toBe(true);
    expect(isTrackEdgeVisible(visible, 5, 'end')).toBe(true);
  });

  it('should hide the start edge of the first, partially visible track and keep its end edge', () => {
    // The sliver past a frozen pane: its start sits behind the pane.
    expect(isTrackEdgeVisible(visible, 3, 'start')).toBe(false);
    expect(isTrackEdgeVisible(visible, 3, 'end')).toBe(true);
  });

  it('should hide the end edge of the last, partially visible track and keep its start edge', () => {
    expect(isTrackEdgeVisible(visible, 9, 'start')).toBe(true);
    expect(isTrackEdgeVisible(visible, 9, 'end')).toBe(false);
  });

  it('should hide both edges of a track outside the visible range', () => {
    expect(isTrackEdgeVisible(visible, 2, 'end')).toBe(false);
    expect(isTrackEdgeVisible(visible, 10, 'start')).toBe(false);
  });

  it('should hide both edges of a single track wider than the viewport', () => {
    const wide: AxisVisibleRange = { partial: [5, 5], full: [-1, -1] };

    expect(isTrackEdgeVisible(wide, 5, 'start')).toBe(false);
    expect(isTrackEdgeVisible(wide, 5, 'end')).toBe(false);
  });

  it('should hide every edge when nothing is visible', () => {
    const none: AxisVisibleRange = { partial: [-1, -1], full: [-1, -1] };

    expect(isTrackEdgeVisible(none, 0, 'start')).toBe(false);
    expect(isTrackEdgeVisible(none, 0, 'end')).toBe(false);
  });
});

describe('getCenterSegment', () => {
  it('should pick the scrollable part while a whole track of it is visible', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [1, 8], full: [1, 7] });

    expect(getCenterSegment(axis, 0, 3)).toBe('main');
  });

  it('should fall back to the frozen pane when only a sliver of the scrollable part is visible', () => {
    // Column 1 shows a few pixels past the pane; column 2 onwards is fully visible, but the
    // selection ends on column 1.
    const axis = axisLayout({ fixedStart: 1, partial: [1, 8], full: [2, 7] });

    expect(getCenterSegment(axis, 0, 1)).toBe('start');
  });

  it('should fall back to the frozen pane when the scrollable part is scrolled away', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [30, 38], full: [30, 37] });

    expect(getCenterSegment(axis, 0, 3)).toBe('start');
  });

  it('should fall back to the bottom pane when the selection reaches only into it', () => {
    const axis = axisLayout({ total: 40, fixedEnd: 2, partial: [0, 12], full: [0, 11] });

    expect(getCenterSegment(axis, 30, 39)).toBe('end');
  });

  it('should prefer the top pane when a selection spanning both panes has no visible scrollable part', () => {
    const axis = axisLayout({ total: 40, fixedStart: 2, fixedEnd: 2, partial: [20, 30], full: [21, 29] });

    expect(getCenterSegment(axis, 1, 10)).toBe('start');
  });

  it('should keep the scrollable part for a selection entirely inside it, even with nothing visible', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [-1, -1], full: [-1, -1] });

    expect(getCenterSegment(axis, 3, 5)).toBe('main');
  });
});

describe('getHandleOwnership', () => {
  /**
   * Runs the rule for one overlay.
   *
   * @param {string} overlayName The overlay.
   * @param {object} axes The row and column axis options (without the overlay segment).
   * @param {number[]} corners The raw corners.
   * @param {number[]} clampedCorners The corners as the overlay renders them.
   * @returns {object}
   */
  function ownership(
    overlayName: string,
    axes: { row: Parameters<typeof axisLayout>[0], column: Parameters<typeof axisLayout>[0] },
    corners: number[],
    clampedCorners: number[],
  ) {
    return getHandleOwnership({
      row: axisLayout({ ...axes.row, overlaySegment: getOverlaySegment(overlayName, 'row') }),
      column: axisLayout({ ...axes.column, overlaySegment: getOverlaySegment(overlayName, 'column') }),
    }, corners, clampedCorners);
  }

  it('should give every handle of a selection crossing frozen columns to exactly one overlay', () => {
    // fixedColumnsStart: 1, selection A5:D9, scrolled to the start (the master also renders column 0).
    const axes = { row: { total: 40 }, column: { total: 20, fixedStart: 1, partial: [1, 8], full: [1, 7] } };
    const corners = [4, 0, 8, 3];

    expect(ownership('master', axes, corners, [4, 0, 8, 3]))
      .toEqual({ top: true, bottom: true, start: false, end: true });
    expect(ownership('inline_start', axes, corners, [4, 0, 8, 0]))
      .toEqual({ top: false, bottom: false, start: true, end: false });
  });

  it('should give every handle of a selection crossing both the top and the bottom freeze lines to one overlay', () => {
    // 10 rows, fixedRowsTop: 2, fixedRowsBottom: 2, selection rows 1-8.
    const axes = { row: { total: 10, fixedStart: 2, fixedEnd: 2, partial: [2, 7] as [number, number] }, column: {} };
    const corners = [1, 1, 8, 3];

    expect(ownership('top', axes, corners, [1, 1, 1, 3]))
      .toEqual({ top: true, bottom: false, start: false, end: false });
    expect(ownership('master', axes, corners, [1, 1, 7, 3]))
      .toEqual({ top: false, bottom: false, start: true, end: true });
    expect(ownership('bottom', axes, corners, [8, 1, 8, 3]))
      .toEqual({ top: false, bottom: true, start: false, end: false });
  });

  it('should move the top and bottom handles to the frozen columns when only a sliver of the scrollable part shows', () => {
    const axes = { row: { total: 40 }, column: { total: 40, fixedStart: 1, partial: [1, 9], full: [2, 8] } };
    const corners = [4, 0, 8, 1];

    // The end edge (column 1's) is visible in the sliver, so the master still draws the end handle.
    expect(ownership('master', axes, corners, [4, 1, 8, 1]))
      .toEqual({ top: false, bottom: false, start: false, end: true });
    expect(ownership('inline_start', axes, corners, [4, 0, 8, 0]))
      .toEqual({ top: true, bottom: true, start: true, end: false });
  });

  it('should not give the master an edge that is rendered but hidden', () => {
    // Column 1 is rendered (the rendering offset) but covered by the frozen pane.
    const axes = { row: { total: 40 }, column: { total: 40, fixedStart: 1, partial: [2, 9], full: [2, 8] } };

    expect(ownership('master', axes, [4, 0, 8, 1], [4, 1, 8, 1]))
      .toEqual({ top: false, bottom: false, start: false, end: false });
  });

  it('should not give an edge to an overlay that renders it clamped', () => {
    // A plain grid scrolled into the middle of a tall selection: rows 2 and 50 are not rendered.
    const axes = { row: { total: 60, partial: [20, 37], full: [20, 36] }, column: {} };

    expect(ownership('master', axes, [2, 1, 50, 3], [18, 1, 39, 3]))
      .toEqual({ top: false, bottom: false, start: true, end: true });
  });

  it('should give no scrollable-edge handle when nothing of the axis is visible', () => {
    const axes = { row: { total: 40 }, column: { total: 20, partial: [-1, -1], full: [-1, -1] } };

    expect(ownership('master', axes, [4, 3, 8, 5], [4, 3, 8, 5]))
      .toEqual({ top: true, bottom: true, start: false, end: false });
  });
});

describe('ownsEdgeOnOwnAxis', () => {
  it('should own an edge in the overlay segment that is rendered unclamped', () => {
    const axis = axisLayout({ fixedStart: 2, overlaySegment: 'main' });

    expect(ownsEdgeOnOwnAxis(axis, 5, 5)).toBe(true);
  });

  it('should not own an edge the overlay renders clamped', () => {
    const axis = axisLayout({ total: 60, overlaySegment: 'main' });

    // The edge lies in the overlay's own segment, but row 50 is past the rendered band (ending at 39).
    expect(ownsEdgeOnOwnAxis(axis, 50, 50)).toBe(true);
    expect(ownsEdgeOnOwnAxis(axis, 50, 39)).toBe(false);
  });

  it('should not own an edge that lies in another segment', () => {
    // At scroll offset 0 the master also renders the frozen rows, unclamped, behind the frozen pane.
    expect(ownsEdgeOnOwnAxis(axisLayout({ fixedStart: 2, overlaySegment: 'main' }), 1, 1)).toBe(false);
    expect(ownsEdgeOnOwnAxis(axisLayout({ total: 10, fixedEnd: 2, overlaySegment: 'main' }), 8, 8)).toBe(false);
  });
});

describe('getMoveZoneOwnership', () => {
  /**
   * Runs the rule for one overlay.
   *
   * @param {string} overlayName The overlay.
   * @param {object} axes The row and column axis options (without the overlay segment).
   * @param {number[]} corners The raw corners.
   * @param {number[]} clampedCorners The corners as the overlay renders them.
   * @returns {object}
   */
  function ownership(
    overlayName: string,
    axes: { row: Parameters<typeof axisLayout>[0], column: Parameters<typeof axisLayout>[0] },
    corners: number[],
    clampedCorners: number[],
  ) {
    return getMoveZoneOwnership({
      row: axisLayout({ ...axes.row, overlaySegment: getOverlaySegment(overlayName, 'row') }),
      column: axisLayout({ ...axes.column, overlaySegment: getOverlaySegment(overlayName, 'column') }),
    }, corners, clampedCorners);
  }

  describe('a selection crossing both freeze lines (fixedRowsTop: 2, fixedColumnsStart: 1, A1:D6)', () => {
    const axes = { row: { total: 40, fixedStart: 2 }, column: { total: 20, fixedStart: 1 } };
    const corners = [0, 0, 5, 3];

    // Scrolled to the start, so the master and the scroll-synced clones also render the frozen
    // tracks, unclamped, behind the frozen panes.
    it.each([
      ['top_inline_start_corner', [0, 0, 1, 0], { top: true, bottom: false, start: true, end: false }],
      ['top', [0, 0, 1, 3], { top: true, bottom: false, start: false, end: true }],
      ['inline_start', [0, 0, 5, 0], { top: false, bottom: true, start: true, end: false }],
      ['master', [0, 0, 5, 3], { top: false, bottom: true, start: false, end: true }],
    ])('should give the %s overlay only the outer edges of its slice', (overlayName, clamped, expected) => {
      expect(ownership(overlayName, axes, corners, clamped)).toEqual(expected);
    });

    it('should draw every edge in exactly the two overlays it passes through', () => {
      const slices: [string, number[]][] = [
        ['top_inline_start_corner', [0, 0, 1, 0]],
        ['top', [0, 0, 1, 3]],
        ['inline_start', [0, 0, 5, 0]],
        ['master', [0, 0, 5, 3]],
      ];
      const counts = { top: 0, bottom: 0, start: 0, end: 0 };

      slices.forEach(([overlayName, clamped]) => {
        const owned = ownership(overlayName, axes, corners, clamped);

        (Object.keys(counts) as (keyof typeof counts)[]).forEach((edge) => {
          counts[edge] += owned[edge] ? 1 : 0;
        });
      });

      expect(counts).toEqual({ top: 2, bottom: 2, start: 2, end: 2 });
    });
  });

  it('should give the bottom band to the frozen bottom pane', () => {
    // 10 rows, fixedRowsBottom: 2, selection rows 3-8.
    const axes = { row: { total: 10, fixedEnd: 2 }, column: {} };
    const corners = [3, 1, 8, 3];

    expect(ownership('master', axes, corners, [3, 1, 7, 3]))
      .toEqual({ top: true, bottom: false, start: true, end: true });
    expect(ownership('bottom', axes, corners, [8, 1, 8, 3]))
      .toEqual({ top: false, bottom: true, start: true, end: true });
  });

  it('should split every edge of a selection crossing the bottom and the column freeze lines', () => {
    // 10 rows, fixedRowsBottom: 2, fixedColumnsStart: 1, selection rows 3-8, columns 0-3.
    const axes = { row: { total: 10, fixedEnd: 2 }, column: { total: 10, fixedStart: 1 } };
    const corners = [3, 0, 8, 3];

    expect(ownership('master', axes, corners, [3, 0, 7, 3]))
      .toEqual({ top: true, bottom: false, start: false, end: true });
    expect(ownership('inline_start', axes, corners, [3, 0, 7, 0]))
      .toEqual({ top: true, bottom: false, start: true, end: false });
    expect(ownership('bottom', axes, corners, [8, 0, 8, 3]))
      .toEqual({ top: false, bottom: true, start: false, end: true });
    expect(ownership('bottom_inline_start_corner', axes, corners, [8, 0, 8, 0]))
      .toEqual({ top: false, bottom: true, start: true, end: false });
  });

  it('should give the master all four bands of a selection in a grid with no frozen panes', () => {
    expect(ownership('master', { row: {}, column: {} }, [4, 1, 8, 3], [4, 1, 8, 3]))
      .toEqual({ top: true, bottom: true, start: true, end: true });
  });

  it('should not draw a band on an edge clamped to the rendered band', () => {
    // A plain grid scrolled into the middle of a tall selection: rows 2 and 50 are not rendered.
    expect(ownership('master', { row: { total: 60 }, column: {} }, [2, 1, 50, 3], [18, 1, 39, 3]))
      .toEqual({ top: false, bottom: false, start: true, end: true });
  });

  it('should keep a band whose edge is rendered but scrolled behind the pane or out of view', () => {
    // Unlike the handles, a band needs no visible edge: a covered or clipped band cannot be grabbed.
    const axes = { row: { total: 40 }, column: { total: 40, fixedStart: 1, partial: [2, 9], full: [2, 8] } };

    expect(ownership('master', axes, [4, 1, 8, 1], [4, 1, 8, 1]))
      .toEqual({ top: true, bottom: true, start: true, end: true });
  });
});

describe('getHandlesSpan', () => {
  it('should clamp a frozen overlay to its own pane', () => {
    expect(getHandlesSpan(axisLayout({ fixedStart: 2, overlaySegment: 'start' }), 0, 5)).toEqual([0, 1]);
    expect(getHandlesSpan(axisLayout({ total: 10, fixedEnd: 2, overlaySegment: 'end' }), 5, 9)).toEqual([8, 9]);
  });

  it('should narrow the scrollable segment to its fully visible tracks', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [3, 12], full: [4, 11] });

    expect(getHandlesSpan(axis, 0, 15)).toEqual([4, 11]);
  });

  it('should fall back to the partially visible tracks when no whole track of the span is visible', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [3, 12], full: [4, 11] });

    expect(getHandlesSpan(axis, 0, 3)).toEqual([3, 3]);
  });

  it('should fall back to the segment when nothing of the span is visible', () => {
    const axis = axisLayout({ fixedStart: 1, partial: [10, 12], full: [10, 12] });

    expect(getHandlesSpan(axis, 0, 5)).toEqual([1, 5]);
  });
});
