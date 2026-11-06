import EventManager from '../../../../../eventManager';
import {
  NativeScrollInput,
  type NativeScrollInputDeps,
} from '../../../src/overlay/scroll/nativeScrollInput';

describe('NativeScrollInput#registerScrollableElementListeners', () => {
  /**
   * Builds a NativeScrollInput over a real EventManager, with the master holder scrolling both axes
   * and two clones (one of them scroll-mirrored). The scrollable element can be swapped to model a
   * change of the scroll owner.
   *
   * @returns {object} The input under test, its event manager, the elements it binds to, and the
   * counters of the dependency calls a rebind makes.
   */
  const createInput = () => {
    const rootWindow = window;
    const rootDocument = document;
    const wtRootElement = document.createElement('div');
    const mirroredCloneHolder = document.createElement('div');
    const cornerCloneHolder = document.createElement('div');
    const state = { scrollableElement: document.createElement('div') as HTMLElement | Window };
    const counters = { resetStickyScroll: 0, registerStickyScrollListeners: 0, observeResize: 0 };
    const eventManager = new EventManager();
    const masterOverlay = {
      get mainTableScrollableElement() {
        return state.scrollableElement;
      },
    };
    const mirroredOverlay = { clone: { wtTable: { holder: mirroredCloneHolder } } };
    const cornerOverlay = { clone: { wtTable: { holder: cornerCloneHolder } } };
    const deps = {
      wtSettings: { getSetting: () => false },
      rootDocument,
      rootWindow,
      geometryReader: {
        getComputedStyle: (element: Element) => rootWindow.getComputedStyle(element),
      },
      wtTable: { wtRootElement },
      eventManager,
      getTopOverlay: () => masterOverlay,
      getInlineStartOverlay: () => masterOverlay,
      getCloneableOverlays: () => [mirroredOverlay, cornerOverlay],
      getScrollMirroredOverlays: () => [mirroredOverlay],
      getScrollableElement: () => state.scrollableElement,
      registerStickyScrollListeners: () => {
        counters.registerStickyScrollListeners += 1;
      },
      resetStickyScroll: () => {
        counters.resetStickyScroll += 1;
      },
      observeResize: () => {
        counters.observeResize += 1;
      },
    } as unknown as NativeScrollInputDeps;

    return {
      input: new NativeScrollInput(deps),
      eventManager,
      state,
      counters,
      elements: { wtRootElement, mirroredCloneHolder, cornerCloneHolder },
    };
  };

  /**
   * Lists the listeners the event manager holds on one target, as `event` names.
   *
   * @param {EventManager} eventManager The event manager.
   * @param {EventTarget} target The listened element.
   * @returns {string[]}
   */
  const listenersOn = (eventManager: EventManager, target: EventTarget) =>
    (eventManager.context?.eventListeners ?? [])
      .filter(entry => entry.element === target)
      .map(entry => entry.event)
      .sort();

  let spies: jest.SpyInstance[] = [];

  afterEach(() => {
    spies.forEach(spy => spy.mockRestore());
    spies = [];
  });

  it('should add no listener to the window or the document on a rebind', () => {
    const { input, eventManager } = createInput();

    input.registerListeners();

    spies = [
      jest.spyOn(window, 'addEventListener'),
      jest.spyOn(document, 'addEventListener'),
      jest.spyOn(document.documentElement, 'addEventListener'),
    ];

    input.registerScrollableElementListeners();

    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
    expect(listenersOn(eventManager, document.documentElement)).toEqual(['keydown', 'keyup']);
    expect(listenersOn(eventManager, document)).toEqual(['visibilitychange']);
    expect(listenersOn(eventManager, window)).toEqual(['resize']);

    eventManager.destroy();
  });

  it('should register the page listeners and the sticky-scroll listeners once', () => {
    const { input, eventManager, counters } = createInput();

    input.registerListeners();
    input.registerScrollableElementListeners();
    input.registerScrollableElementListeners();

    expect(counters.registerStickyScrollListeners).toBe(1);
    expect(listenersOn(eventManager, window)).toEqual(['resize']);

    eventManager.destroy();
  });

  it('should replace the scroll and wheel listeners instead of adding duplicates', () => {
    const { input, eventManager, state, elements } = createInput();

    input.registerListeners();

    const countAfterInit = eventManager.context?.eventListeners.length;

    input.registerScrollableElementListeners();
    input.registerScrollableElementListeners();

    expect(eventManager.context?.eventListeners.length).toBe(countAfterInit);
    expect(listenersOn(eventManager, state.scrollableElement)).toEqual(['scroll']);
    expect(listenersOn(eventManager, elements.wtRootElement)).toEqual(['wheel']);
    expect(listenersOn(eventManager, elements.mirroredCloneHolder)).toEqual(['scroll', 'wheel']);
    expect(listenersOn(eventManager, elements.cornerCloneHolder)).toEqual(['wheel']);

    eventManager.destroy();
  });

  it('should move the scroll listener to a new scrollable element', () => {
    const { input, eventManager, state } = createInput();

    input.registerListeners();

    const previousElement = state.scrollableElement;
    const nextElement = document.createElement('div');
    const previousRemove = jest.spyOn(previousElement, 'removeEventListener');
    const nextAdd = jest.spyOn(nextElement, 'addEventListener');

    spies = [previousRemove, nextAdd];
    state.scrollableElement = nextElement;
    input.registerScrollableElementListeners();

    expect(listenersOn(eventManager, previousElement)).toEqual([]);
    expect(listenersOn(eventManager, nextElement)).toEqual(['scroll']);
    expect(previousRemove).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(nextAdd).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    eventManager.destroy();
  });

  it('should reset the sticky scroll and observe the resize on every rebind', () => {
    const { input, eventManager, counters } = createInput();

    input.registerListeners();

    expect(counters.resetStickyScroll).toBe(1);
    expect(counters.observeResize).toBe(1);

    input.registerScrollableElementListeners();

    expect(counters.resetStickyScroll).toBe(2);
    expect(counters.observeResize).toBe(2);

    eventManager.destroy();
  });
});
