import {
  resolveScrollbarFrameClip,
  resolveScrollbarProxyLayout,
  ScrollbarProxies,
  type ScrollbarProxiesDeps,
  type ScrollbarProxyCandidates,
  type ScrollbarProxyInput,
} from '../../../src/overlay/scrollbarProxies';

/**
 * A holder with 15px classic gutters on both axes: a 615x355 border box around a 600x340 client box.
 *
 * @param {Partial<ScrollbarProxyInput['holder']>} overrides The measurements to change.
 * @returns {ScrollbarProxyInput['holder']}
 */
function holderBox(overrides: Partial<ScrollbarProxyInput['holder']> = {}): ScrollbarProxyInput['holder'] {
  return {
    x: 0,
    y: 0,
    boxWidth: 615,
    boxHeight: 355,
    viewWidth: 600,
    viewHeight: 340,
    contentWidth: 2000,
    contentHeight: 10000,
    ...overrides,
  };
}

/**
 * The layout input for a grid that scrolls both axes in its holder.
 *
 * @param {Partial<ScrollbarProxyInput>} overrides The input to change.
 * @returns {ScrollbarProxyInput}
 */
function layoutInput(overrides: Partial<ScrollbarProxyInput> = {}): ScrollbarProxyInput {
  return {
    holder: holderBox(),
    rtl: false,
    insets: { top: 0, bottom: 0, start: 0, end: 0 },
    ownsVertical: true,
    ownsHorizontal: true,
    ...overrides,
  };
}

describe('scrollbar proxies', () => {
  describe('resolveScrollbarProxyLayout', () => {
    it('should leave both scrollbars to the holder when no header or frozen band takes part of an edge', () => {
      expect(resolveScrollbarProxyLayout(layoutInput())).toEqual({ vertical: null, horizontal: null });
    });

    it('should leave both scrollbars to the holder when it reserves no gutter (overlay scrollbars)', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        holder: holderBox({ boxWidth: 600, boxHeight: 340 }),
        insets: { top: 30, bottom: 20, start: 50, end: 40 },
      }));

      expect(layout).toEqual({ vertical: null, horizontal: null });
    });

    it('should leave an axis the holder does not own to the window', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 30, bottom: 0, start: 50, end: 0 },
        ownsVertical: false,
      }));

      expect(layout.vertical).toBeNull();
      expect(layout.horizontal).not.toBeNull();
    });

    it('should not read one axis\'s gutter off the other', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        holder: holderBox({ boxWidth: 600 }),
        insets: { top: 30, bottom: 0, start: 50, end: 0 },
      }));

      expect(layout.vertical).toBeNull();
      expect(layout.horizontal?.proxy).toEqual({ left: 50, top: 340, width: 550, height: 15 });
    });

    it('should start the vertical scrollbar below the column headers and fill the strip above', () => {
      const { vertical } = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 30, bottom: 0, start: 0, end: 0 },
      }));

      expect(vertical).toEqual({
        proxy: { left: 600, top: 30, width: 15, height: 310 },
        spacer: 310 + (10000 - 340),
        fillers: [{ left: 600, top: 0, width: 15, height: 30 }],
      });
    });

    it('should start the horizontal scrollbar after the row headers and fill the strip before it', () => {
      const { horizontal } = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 0, bottom: 0, start: 50, end: 0 },
      }));

      expect(horizontal).toEqual({
        proxy: { left: 50, top: 340, width: 550, height: 15 },
        spacer: 550 + (2000 - 600),
        fillers: [{ left: 0, top: 340, width: 50, height: 15 }],
      });
    });

    it('should place each scrollbar between the frozen bands on both of its ends', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 60, bottom: 40, start: 100, end: 80 },
      }));

      expect(layout.vertical).toEqual({
        proxy: { left: 600, top: 60, width: 15, height: 240 },
        spacer: 240 + (10000 - 340),
        fillers: [
          { left: 600, top: 0, width: 15, height: 60 },
          { left: 600, top: 300, width: 15, height: 40 },
        ],
      });
      expect(layout.horizontal).toEqual({
        proxy: { left: 100, top: 340, width: 420, height: 15 },
        spacer: 420 + (2000 - 600),
        fillers: [
          { left: 0, top: 340, width: 100, height: 15 },
          { left: 520, top: 340, width: 80, height: 15 },
        ],
      });
    });

    it('should cover the whole gutter edge with the proxy and its fillers, and leave the corner alone', () => {
      const { vertical, horizontal } = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 60, bottom: 40, start: 100, end: 80 },
      }));
      const boxes = [vertical, horizontal].map(axis => [axis!.proxy, ...axis!.fillers]);

      // The vertical gutter, top to bottom, ends where the client box ends: the corner below it is the
      // holder's, and so is the one at the horizontal gutter's end.
      expect(boxes[0].reduce((sum, box) => sum + box.height, 0)).toBe(340);
      expect(boxes[1].reduce((sum, box) => sum + box.width, 0)).toBe(600);
      expect(Math.max(...boxes[0].map(box => box.top + box.height))).toBe(340);
      expect(Math.max(...boxes[1].map(box => box.left + box.width))).toBe(600);
    });

    it('should place the boxes in the holder\'s offset parent', () => {
      const { vertical, horizontal } = resolveScrollbarProxyLayout(layoutInput({
        holder: holderBox({ x: 10, y: 5 }),
        insets: { top: 30, bottom: 0, start: 50, end: 0 },
      }));

      expect(vertical?.proxy).toEqual({ left: 610, top: 35, width: 15, height: 310 });
      expect(vertical?.fillers).toEqual([{ left: 610, top: 5, width: 15, height: 30 }]);
      expect(horizontal?.proxy).toEqual({ left: 60, top: 345, width: 550, height: 15 });
      expect(horizontal?.fillers).toEqual([{ left: 10, top: 345, width: 50, height: 15 }]);
    });

    it('should put the vertical scrollbar on the left and swap the inline insets in RTL', () => {
      const { vertical, horizontal } = resolveScrollbarProxyLayout(layoutInput({
        holder: holderBox({ x: 10, y: 5 }),
        rtl: true,
        insets: { top: 30, bottom: 0, start: 50, end: 80 },
      }));

      expect(vertical?.proxy).toEqual({ left: 10, top: 35, width: 15, height: 310 });
      expect(vertical?.fillers).toEqual([{ left: 10, top: 5, width: 15, height: 30 }]);
      // The client box starts after the vertical gutter, and the frozen end columns are on its left.
      expect(horizontal?.proxy).toEqual({ left: 105, top: 345, width: 470, height: 15 });
      expect(horizontal?.fillers).toEqual([
        { left: 25, top: 345, width: 80, height: 15 },
        { left: 575, top: 345, width: 50, height: 15 },
      ]);
    });

    it('should leave an axis to the holder when the bands cover all of it', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 200, bottom: 140, start: 400, end: 200 },
      }));

      expect(layout).toEqual({ vertical: null, horizontal: null });
    });

    it('should leave an axis to the holder when one band is longer than the client box', () => {
      const layout = resolveScrollbarProxyLayout(layoutInput({
        insets: { top: 400, bottom: 0, start: 700, end: 0 },
      }));

      expect(layout).toEqual({ vertical: null, horizontal: null });
    });

    it('should give the proxy no scroll range when the content fits in the client box', () => {
      const { vertical, horizontal } = resolveScrollbarProxyLayout(layoutInput({
        holder: holderBox({ contentWidth: 600, contentHeight: 300 }),
        insets: { top: 30, bottom: 0, start: 50, end: 0 },
      }));

      expect(vertical?.spacer).toBe(310);
      expect(horizontal?.spacer).toBe(550);
    });
  });

  describe('resolveScrollbarFrameClip', () => {
    it('should return nothing when the holder reserves no gutter', () => {
      expect(resolveScrollbarFrameClip(holderBox({ boxWidth: 600, boxHeight: 340 }), false)).toBeNull();
      expect(resolveScrollbarFrameClip(holderBox({ boxWidth: 600, boxHeight: 340 }), true)).toBeNull();
    });

    it('should clip to the right and bottom gutters in LTR', () => {
      expect(resolveScrollbarFrameClip(holderBox(), false)).toBe(
        'polygon(600px 0px, 615px 0px, 615px 355px, 0px 355px, 0px 340px, 600px 340px)'
      );
    });

    it('should clip to the left and bottom gutters in RTL', () => {
      expect(resolveScrollbarFrameClip(holderBox(), true)).toBe(
        'polygon(0px 0px, 15px 0px, 15px 340px, 615px 340px, 615px 355px, 0px 355px)'
      );
    });

    it('should clip to the vertical gutter alone when there is no horizontal one', () => {
      expect(resolveScrollbarFrameClip(holderBox({ boxHeight: 340 }), false)).toBe(
        'polygon(600px 0px, 615px 0px, 615px 340px, 0px 340px, 0px 340px, 600px 340px)'
      );
    });

    it('should clip to the horizontal gutter alone when there is no vertical one', () => {
      expect(resolveScrollbarFrameClip(holderBox({ boxWidth: 600 }), false)).toBe(
        'polygon(600px 0px, 600px 0px, 600px 355px, 0px 355px, 0px 340px, 600px 340px)'
      );
    });

    it('should not depend on where the holder sits in its offset parent', () => {
      expect(resolveScrollbarFrameClip(holderBox({ x: 10, y: 5 }), false))
        .toBe(resolveScrollbarFrameClip(holderBox(), false));
    });
  });
});

describe('ScrollbarProxies', () => {
  type Offset = 'scrollTop' | 'scrollLeft';

  /**
   * jsdom does not scroll: its `scrollTop` and `scrollLeft` read 0 and ignore writes. Each element the
   * module creates or scrolls therefore keeps its own offsets, clamped to a range a test can shorten
   * (a proxy whose spacer lags the holder's content), and counts the writes a script makes.
   */
  interface Scrollable {
    offsets: Record<Offset, number>;
    limits: Record<Offset, number>;
    writes: number;
  }

  const scrollables = new Map<Element, Scrollable>();
  const listeners: Array<[EventTarget, string, EventListener]> = [];
  let parent: HTMLElement;

  /**
   * Gives an element offsets of its own.
   *
   * @param {HTMLElement} element The element.
   * @returns {Scrollable}
   */
  function makeScrollable(element: HTMLElement): Scrollable {
    const state: Scrollable = {
      offsets: { scrollTop: 0, scrollLeft: 0 },
      limits: { scrollTop: Infinity, scrollLeft: Infinity },
      writes: 0,
    };

    (['scrollTop', 'scrollLeft'] as Offset[]).forEach((property) => {
      Object.defineProperty(element, property, {
        configurable: true,
        get: () => state.offsets[property],
        set: (value: number) => {
          state.writes += 1;
          state.offsets[property] = Math.max(0, Math.min(value, state.limits[property]));
        },
      });
    });
    scrollables.set(element, state);

    return state;
  }

  /**
   * Builds the module over a holder with 15px classic gutters and column and row headers, and runs the
   * first update, which creates the elements.
   *
   * @param {Partial<ScrollbarProxyCandidates>} candidates The axes the holder owns.
   * @returns {object} The module, the holder, the elements it created, and the geometry read count.
   */
  function createProxies(candidates: Partial<ScrollbarProxyCandidates> = {}) {
    const holder = document.createElement('div');
    const geometryReads = { count: 0 };
    const measure = (value: number) => () => {
      geometryReads.count += 1;

      return value;
    };

    parent.appendChild(holder);

    const deps = {
      rootDocument: document,
      geometryReader: {
        offsetLeft: measure(0),
        offsetTop: measure(0),
        offsetWidth: measure(615),
        offsetHeight: measure(355),
        clientWidth: measure(600),
        clientHeight: measure(340),
        scrollWidth: measure(2000),
        scrollHeight: measure(10000),
        getComputedStyle: () => {
          geometryReads.count += 1;

          return { scrollbarWidth: 'auto', scrollbarColor: 'auto', borderRadius: '0px' };
        },
      },
      wtSettings: { getSetting: () => false },
      eventManager: {
        addEventListener: (target: EventTarget, type: string, listener: EventListener) => {
          target.addEventListener(type, listener);
          listeners.push([target, type, listener]);
        },
        destroy: () => {
          listeners.splice(0).forEach(([target, type, listener]) => target.removeEventListener(type, listener));
        },
      },
      getWtTable: () => ({ holder }),
      getCandidates: () => ({ vertical: true, horizontal: true, framed: true, ...candidates }),
      getInsets: () => ({ top: 30, bottom: 0, start: 50, end: 0 }),
    } as unknown as ScrollbarProxiesDeps;
    const proxies = new ScrollbarProxies(deps);

    proxies.update();

    const vertical = parent.querySelector<HTMLElement>('.htScrollbarProxy-vertical');

    return {
      proxies,
      holder,
      vertical,
      verticalState: vertical ? scrollables.get(vertical)! : null,
      geometryReads,
    };
  }

  /**
   * Fires a `scroll` event, as the browser does a frame after an offset changed.
   *
   * @param {EventTarget} target The element that scrolled.
   */
  function scrolled(target: EventTarget) {
    target.dispatchEvent(new Event('scroll'));
  }

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);

    const createElement = document.createElement.bind(document);

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = createElement(tagName);

      makeScrollable(element);

      return element;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    listeners.splice(0).forEach(([target, type, listener]) => target.removeEventListener(type, listener));
    scrollables.clear();
    parent.remove();
  });

  it('should create the proxies, their fillers and the frame after the holder', () => {
    const { holder, vertical } = createProxies();
    const classes = Array.from(parent.children).map(element => element.className);

    expect(parent.firstElementChild).toBe(holder);
    expect(classes.filter(name => name.startsWith('htScrollbarProxy ')).sort()).toEqual([
      'htScrollbarProxy htScrollbarProxy-horizontal',
      'htScrollbarProxy htScrollbarProxy-vertical',
    ]);
    expect(classes.filter(name => name === 'htScrollbarProxyFiller')).toHaveLength(4);
    expect(classes[classes.length - 1]).toBe('htScrollbarFrame');
    expect(vertical?.style.top).toBe('30px');
    expect(vertical?.style.height).toBe('310px');
    expect((vertical?.firstElementChild as HTMLElement).style.height).toBe(`${310 + 10000 - 340}px`);
  });

  it('should copy a scroll of the holder into the proxy', () => {
    const { holder, vertical } = createProxies();

    holder.scrollTop = 500;
    scrolled(holder);

    expect(vertical?.scrollTop).toBe(500);
  });

  it('should copy a user scroll of the proxy into the holder', () => {
    const { holder, vertical } = createProxies();

    vertical!.scrollTop = 300;
    scrolled(vertical!);

    expect(holder.scrollTop).toBe(300);
  });

  it('should not copy the holder\'s echo of a proxy scroll back into a proxy that has moved on', () => {
    const { holder, vertical, verticalState } = createProxies();

    vertical!.scrollTop = 100;
    scrolled(vertical!);
    // The user keeps scrolling the proxy before the holder's scroll event for the first copy arrives.
    vertical!.scrollTop = 200;

    const writes = verticalState!.writes;

    scrolled(holder);

    expect(vertical?.scrollTop).toBe(200);
    expect(verticalState?.writes).toBe(writes);

    scrolled(vertical!);

    expect(holder.scrollTop).toBe(200);
  });

  it('should not read a copy the proxy clamped as a user scroll that pulls the grid back', () => {
    const { holder, vertical, verticalState } = createProxies();

    // Rows were added: the holder can scroll further than the proxy until the next layout.
    verticalState!.limits.scrollTop = 1000;
    holder.scrollTop = 5000;
    scrolled(holder);

    expect(vertical?.scrollTop).toBe(1000);

    scrolled(vertical!);

    expect(holder.scrollTop).toBe(5000);
  });

  it('should write nothing into a held proxy, and bring it in line with the holder on release', () => {
    const { holder, vertical, verticalState } = createProxies();

    vertical!.dispatchEvent(new Event('pointerdown'));

    const writes = verticalState!.writes;

    holder.scrollTop = 800;
    scrolled(holder);

    expect(vertical?.scrollTop).toBe(0);
    expect(verticalState?.writes).toBe(writes);

    document.dispatchEvent(new Event('pointerup'));

    expect(vertical?.scrollTop).toBe(800);
  });

  it('should hide an axis that no longer needs a proxy, and stop copying into it', () => {
    const candidates = { vertical: true };
    const { proxies, holder, vertical, verticalState } = createProxies(candidates);

    candidates.vertical = false;
    proxies.update();

    const writes = verticalState!.writes;

    holder.scrollTop = 400;
    scrolled(holder);

    expect(vertical?.style.display).toBe('none');
    expect(verticalState?.writes).toBe(writes);
  });

  it('should tell its proxies from other elements', () => {
    const { proxies, holder, vertical } = createProxies();

    expect(proxies.isProxy(vertical)).toBe(true);
    expect(proxies.isProxy(parent.querySelector('.htScrollbarProxy-horizontal'))).toBe(true);
    expect(proxies.isProxy(parent.querySelector('.htScrollbarProxyFiller'))).toBe(false);
    expect(proxies.isProxy(holder)).toBe(false);
    expect(proxies.isProxy(null)).toBe(false);
  });

  it('should read no geometry for a grid whose holder scrolls neither axis', () => {
    const { geometryReads } = createProxies({ vertical: false, horizontal: false, framed: false });

    expect(geometryReads.count).toBe(0);
    expect(parent.children).toHaveLength(1);
  });

  it('should remove every element it added, and its listeners, when destroyed', () => {
    const { proxies, holder, vertical, verticalState } = createProxies();

    proxies.destroy();

    const writes = verticalState!.writes;

    holder.scrollTop = 600;
    scrolled(holder);

    expect(Array.from(parent.children)).toEqual([holder]);
    expect(verticalState?.writes).toBe(writes);
    expect(vertical?.isConnected).toBe(false);
  });
});
