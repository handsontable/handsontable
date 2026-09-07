import { ScrollSync, type ScrollSyncDeps } from '../../../src/overlay/scroll/scrollSync';

describe('ScrollSync#resolveProvisionalLayout', () => {
  /**
   * Builds a ScrollSync whose table reports the state the arguments describe, and
   * counts the work a resolution pass does.
   *
   * `trimmedByElement` is the disagreement the pass has to cope with: an element
   * trims the table while the scrolling element resolves to the window. The two
   * answers come from helpers with different rules - `getTrimmingContainer` counts
   * `overflow: hidden`, `getScrollableElement` does not - so they can disagree for
   * as long as the instance lives.
   *
   * @param {object} state The table state to report.
   * @param {boolean} state.trimmedByElement Whether an element trims the table.
   * @returns {object} The ScrollSync under test, the work counters, and a `render`
   *                   call that puts the table into the layout.
   */
  const createScrollSync = ({ trimmedByElement }: { trimmedByElement: boolean }) => {
    // Constructed while the table is not rendered, which is what makes the first
    // answer provisional, then rendered - the sequence a table built into a
    // container outside the layout goes through.
    let rendered = false;
    const rootWindow = window;
    const counters = { registerListeners: 0, clearEvents: 0, overlayUpdates: 0, resetAllOversizedRows: 0 };
    const overlay = {
      updateMainScrollableElement: () => {
        counters.overlayUpdates += 1;
      },
      needFullRender: false,
      trimmingContainer: trimmedByElement ? document.createElement('div') : rootWindow,
    };
    // Detached elements: the root has no parent to clip, and the TABLE has no
    // scrollable ancestor, so the resolved element is the window - the answer that
    // disagrees with an element trimming container.
    const wtTable = {
      wtRootElement: document.createElement('div'),
      TABLE: document.createElement('table'),
      holder: document.createElement('div'),
    };
    const deps = {
      rootWindow,
      wtTable,
      geometryReader: {
        isRendered: () => rendered,
        getComputedStyle: (element: Element) => rootWindow.getComputedStyle(element),
      },
      eventManager: {
        clearEvents: () => {
          counters.clearEvents += 1;
        },
      },
      registerListeners: () => {
        counters.registerListeners += 1;
      },
      refreshAll: () => {},
      getDestroyed: () => false,
      getTopOverlay: () => overlay,
      getInlineStartOverlay: () => overlay,
      getBottomOverlay: () => overlay,
      getWtViewport: () => ({
        resetAllOversizedRows: () => {
          counters.resetAllOversizedRows += 1;
        },
        invalidateColumnWidthCache: () => {},
      }),
    } as unknown as ScrollSyncDeps;

    return {
      scrollSync: new ScrollSync(deps),
      counters,
      render: () => {
        rendered = true;
      },
      unrender: () => {
        rendered = false;
      },
    };
  };

  it('should stop retrying when the resolved scrolling element repeats', () => {
    const { scrollSync, render } = createScrollSync({ trimmedByElement: true });

    expect(scrollSync.isScrollableElementProvisional).toBe(true);

    // Rendered now, but the two helpers disagree - the shape a table in an iframe
    // driven from the parent realm has, where the disagreement never goes away.
    render();
    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(true);

    scrollSync.resolveProvisionalLayout();

    // Second pass computes the same answer, so there is nothing left to wait for.
    expect(scrollSync.isScrollableElementProvisional).toBe(false);

    scrollSync.resolveProvisionalLayout();
    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(false);
  });

  it('should rebind nothing while the layout has not settled', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: true });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resolveProvisionalLayout();

    // A pass that cannot settle used to rebind every listener first and re-arm
    // itself afterwards, so it paid the full cost on every draw for ever.
    expect(counters.registerListeners).toBe(0);
    expect(counters.clearEvents).toBe(0);
    expect(counters.overlayUpdates).toBe(0);
    expect(counters.resetAllOversizedRows).toBe(0);
  });

  it('should rebind the listeners once when the layout settles', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(false);
    expect(counters.registerListeners).toBe(1);
    expect(counters.clearEvents).toBe(1);

    scrollSync.resolveProvisionalLayout();

    expect(counters.registerListeners).toBe(1);
  });

  it('should leave the sizes in place until a draw consumes the reset', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();

    // Dropping them here instead leaves them dropped: the redraw this pass can ask
    // for renders no cells, so `markOversizedRows` never runs and the row heights
    // are never taken again. The next draw drops them on its way in.
    expect(counters.resetAllOversizedRows).toBe(0);

    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(1);
  });

  it('should keep dropping the sizes until a draw has rendered the cells', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(2);
  });

  it('should drop the sizes once per settled layout', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();
    scrollSync.confirmSizesRemeasured();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(1);
  });

  it('should not spend the mark on a draw that rendered the cells without dropping anything', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.confirmSizesRemeasured();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(1);
  });

  it('should grant a fresh retry to a layout that is armed again', () => {
    const { scrollSync, counters, render, unrender } = createScrollSync({ trimmedByElement: true });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(false);

    unrender();
    scrollSync.updateMainScrollableElements();

    expect(scrollSync.isScrollableElementProvisional).toBe(true);

    render();
    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(true);
    expect(counters.registerListeners).toBe(1);
  });

  it('should drop nothing on a draw that follows no settled layout', () => {
    const { scrollSync, counters } = createScrollSync({ trimmedByElement: false });

    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(0);
  });

  it('should do nothing while the table is still not rendered', () => {
    const { scrollSync, counters } = createScrollSync({ trimmedByElement: true });

    scrollSync.resolveProvisionalLayout();

    expect(scrollSync.isScrollableElementProvisional).toBe(true);
    expect(counters.registerListeners).toBe(0);
  });
});

describe('ScrollSync#resyncScrollableElementsWithOwners', () => {
  /**
   * Builds a ScrollSync over two overlays whose axis owners a test can move, and counts the
   * listener rebinds.
   *
   * @param {object} state The table state to report.
   * @param {boolean} state.rendered Whether the table is in the layout at construction.
   * @returns {object} The ScrollSync under test, the two overlays, and the rebind counter.
   */
  const createScrollSync = ({ rendered }: { rendered: boolean }) => {
    const rootWindow = window;
    const counters = { registerListeners: 0 };
    const createOverlay = () => ({
      updateMainScrollableElement: () => {},
      needFullRender: false,
      trimmingContainer: rootWindow as HTMLElement | Window,
    });
    const topOverlay = createOverlay();
    const inlineStartOverlay = createOverlay();
    const wtTable = {
      wtRootElement: document.createElement('div'),
      TABLE: document.createElement('table'),
      holder: document.createElement('div'),
    };
    const deps = {
      rootWindow,
      wtTable,
      geometryReader: {
        isRendered: () => rendered,
        getComputedStyle: (element: Element) => rootWindow.getComputedStyle(element),
      },
      eventManager: {
        clearEvents: () => {},
      },
      registerListeners: () => {
        counters.registerListeners += 1;
      },
      refreshAll: () => {},
      getDestroyed: () => false,
      getTopOverlay: () => topOverlay,
      getInlineStartOverlay: () => inlineStartOverlay,
      getBottomOverlay: () => createOverlay(),
      getWtViewport: () => ({
        resetAllOversizedRows: () => {},
        invalidateColumnWidthCache: () => {},
      }),
    } as unknown as ScrollSyncDeps;

    return {
      scrollSync: new ScrollSync(deps),
      topOverlay,
      inlineStartOverlay,
      counters,
    };
  };

  it('should record the owners on the first pass without rebinding', () => {
    const { scrollSync, counters } = createScrollSync({ rendered: true });

    scrollSync.resyncScrollableElementsWithOwners();
    scrollSync.resyncScrollableElementsWithOwners();

    expect(counters.registerListeners).toBe(0);
  });

  it('should rebind once when an axis owner moves, then stay quiet', () => {
    const { scrollSync, inlineStartOverlay, counters } = createScrollSync({ rendered: true });

    scrollSync.resyncScrollableElementsWithOwners();

    // A `width` that becomes definite hands the horizontal axis from the window to the root.
    inlineStartOverlay.trimmingContainer = document.createElement('div');
    scrollSync.resyncScrollableElementsWithOwners();

    expect(counters.registerListeners).toBe(1);

    scrollSync.resyncScrollableElementsWithOwners();
    scrollSync.resyncScrollableElementsWithOwners();

    expect(counters.registerListeners).toBe(1);
  });

  it('should treat a rebind requested elsewhere as the new baseline', () => {
    const { scrollSync, topOverlay, counters } = createScrollSync({ rendered: true });

    scrollSync.resyncScrollableElementsWithOwners();
    topOverlay.trimmingContainer = document.createElement('div');
    // Core's `updateSettings` calls this on a `height` change, after the owners moved.
    scrollSync.updateMainScrollableElements();

    expect(counters.registerListeners).toBe(1);

    scrollSync.resyncScrollableElementsWithOwners();

    expect(counters.registerListeners).toBe(1);
  });

  it('should leave a provisional answer to the provisional-layout pass', () => {
    const { scrollSync, inlineStartOverlay, counters } = createScrollSync({ rendered: false });

    expect(scrollSync.isScrollableElementProvisional).toBe(true);

    inlineStartOverlay.trimmingContainer = document.createElement('div');
    scrollSync.resyncScrollableElementsWithOwners();

    expect(counters.registerListeners).toBe(0);
  });
});

describe('ScrollSync#syncScrollWithMaster', () => {
  /**
   * Builds a ScrollSync over three rendering overlays whose per-axis scrolling elements a test can
   * set independently, so the split modes can be described directly.
   *
   * @param {object} owners The element that scrolls each axis.
   * @param {HTMLElement | Window} owners.horizontal The horizontal scrolling element.
   * @param {HTMLElement | Window} owners.vertical The vertical scrolling element.
   * @returns {object} The ScrollSync under test and the three clone holders it writes to.
   */
  const createScrollSync = (
    owners: { horizontal: HTMLElement | Window, vertical: HTMLElement | Window }
  ) => {
    const rootWindow = window;
    const createOverlay = (mainTableScrollableElement: HTMLElement | Window) => ({
      updateMainScrollableElement: () => {},
      needFullRender: true,
      trimmingContainer: rootWindow as HTMLElement | Window,
      mainTableScrollableElement,
      clone: { wtTable: { holder: document.createElement('div') } },
    });
    const topOverlay = createOverlay(owners.vertical);
    const bottomOverlay = createOverlay(owners.vertical);
    const inlineStartOverlay = createOverlay(owners.horizontal);
    const deps = {
      rootWindow,
      wtTable: {
        wtRootElement: document.createElement('div'),
        TABLE: document.createElement('table'),
        holder: document.createElement('div'),
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
    const scrollSync = new ScrollSync(deps);

    scrollSync.setRenderingStateChanged(true);

    return {
      scrollSync,
      topHolder: topOverlay.clone.wtTable.holder,
      bottomHolder: bottomOverlay.clone.wtTable.holder,
      inlineStartHolder: inlineStartOverlay.clone.wtTable.holder,
    };
  };

  /**
   * A stand-in for the master holder, scrolled on both axes.
   *
   * @returns {HTMLElement} The scrolled holder.
   */
  const scrolledHolder = () => {
    const holder = document.createElement('div');

    Object.defineProperty(holder, 'scrollLeft', { value: 400, writable: true });
    Object.defineProperty(holder, 'scrollTop', { value: 250, writable: true });

    return holder;
  };

  it('should carry the horizontal scroll to the row clones when the window owns the vertical axis', () => {
    // The headline split: a definite `width` with no sized `height`. Reading both axes off the top
    // overlay gave up here, so a clone that started rendering while the holder was scrolled sideways
    // kept `scrollLeft: 0` and showed the wrong columns under the frozen row.
    const holder = scrolledHolder();
    const { scrollSync, topHolder, bottomHolder, inlineStartHolder } = createScrollSync({
      horizontal: holder,
      vertical: window,
    });

    scrollSync.syncScrollWithMaster();

    expect(topHolder.scrollLeft).toBe(400);
    expect(bottomHolder.scrollLeft).toBe(400);
    // The window scrolls the rows, so the frozen-column clone is placed by its spreader instead. An
    // offset written here would double-shift it.
    expect(inlineStartHolder.scrollTop).toBe(0);
  });

  it('should carry the vertical scroll to the column clone when the window owns the horizontal axis', () => {
    // The reverse split, and the mirror of the case above.
    const holder = scrolledHolder();
    const { scrollSync, topHolder, inlineStartHolder } = createScrollSync({
      horizontal: window,
      vertical: holder,
    });

    scrollSync.syncScrollWithMaster();

    expect(inlineStartHolder.scrollTop).toBe(250);
    expect(topHolder.scrollLeft).toBe(0);
  });

  it('should carry both axes when one element scrolls the whole grid', () => {
    const holder = scrolledHolder();
    const { scrollSync, topHolder, bottomHolder, inlineStartHolder } = createScrollSync({
      horizontal: holder,
      vertical: holder,
    });

    scrollSync.syncScrollWithMaster();

    expect(topHolder.scrollLeft).toBe(400);
    expect(bottomHolder.scrollLeft).toBe(400);
    expect(inlineStartHolder.scrollTop).toBe(250);
  });

  it('should write nothing when the window owns both axes', () => {
    const { scrollSync, topHolder, inlineStartHolder } = createScrollSync({
      horizontal: window,
      vertical: window,
    });

    scrollSync.syncScrollWithMaster();

    expect(topHolder.scrollLeft).toBe(0);
    expect(inlineStartHolder.scrollTop).toBe(0);
  });
});
