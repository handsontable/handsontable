import Handsontable from '../../../../../base';

describe('Overlay clone event teardown', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.useRealTimers();

    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
  });

  /**
   * Builds a grid that owns every overlay type (so each one creates a clone).
   *
   * @returns {object} The Handsontable instance.
   */
  function build() {
    hot = new Handsontable(container, {
      data: [['a1', 'b1'], ['a2', 'b2']],
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 1,
      fixedRowsBottom: 1,
      fixedColumnsStart: 1,
      licenseKey: 'non-commercial-and-evaluation',
    });

    return hot;
  }

  /**
   * Collects the master `Event` instance plus the one owned by every overlay clone.
   *
   * @returns {Array} The `Event` instances.
   */
  function collectEvents() {
    const wt = hot.view._wt;

    return [wt.wtEvent, ...wt.wtOverlays.getOverlays().map(overlay => overlay?.clone?.wtEvent)]
      .filter(Boolean);
  }

  it('should create a separate `Event` instance for every overlay clone', () => {
    build();

    const wt = hot.view._wt;
    const clonesWithEvent = wt.wtOverlays.getOverlays()
      .filter(overlay => overlay?.clone?.wtEvent);

    expect(clonesWithEvent.length).toBeGreaterThan(0);
    expect(collectEvents().length).toBe(clonesWithEvent.length + 1);
  });

  it('should not run the momentum-scroll timer of an overlay clone after the instance is destroyed', () => {
    build();

    const events = collectEvents();

    jest.useFakeTimers();

    // What a momentum (flick) scroll does on a touch device: the holder `scroll` listener fires on
    // the master table and on every overlay clone, and each one arms its own 200 ms timer.
    events.forEach(event => event.onHolderScroll());

    hot.destroy();

    // Before the fix every clone timer survived `destroy()`, and firing it reached
    // `runHooks('afterMomentumScroll')` on a destroyed instance, which throws.
    expect(() => jest.advanceTimersByTime(250)).not.toThrow();
  });

  it('should tolerate the overlays being torn down twice', () => {
    build();

    const wt = hot.view._wt;

    // `Overlays#refreshAll()` tears the overlays down on its own when the table is detached from
    // the DOM, so `Core#destroy()` can be the second teardown of the same overlays.
    expect(() => {
      wt.wtOverlays.destroy();
      hot.destroy();
    }).not.toThrow();
  });

  it('should destroy the `Event` instance of every overlay clone on teardown', () => {
    build();

    const wt = hot.view._wt;
    const cloneEvents = wt.wtOverlays.getOverlays()
      .map(overlay => overlay?.clone?.wtEvent)
      .filter(Boolean);

    // `Event#destroy()` is what clears the momentum-scroll, double-click and long-press timers,
    // so a clone whose `Event` is never destroyed leaks all three past `Core#destroy()`.
    const destroySpies = cloneEvents.map(event => jest.spyOn(event, 'destroy'));

    hot.destroy();

    destroySpies.forEach((spy) => {
      expect(spy).toHaveBeenCalled();
    });
  });
});
