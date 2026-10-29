import type { EngineContext } from '../wire';
import { SCROLLBAR_FRAME_CLASS, SCROLLBAR_PROXY_CLASS, SCROLLBAR_PROXY_FILLER_CLASS } from './constants';

/**
 * A box in the master overlay's coordinates (the holder's offset parent), in pixels.
 */
export interface ProxyBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * What one axis needs: the proxy that shows the scrollbar, the length of its spacer, and the boxes that
 * cover the rest of the gutter.
 */
export interface AxisProxyLayout {
  proxy: ProxyBox;
  spacer: number;
  fillers: ProxyBox[];
}

/**
 * The layout of both axes. `null` leaves that axis to the holder's own scrollbar.
 */
export interface ScrollbarProxyLayout {
  vertical: AxisProxyLayout | null;
  horizontal: AxisProxyLayout | null;
}

/**
 * The measurements `resolveScrollbarProxyLayout` works from.
 */
export interface ScrollbarProxyInput {
  /**
   * The master holder, measured: its offset in its offset parent (`x`, `y`), its border box (`boxWidth`,
   * `boxHeight`), its client box (`viewWidth`, `viewHeight`), and its scroll size (`contentWidth`,
   * `contentHeight`).
   */
  holder: {
    x: number;
    y: number;
    boxWidth: number;
    boxHeight: number;
    viewWidth: number;
    viewHeight: number;
    contentWidth: number;
    contentHeight: number;
  };
  rtl: boolean;
  /**
   * The non-scrolling bands along each edge of the holder's client box: the column headers plus the
   * frozen top rows, the frozen bottom rows, the row headers plus the frozen start columns, and the
   * frozen end columns.
   */
  insets: { top: number; bottom: number; start: number; end: number };
  ownsVertical: boolean;
  ownsHorizontal: boolean;
}

/**
 * Places the scrollbar of each axis along the part of the holder's edge that scrolls.
 *
 * An axis gets a proxy only when the holder owns it, reserves a classic gutter for it (an overlay
 * scrollbar takes no space and keeps the clearance band of `scrollbarClearance.ts`), and a header or a
 * frozen band takes part of the edge. The proxy fills that part of the gutter, the fillers fill the rest,
 * so the holder's own scrollbar is covered along the whole edge. The gutter corner stays the holder's.
 *
 * @param {ScrollbarProxyInput} input The measurements.
 * @returns {ScrollbarProxyLayout}
 */
export function resolveScrollbarProxyLayout(input: ScrollbarProxyInput): ScrollbarProxyLayout {
  const { holder, rtl, insets } = input;
  const verticalGutter = holder.boxWidth - holder.viewWidth;
  const horizontalGutter = holder.boxHeight - holder.viewHeight;
  // An RTL holder draws its vertical scrollbar on the left, so its client box starts after it.
  const viewLeft = holder.x + (rtl ? verticalGutter : 0);
  const viewTop = holder.y;
  let vertical: AxisProxyLayout | null = null;
  let horizontal: AxisProxyLayout | null = null;

  if (input.ownsVertical && verticalGutter > 0 && (insets.top > 0 || insets.bottom > 0)) {
    const start = Math.min(insets.top, holder.viewHeight);
    const end = Math.max(start, holder.viewHeight - insets.bottom);
    const left = rtl ? holder.x : viewLeft + holder.viewWidth;

    if (end > start) {
      vertical = {
        proxy: { left, top: viewTop + start, width: verticalGutter, height: end - start },
        spacer: (end - start) + Math.max(0, holder.contentHeight - holder.viewHeight),
        fillers: [
          { left, top: viewTop, width: verticalGutter, height: start },
          { left, top: viewTop + end, width: verticalGutter, height: holder.viewHeight - end },
        ].filter(box => box.height > 0),
      };
    }
  }

  if (input.ownsHorizontal && horizontalGutter > 0 && (insets.start > 0 || insets.end > 0)) {
    const leftInset = rtl ? insets.end : insets.start;
    const rightInset = rtl ? insets.start : insets.end;
    const start = Math.min(leftInset, holder.viewWidth);
    const end = Math.max(start, holder.viewWidth - rightInset);
    const top = viewTop + holder.viewHeight;

    if (end > start) {
      horizontal = {
        proxy: { left: viewLeft + start, top, width: end - start, height: horizontalGutter },
        spacer: (end - start) + Math.max(0, holder.contentWidth - holder.viewWidth),
        fillers: [
          { left: viewLeft, top, width: start, height: horizontalGutter },
          { left: viewLeft + end, top, width: holder.viewWidth - end, height: horizontalGutter },
        ].filter(box => box.width > 0),
      };
    }
  }

  return { vertical, horizontal };
}

/**
 * Which axes could take a proxy, answered without reading the DOM: the holder scrolls the axis and a
 * header or a frozen band is rendered along it.
 */
export interface ScrollbarProxyCandidates {
  vertical: boolean;
  horizontal: boolean;
  /**
   * The holder scrolls at least one axis itself, so a classic gutter it reserves gets the frame drawn
   * over it - with or without a header or a frozen band.
   */
  framed: boolean;
}

/**
 * The area the grid's frame is redrawn over: the gutters of the holder's classic scrollbars, as a
 * `clip-path` polygon in the holder's own box. The browser paints a scroll container's scrollbars above
 * its own `box-shadow`, so the frame the theme draws as an inset shadow on the holder is hidden along
 * the right and bottom edges (the left in RTL) wherever a classic scrollbar runs. `null` when the holder
 * reserves no gutter.
 *
 * @param {ScrollbarProxyInput['holder']} holder The measured holder.
 * @param {boolean} rtl Whether the grid runs right to left.
 * @returns {string | null}
 */
export function resolveScrollbarFrameClip(holder: ScrollbarProxyInput['holder'], rtl: boolean): string | null {
  const { boxWidth: w, boxHeight: h, viewHeight: vb } = holder;
  const verticalGutter = w - holder.viewWidth;

  if (verticalGutter <= 0 && h - vb <= 0) {
    return null;
  }

  // The vertical gutter, the full height, joined with the horizontal gutter, the full width.
  const points = rtl
    ? [[0, 0], [verticalGutter, 0], [verticalGutter, vb], [w, vb], [w, h], [0, h]]
    : [[w - verticalGutter, 0], [w, 0], [w, h], [0, h], [0, vb], [w - verticalGutter, vb]];

  return `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(', ')})`;
}

/**
 * Assembles the ScrollbarProxies dependencies from the engine composition context. The candidates and
 * the insets come from the owning Overlays instance, which knows its overlays.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @param {Function} getCandidates Returns which axes could take a proxy, without a DOM read.
 * @param {Function} getInsets Returns the non-scrolling bands along each edge (reads the DOM).
 * @returns {object} The ScrollbarProxies dependency set.
 */
export function createScrollbarProxiesDeps(
  ctx: EngineContext,
  getCandidates: () => ScrollbarProxyCandidates,
  getInsets: () => ScrollbarProxyInput['insets'],
) {
  return {
    rootDocument: ctx.rootDocument,
    geometryReader: ctx.geometryReader,
    wtSettings: ctx.wtSettings,
    eventManager: ctx.makeEventManager(),
    getWtTable: ctx.getWtTable,
    getCandidates,
    getInsets,
  };
}

/**
 * The ScrollbarProxies dependencies, inferred from `createScrollbarProxiesDeps`.
 */
export type ScrollbarProxiesDeps = ReturnType<typeof createScrollbarProxiesDeps>;

type Axis = 'vertical' | 'horizontal';

interface AxisElements {
  proxy: HTMLElement;
  spacer: HTMLElement;
  fillers: HTMLElement[];
}

const OFFSET_PROPERTY: Record<Axis, 'scrollTop' | 'scrollLeft'> = {
  vertical: 'scrollTop',
  horizontal: 'scrollLeft',
};

/**
 * Shows the grid's classic scrollbars along the scrolling part of each edge only.
 *
 * The master holder keeps scrolling the grid and keeps its gutters, so no size the viewport is computed
 * from changes. An empty scroll container per axis sits in that gutter, next to the holder, with a spacer
 * that gives it the holder's scroll range; its native scrollbar is what the user sees and drags. The two
 * offsets are copied both ways. A proxy offset is compared with the last one copied INTO it, never with
 * the holder's: while the proxy's range lags the holder's (rows added before the next layout), a write
 * the browser clamped would otherwise read as a user scroll and pull the grid back.
 *
 * @class ScrollbarProxies
 */
export class ScrollbarProxies {
  /**
   * The ScrollbarProxies dependencies.
   *
   * @type {ScrollbarProxiesDeps}
   */
  readonly #deps: ScrollbarProxiesDeps;

  /**
   * The elements of each axis, created the first time the axis needs them.
   */
  #elements: Record<Axis, AxisElements | null> = { vertical: null, horizontal: null };

  /**
   * The offset last copied into each proxy, as the proxy reported it after the write.
   */
  #copied: Record<Axis, number> = { vertical: NaN, horizontal: NaN };

  /**
   * The offset last copied from each proxy into the holder, as the holder reported it after the write.
   * A holder scroll event that reads this offset is that copy's own echo.
   */
  #written: Record<Axis, number> = { vertical: NaN, horizontal: NaN };

  /**
   * Whether the pointer is down on each proxy. While it is, nothing but the user moves that proxy.
   */
  #dragging: Record<Axis, boolean> = { vertical: false, horizontal: false };

  /**
   * The grid's frame, redrawn above the gutters, created the first time a gutter needs it.
   */
  #frame: HTMLElement | null = null;

  /**
   * @param {ScrollbarProxiesDeps} deps The dependency set.
   */
  constructor(deps: ScrollbarProxiesDeps) {
    this.#deps = deps;

    const holder = deps.getWtTable().holder;
    const endDrag = () => this.#endDrag(holder);

    // Registered before the engine's own scroll listener (Overlays builds this module first), so the copy
    // runs while the layout is still clean, ahead of the draw that the engine's listener starts.
    deps.eventManager.addEventListener(holder, 'scroll', () => {
      this.#copyToProxy('vertical', holder);
      this.#copyToProxy('horizontal', holder);
    }, { passive: true });
    // A drag of a proxy's thumb can end anywhere on the page.
    ['pointerup', 'pointercancel', 'mouseup'].forEach((eventName) => {
      deps.eventManager.addEventListener(deps.rootDocument, eventName, endDrag, { passive: true });
    });
  }

  /**
   * Measures the grid and places (or hides) the proxies and the frame. Call it after a draw that may
   * have changed a size: a full draw, or a resize of the overlays.
   */
  update() {
    const { geometryReader, wtSettings } = this.#deps;
    const holder = this.#deps.getWtTable().holder;
    const candidates = this.#deps.getCandidates();

    // A grid the window scrolls on both axes costs no DOM read.
    if (!holder.parentNode || (!candidates.framed && !this.#hasElements())) {
      return;
    }

    const measured: ScrollbarProxyInput['holder'] = {
      x: geometryReader.offsetLeft(holder),
      y: geometryReader.offsetTop(holder),
      boxWidth: geometryReader.offsetWidth(holder),
      boxHeight: geometryReader.offsetHeight(holder),
      viewWidth: geometryReader.clientWidth(holder),
      viewHeight: geometryReader.clientHeight(holder),
      contentWidth: geometryReader.scrollWidth(holder),
      contentHeight: geometryReader.scrollHeight(holder),
    };
    const rtl = wtSettings.getSetting<boolean>('rtlMode');
    // No gutter, no proxy: the insets are read only when a classic scrollbar could move.
    const hasGutter = measured.boxWidth > measured.viewWidth || measured.boxHeight > measured.viewHeight;
    const layout = resolveScrollbarProxyLayout({
      holder: measured,
      rtl,
      insets: hasGutter && (candidates.vertical || candidates.horizontal)
        ? this.#deps.getInsets() : { top: 0, bottom: 0, start: 0, end: 0 },
      ownsVertical: candidates.vertical,
      ownsHorizontal: candidates.horizontal,
    });
    const holderStyle = geometryReader.getComputedStyle(holder);

    this.#apply('vertical', layout.vertical, holder, holderStyle);
    this.#apply('horizontal', layout.horizontal, holder, holderStyle);
    this.#applyFrame(candidates.framed ? resolveScrollbarFrameClip(measured, rtl) : null, measured, holderStyle);
  }

  /**
   * Whether the element is one of the proxies, so a press on it can count as a scrollbar press.
   *
   * @param {EventTarget | null} element The element to test.
   * @returns {boolean}
   */
  isProxy(element: EventTarget | null): boolean {
    return element !== null && (
      element === this.#elements.vertical?.proxy || element === this.#elements.horizontal?.proxy
    );
  }

  /**
   * Removes the elements and the listeners.
   */
  destroy() {
    this.#deps.eventManager.destroy();
    (['vertical', 'horizontal'] as Axis[]).forEach((axis) => {
      const elements = this.#elements[axis];

      if (elements) {
        elements.proxy.remove();
        elements.fillers.forEach(filler => filler.remove());
        this.#elements[axis] = null;
      }
    });
    this.#frame?.remove();
    this.#frame = null;
  }

  /**
   * Whether anything has been created yet.
   *
   * @returns {boolean}
   */
  #hasElements(): boolean {
    return this.#elements.vertical !== null || this.#elements.horizontal !== null || this.#frame !== null;
  }

  /**
   * Redraws the grid's frame over the gutters, or hides it. It takes the holder's box and corner radius;
   * its inset `box-shadow` comes from the stylesheet rules that frame the holder, because core turns
   * those on (the root's `htHasScroll*` classes) only after the draw this runs in. It is clipped to the
   * gutters, so the cells keep the holder's frame (painted under them) and a selection outline on the
   * grid's edge is never covered, and it takes no pointer events, so the scrollbars under it stay usable.
   *
   * @param {string | null} clip The gutter area, from `resolveScrollbarFrameClip`.
   * @param {ScrollbarProxyInput['holder']} measured The measured holder.
   * @param {CSSStyleDeclaration} holderStyle The holder's computed style.
   */
  #applyFrame(clip: string | null, measured: ScrollbarProxyInput['holder'], holderStyle: CSSStyleDeclaration) {
    if (clip === null) {
      if (this.#frame) {
        setDisplay(this.#frame, false);
      }

      return;
    }

    if (!this.#frame) {
      this.#frame = this.#deps.rootDocument.createElement('div');
      this.#frame.className = SCROLLBAR_FRAME_CLASS;
      this.#frame.setAttribute('aria-hidden', 'true');
      // Last in the master overlay, so it paints above the proxies and the fillers.
      this.#deps.getWtTable().holder.parentElement?.appendChild(this.#frame);
    }

    placeBox(this.#frame, { left: measured.x, top: measured.y, width: measured.boxWidth, height: measured.boxHeight });
    setStyle(this.#frame, 'borderRadius', holderStyle.borderRadius);
    setStyle(this.#frame, 'clipPath', clip);
    setDisplay(this.#frame, true);
  }

  /**
   * Writes one axis's layout to the DOM, or hides the axis.
   *
   * @param {Axis} axis The axis.
   * @param {AxisProxyLayout | null} layout The axis layout.
   * @param {HTMLElement} holder The master holder.
   * @param {CSSStyleDeclaration} holderStyle The holder's computed style.
   */
  #apply(axis: Axis, layout: AxisProxyLayout | null, holder: HTMLElement, holderStyle: CSSStyleDeclaration) {
    if (layout === null) {
      const elements = this.#elements[axis];

      if (elements) {
        setDisplay(elements.proxy, false);
        elements.fillers.forEach(filler => setDisplay(filler, false));
      }

      return;
    }

    const elements = this.#elements[axis] ?? this.#create(axis, holder);

    placeBox(elements.proxy, layout.proxy);
    setDisplay(elements.proxy, true);

    if (axis === 'vertical') {
      setStyle(elements.spacer, 'height', `${layout.spacer}px`);
    } else {
      setStyle(elements.spacer, 'width', `${layout.spacer}px`);
    }

    // The holder's computed scrollbar style, so a host rule on `.wtHolder` (a thinner bar, other colors)
    // shapes the proxy too and its bar keeps filling the gutter it sits in.
    setStyle(elements.proxy, 'scrollbarWidth', holderStyle.scrollbarWidth);
    setStyle(elements.proxy, 'scrollbarColor', holderStyle.scrollbarColor);

    elements.fillers.forEach((filler, index) => {
      const box = layout.fillers[index];

      if (box) {
        placeBox(filler, box);
      }

      setDisplay(filler, box !== undefined);
    });

    // The spacer may have changed the proxy's range, which clamps its offset.
    this.#copyToProxy(axis, holder, true);
  }

  /**
   * Creates one axis's proxy and its two fillers, next to the holder.
   *
   * @param {Axis} axis The axis.
   * @param {HTMLElement} holder The master holder.
   * @returns {AxisElements}
   */
  #create(axis: Axis, holder: HTMLElement): AxisElements {
    const { rootDocument, eventManager } = this.#deps;
    const proxy = rootDocument.createElement('div');
    const spacer = rootDocument.createElement('div');
    const fillers = [rootDocument.createElement('div'), rootDocument.createElement('div')];

    proxy.className = `${SCROLLBAR_PROXY_CLASS} ${SCROLLBAR_PROXY_CLASS}-${axis}`;
    // An empty scroll container is a tab stop in Chrome 127+, and it has nothing to announce.
    proxy.setAttribute('tabindex', '-1');
    proxy.setAttribute('aria-hidden', 'true');
    proxy.appendChild(spacer);

    fillers.forEach((filler) => {
      filler.className = SCROLLBAR_PROXY_FILLER_CLASS;
      filler.setAttribute('aria-hidden', 'true');
    });

    holder.after(proxy, ...fillers);

    eventManager.addEventListener(proxy, 'scroll', () => this.#copyToHolder(axis), { passive: true });
    eventManager.addEventListener(proxy, 'pointerdown', () => {
      this.#dragging[axis] = true;
    }, { passive: true });

    const elements = { proxy, spacer, fillers };

    this.#elements[axis] = elements;

    return elements;
  }

  /**
   * Copies the holder's offset into the proxy and records what the proxy took.
   *
   * Two cases write nothing, and both are what keeps a dragged thumb steady. While the pointer is down on
   * the proxy, the user owns its offset: the browser moves a dragged thumb ahead of the page's script, so
   * a write here - even of a value the proxy held a frame ago - pulls the thumb back under the pointer,
   * and the next pointer move pushes it forward again (measured in Firefox: a 528px jump mid-drag). And a
   * holder offset equal to the one copied in from the proxy is that copy's own echo, which can arrive
   * after the proxy has already moved on.
   *
   * @param {Axis} axis The axis.
   * @param {HTMLElement} holder The master holder.
   * @param {boolean} [resync=false] Copy even an echo, after a layout that may have clamped the proxy.
   */
  #copyToProxy(axis: Axis, holder: HTMLElement, resync = false) {
    const elements = this.#elements[axis];

    if (!elements || elements.proxy.style.display === 'none' || this.#dragging[axis]) {
      return;
    }

    const property = OFFSET_PROPERTY[axis];

    if (!resync && Math.abs(holder[property] - this.#written[axis]) < 1) {
      return;
    }

    if (Math.abs(elements.proxy[property] - holder[property]) >= 1) {
      elements.proxy[property] = holder[property];
    }

    this.#copied[axis] = elements.proxy[property];
  }

  /**
   * Ends a drag of either proxy's thumb, and brings the proxy in line with the holder once, in case the
   * grid moved it during the drag (a resize, a scroll the engine made).
   *
   * @param {HTMLElement} holder The master holder.
   */
  #endDrag(holder: HTMLElement) {
    (['vertical', 'horizontal'] as Axis[]).forEach((axis) => {
      if (this.#dragging[axis]) {
        this.#dragging[axis] = false;
        this.#copyToProxy(axis, holder, true);
      }
    });
  }

  /**
   * Copies a user scroll of the proxy into the holder. An offset that matches the last one copied into
   * the proxy is that copy's own scroll event, not the user's.
   *
   * @param {Axis} axis The axis.
   */
  #copyToHolder(axis: Axis) {
    const elements = this.#elements[axis];

    if (!elements) {
      return;
    }

    const property = OFFSET_PROPERTY[axis];
    const offset = elements.proxy[property];

    if (Math.abs(offset - this.#copied[axis]) < 1) {
      return;
    }

    const holder = this.#deps.getWtTable().holder;

    this.#copied[axis] = offset;
    holder[property] = offset;
    this.#written[axis] = holder[property];
  }
}

/**
 * Writes an inline style only when it changes, so a steady grid writes nothing.
 *
 * @param {HTMLElement} element The element.
 * @param {string} property The style property (camel case).
 * @param {string} value The value.
 */
function setStyle(
  element: HTMLElement,
  property: 'height' | 'width' | 'scrollbarWidth' | 'scrollbarColor' | 'borderRadius' | 'clipPath',
  value: string,
) {
  if (element.style[property] !== value) {
    element.style[property] = value;
  }
}

/**
 * Positions an element on a box.
 *
 * @param {HTMLElement} element The element.
 * @param {ProxyBox} box The box.
 */
function placeBox(element: HTMLElement, box: ProxyBox) {
  const { style } = element;
  const values = {
    left: `${box.left}px`,
    top: `${box.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  };

  (Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
    if (style[key] !== values[key]) {
      style[key] = values[key];
    }
  });
}

/**
 * Shows or hides an element.
 *
 * @param {HTMLElement} element The element.
 * @param {boolean} visible Whether to show it.
 */
function setDisplay(element: HTMLElement, visible: boolean) {
  const value = visible ? '' : 'none';

  if (element.style.display !== value) {
    element.style.display = value;
  }
}
