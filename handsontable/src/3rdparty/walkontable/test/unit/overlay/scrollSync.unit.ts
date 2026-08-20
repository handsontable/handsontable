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

  it('should drop the sizes once per settled layout', () => {
    const { scrollSync, counters, render } = createScrollSync({ trimmedByElement: false });

    render();
    scrollSync.resolveProvisionalLayout();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();
    scrollSync.resetSizesMeasuredBeforeLayoutSettled();

    expect(counters.resetAllOversizedRows).toBe(1);
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
