import { matchesCloneScrollTarget, measureCloneScrollDrift } from '../../../src/overlay/scroll/cloneScrollDrift';
import { ScrollSync, type ScrollSyncDeps } from '../../../src/overlay/scroll/scrollSync';

describe('measureCloneScrollDrift', () => {
  const range = { maxTop: 1000, maxLeft: 500 };

  it('should report no drift when the holder sits where the engine wrote it', () => {
    const drift = measureCloneScrollDrift({ top: 300, left: 120 }, range, { top: 300, left: 120 });

    expect(drift).toEqual({ expectedTop: 300, expectedLeft: 120, driftTop: 0, driftLeft: 0 });
  });

  it('should report the distance from the written offset on each axis', () => {
    const drift = measureCloneScrollDrift({ top: 340, left: 100 }, range, { top: 300, left: 120 });

    expect(drift.driftTop).toBe(40);
    expect(drift.driftLeft).toBe(-20);
    expect(drift.expectedTop).toBe(300);
    expect(drift.expectedLeft).toBe(120);
  });

  it('should clamp the written offset to the range the holder has now', () => {
    // The engine wrote 1200 into a holder that could only scroll 1000: the browser clamped it, so
    // the holder sitting at the end of its range is not a drift.
    const drift = measureCloneScrollDrift({ top: 1000, left: 0 }, range, { top: 1200, left: 0 });

    expect(drift.expectedTop).toBe(1000);
    expect(drift.driftTop).toBe(0);
  });

  it('should treat a holder with no range as expected at zero', () => {
    const drift = measureCloneScrollDrift({ top: 0, left: 0 }, { maxTop: 0, maxLeft: 0 }, { top: 500, left: 80 });

    expect(drift).toEqual({ expectedTop: 0, expectedLeft: 0, driftTop: 0, driftLeft: 0 });
  });

  it('should accept a negative horizontal offset for an RTL holder', () => {
    const drift = measureCloneScrollDrift({ top: 0, left: -230 }, range, { top: 0, left: -200 });

    expect(drift.expectedLeft).toBe(-200);
    expect(drift.driftLeft).toBe(-30);
  });

  it('should ignore a sub-pixel difference', () => {
    const drift = measureCloneScrollDrift({ top: 300.4, left: 119.6 }, range, { top: 300, left: 120 });

    expect(drift.driftTop).toBe(0);
    expect(drift.driftLeft).toBe(0);
  });
});

describe('matchesCloneScrollTarget', () => {
  it('should match an offset the engine wrote', () => {
    expect(matchesCloneScrollTarget({ top: 300, left: 120 }, { top: 300, left: 120 })).toBe(true);
  });

  it('should match a sub-pixel rounding of the written offset, so a zoomed page measures no range', () => {
    // The listener asks this BEFORE the two layout-forcing range reads. A fractionally zoomed page
    // stores 300.4 for a write of 300 on every scroll frame; without the tolerance here every one of
    // those frames would pay both reads.
    expect(matchesCloneScrollTarget({ top: 300.4, left: 119.6 }, { top: 300, left: 120 })).toBe(true);
  });

  it('should not match a real scroll on either axis', () => {
    expect(matchesCloneScrollTarget({ top: 340, left: 120 }, { top: 300, left: 120 })).toBe(false);
    expect(matchesCloneScrollTarget({ top: 300, left: 90 }, { top: 300, left: 120 })).toBe(false);
  });

  it('should not let a run of sub-pixel scrolls creep past the tolerance', () => {
    // The comparison is against the ledger, never against the previous offset, so half-pixel steps
    // do not accumulate into an unreported scroll.
    expect(matchesCloneScrollTarget({ top: 300.5, left: 0 }, { top: 300, left: 0 })).toBe(true);
    expect(matchesCloneScrollTarget({ top: 301, left: 0 }, { top: 300, left: 0 })).toBe(false);
  });
});

describe('ScrollSync#getCloneScrollTarget', () => {
  /**
   * Builds a ScrollSync with three clone holders and an element owner for both axes, in the shape
   * `syncScrollWithMaster` reads. jsdom ignores a `scrollTop` write, so the owner's offsets are
   * defined as own properties; the assertions are about the ledger, not the DOM.
   *
   * @param {object} owner The offsets the master holder reports.
   * @param {number} owner.scrollTop The vertical offset.
   * @param {number} owner.scrollLeft The horizontal offset.
   * @returns {object} The ScrollSync under test and the three clone holders.
   */
  const createScrollSync = (owner: { scrollTop: number; scrollLeft: number }) => {
    const rootWindow = window;
    const masterHolder = document.createElement('div');

    Object.defineProperty(masterHolder, 'scrollTop', { value: owner.scrollTop, configurable: true });
    Object.defineProperty(masterHolder, 'scrollLeft', { value: owner.scrollLeft, configurable: true });

    const createOverlay = () => ({
      updateMainScrollableElement: () => {},
      needFullRender: true,
      trimmingContainer: masterHolder,
      mainTableScrollableElement: masterHolder,
      clone: { wtTable: { holder: document.createElement('div') } },
    });
    const topOverlay = createOverlay();
    const bottomOverlay = createOverlay();
    const inlineStartOverlay = createOverlay();
    const deps = {
      rootWindow,
      wtTable: {
        wtRootElement: document.createElement('div'),
        TABLE: document.createElement('table'),
        holder: masterHolder,
      },
      geometryReader: {
        isRendered: () => true,
        getComputedStyle: (element: Element) => rootWindow.getComputedStyle(element),
      },
      eventManager: { clearEvents: () => {} },
      registerListeners: () => {},
      refreshAll: () => {},
      getDestroyed: () => false,
      getTopOverlay: () => topOverlay,
      getInlineStartOverlay: () => inlineStartOverlay,
      getBottomOverlay: () => bottomOverlay,
      getWtViewport: () => ({
        resetAllOversizedRows: () => {},
        invalidateColumnWidthCache: () => {},
      }),
    } as unknown as ScrollSyncDeps;

    return {
      scrollSync: new ScrollSync(deps),
      topHolder: topOverlay.clone.wtTable.holder,
      bottomHolder: bottomOverlay.clone.wtTable.holder,
      inlineStartHolder: inlineStartOverlay.clone.wtTable.holder,
    };
  };

  it('should expect a holder it never wrote to at offset zero', () => {
    const { scrollSync } = createScrollSync({ scrollTop: 300, scrollLeft: 120 });

    expect(scrollSync.getCloneScrollTarget(document.createElement('div'))).toEqual({ top: 0, left: 0 });
  });

  it('should record the offset written to each clone holder after a render-state change', () => {
    const { scrollSync, topHolder, bottomHolder, inlineStartHolder } =
      createScrollSync({ scrollTop: 300, scrollLeft: 120 });

    scrollSync.setRenderingStateChanged(true);
    scrollSync.syncScrollWithMaster();

    expect(scrollSync.getCloneScrollTarget(topHolder)).toEqual({ top: 0, left: 120 });
    expect(scrollSync.getCloneScrollTarget(bottomHolder)).toEqual({ top: 0, left: 120 });
    expect(scrollSync.getCloneScrollTarget(inlineStartHolder)).toEqual({ top: 300, left: 0 });
  });

  it('should write nothing, and record nothing, while the render state is unchanged', () => {
    const { scrollSync, topHolder, inlineStartHolder } = createScrollSync({ scrollTop: 300, scrollLeft: 120 });

    scrollSync.syncScrollWithMaster();

    expect(scrollSync.getCloneScrollTarget(topHolder)).toEqual({ top: 0, left: 0 });
    expect(scrollSync.getCloneScrollTarget(inlineStartHolder)).toEqual({ top: 0, left: 0 });
  });

  it('should hand out a copy, so a caller cannot reach into the ledger', () => {
    const { scrollSync, inlineStartHolder } = createScrollSync({ scrollTop: 300, scrollLeft: 0 });

    scrollSync.setRenderingStateChanged(true);
    scrollSync.syncScrollWithMaster();

    const target = scrollSync.getCloneScrollTarget(inlineStartHolder);

    target.top = 999;

    expect(scrollSync.getCloneScrollTarget(inlineStartHolder).top).toBe(300);
  });

  it('should take the clamped offset back after a write the browser could not honor', () => {
    // The engine wrote 300 while the holder could only reach 120, so the DOM sits at 120 and the
    // ledger asked for 300. The listener resolves that to no drift and hands 120 back; without this
    // the two disagree until the next in-range write, and every scroll event on that holder pays two
    // layout-forcing range reads to reach the same answer.
    const { scrollSync, inlineStartHolder } = createScrollSync({ scrollTop: 300, scrollLeft: 0 });

    scrollSync.setRenderingStateChanged(true);
    scrollSync.syncScrollWithMaster();

    expect(scrollSync.getCloneScrollTarget(inlineStartHolder)).toEqual({ top: 300, left: 0 });

    scrollSync.recordClampedCloneScrollTarget(inlineStartHolder, { top: 120, left: 0 });

    expect(scrollSync.getCloneScrollTarget(inlineStartHolder)).toEqual({ top: 120, left: 0 });
    expect(matchesCloneScrollTarget({ top: 120, left: 0 },
      scrollSync.getCloneScrollTarget(inlineStartHolder))).toBe(true);
  });

  it('should record a clamped offset for a holder it never wrote to', () => {
    const { scrollSync } = createScrollSync({ scrollTop: 0, scrollLeft: 0 });
    const holder = document.createElement('div');

    scrollSync.recordClampedCloneScrollTarget(holder, { top: 40, left: 15 });

    expect(scrollSync.getCloneScrollTarget(holder)).toEqual({ top: 40, left: 15 });
  });
});
