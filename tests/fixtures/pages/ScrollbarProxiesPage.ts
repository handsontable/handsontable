import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt, type Bundle } from '../bundle';

/**
 * The grid the fixture builds. Every field maps onto one of its fail-loud query params.
 */
export interface GridShape {
  ft?: 0 | 1 | 2 | 3;
  fb?: 0 | 1 | 2 | 3;
  fs?: 0 | 1 | 2 | 3;
  fe?: 0 | 1 | 2 | 3;
  headers?: 'both' | 'cols' | 'rows' | 'none';
  dir?: 'ltr' | 'rtl';
  mode?: 'element' | 'window';
  gutter?: 'classic' | 'none';
  host?: 'none' | 'holder';
  menu?: 'none' | 'filters';
}

/**
 * The color the fixture's `host=holder` rule gives the holder's own thumb.
 */
export const HOLDER_THUMB_RGB = [0, 136, 255] as const;

export type Axis = 'vertical' | 'horizontal';

/**
 * A viewport rect.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Where the scrollbar pieces are, next to what they are placed against. Every box is a viewport rect
 * read in one evaluation.
 */
export interface ScrollbarLayout {
  /**
   * The master holder's border box.
   */
  holder: Box;
  /**
   * The master holder's client box: the border box minus the gutters.
   */
  client: Box;
  /**
   * The space each classic scrollbar takes in the holder (`offsetWidth - clientWidth` and the height
   * twin).
   */
  gutters: { vertical: number; horizontal: number };
  /**
   * The visible proxy of each axis, or `null` when there is none.
   */
  vertical: Box | null;
  horizontal: Box | null;
  /**
   * The visible fillers, sorted into the gutter strip each one lies in. `stray` holds any that lie in
   * neither, which should never happen.
   */
  fillers: { vertical: Box[]; horizontal: Box[]; stray: Box[] };
  /**
   * The tables of the clones the scrollbars are placed against, or `null` for a clone that is not
   * shown.
   */
  clones: { top: Box | null; bottom: Box | null; inlineStart: Box | null; inlineEnd: Box | null };
}

/**
 * The scroll range (`scrollHeight - clientHeight` and the width twin) of the holder and of each proxy.
 */
export interface ScrollRanges {
  holderVertical: number;
  holderHorizontal: number;
  proxyVertical: number | null;
  proxyHorizontal: number | null;
}

/**
 * The scroll offsets of the holder and of each proxy, with the first rendered row and column as the
 * render-state probe.
 */
export interface ScrollState {
  holderTop: number;
  holderLeft: number;
  proxyTop: number | null;
  proxyLeft: number | null;
  firstRenderedRow: number;
  firstRenderedColumn: number;
}

/**
 * The frame redrawn over the gutters, next to the holder it frames.
 */
export interface FrameState {
  frame: Box;
  holder: Box;
  clipPath: string;
  /**
   * The clip the holder's own measurements call for: the vertical gutter at full height joined with
   * the horizontal gutter at full width.
   */
  expectedClipPath: string;
  boxShadow: string;
  pointerEvents: string;
  borderRadius: string;
  holderBorderRadius: string;
}

/**
 * The attributes of one of the elements the scrollbars add.
 */
export interface AddedElement {
  className: string;
  ariaHidden: string | null;
  tabindex: string | null;
}

interface ProxiesWindow {
  hot: {
    alter(action: 'insert_row_below', index: number, amount: number): void;
    countRows(): number;
    getFirstRenderedVisibleRow(): number;
    getFirstRenderedVisibleColumn(): number;
    getSelectedLast(): number[] | undefined;
    isListening(): boolean;
    selectCell(row: number, column: number): boolean;
    view: { _wt: { wtOverlays: { isStickyScrollActive(): boolean } } };
  };
  htProxyWrites: number;
}

const PROXY = '.htScrollbarProxy';
const FILLER = '.htScrollbarProxyFiller';
const FRAME = '.htScrollbarFrame';

/**
 * Page Object for the fixture whose classic scrollbars run beside the scrolling part of each edge
 * only: a proxy scroll container in the holder's gutter, fillers in the track color over the rest of
 * the gutter, and a frame over the gutters.
 */
export class ScrollbarProxiesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   *
   * @param {GridShape} shape The grid to build.
   */
  async goto(shape: GridShape = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    Object.entries(shape).forEach(([key, value]) => params.set(key, String(value)));

    await this.page.goto(`/tests/fixtures/demo/scrollbar-proxies.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.grid.locator('.ht_master table.htCore tbody > tr').first()).toBeVisible();
  }

  /**
   * Where the scrollbar pieces are, and what they are placed against.
   *
   * @returns {Promise<ScrollbarLayout>}
   */
  async layout(): Promise<ScrollbarLayout> {
    return this.grid.evaluate((root, selectors) => {
      const toBox = (rect: DOMRect | { left: number, top: number, width: number, height: number }) => ({
        left: rect.left,
        top: rect.top,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        width: rect.width,
        height: rect.height,
      });
      const shown = (element: Element | null): element is HTMLElement =>
        element !== null && getComputedStyle(element).display !== 'none' && element.getClientRects().length > 0;
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const holderRect = holder.getBoundingClientRect();
      const client = toBox({
        left: holderRect.left + holder.clientLeft,
        top: holderRect.top + holder.clientTop,
        width: holder.clientWidth,
        height: holder.clientHeight,
      });
      const proxy = (axis: string) => {
        const element = root.querySelector(`${selectors.proxy}-${axis}`);

        return shown(element) ? toBox(element.getBoundingClientRect()) : null;
      };
      const clone = (name: string) => {
        const container = root.querySelector(`.ht_clone_${name}`);
        const table = container?.querySelector('table.htCore') ?? null;

        return shown(container) && shown(table) && table.getBoundingClientRect().height > 0
          ? toBox(table.getBoundingClientRect()) : null;
      };
      const fillers = { vertical: [] as ReturnType<typeof toBox>[], horizontal: [] as ReturnType<typeof toBox>[],
        stray: [] as ReturnType<typeof toBox>[] };

      root.querySelectorAll(selectors.filler).forEach((element) => {
        if (!shown(element)) {
          return;
        }

        const box = toBox(element.getBoundingClientRect());
        const x = box.left + (box.width / 2);
        const y = box.top + (box.height / 2);
        const inVerticalGutter = (x < client.left || x > client.right) && y >= client.top && y <= client.bottom;
        const inHorizontalGutter = y > client.bottom && x >= client.left && x <= client.right;

        if (inVerticalGutter) {
          fillers.vertical.push(box);
        } else if (inHorizontalGutter) {
          fillers.horizontal.push(box);
        } else {
          fillers.stray.push(box);
        }
      });

      return {
        holder: toBox(holderRect),
        client,
        gutters: {
          vertical: holder.offsetWidth - holder.clientWidth,
          horizontal: holder.offsetHeight - holder.clientHeight,
        },
        vertical: proxy('vertical'),
        horizontal: proxy('horizontal'),
        fillers,
        clones: {
          top: clone('top'),
          bottom: clone('bottom'),
          inlineStart: clone('inline_start'),
          inlineEnd: clone('inline_end'),
        },
      };
    }, { proxy: PROXY, filler: FILLER });
  }

  /**
   * The scroll ranges of the holder and of each proxy.
   *
   * @returns {Promise<ScrollRanges>}
   */
  async scrollRanges(): Promise<ScrollRanges> {
    return this.grid.evaluate((root, proxy) => {
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const vertical = root.querySelector<HTMLElement>(`${proxy}-vertical`);
      const horizontal = root.querySelector<HTMLElement>(`${proxy}-horizontal`);

      return {
        holderVertical: holder.scrollHeight - holder.clientHeight,
        holderHorizontal: holder.scrollWidth - holder.clientWidth,
        proxyVertical: vertical ? vertical.scrollHeight - vertical.clientHeight : null,
        proxyHorizontal: horizontal ? horizontal.scrollWidth - horizontal.clientWidth : null,
      };
    }, PROXY);
  }

  /**
   * The scroll offsets of the holder and of each proxy, with the rendered band.
   *
   * @returns {Promise<ScrollState>}
   */
  async scrollState(): Promise<ScrollState> {
    return this.grid.evaluate((root, proxy) => {
      const { hot } = window as unknown as ProxiesWindow;
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const vertical = root.querySelector<HTMLElement>(`${proxy}-vertical`);
      const horizontal = root.querySelector<HTMLElement>(`${proxy}-horizontal`);

      return {
        holderTop: holder.scrollTop,
        holderLeft: holder.scrollLeft,
        proxyTop: vertical ? vertical.scrollTop : null,
        proxyLeft: horizontal ? horizontal.scrollLeft : null,
        firstRenderedRow: hot.getFirstRenderedVisibleRow(),
        firstRenderedColumn: hot.getFirstRenderedVisibleColumn(),
      };
    }, PROXY);
  }

  /**
   * The holder's vertical offset, and whether it and the vertical proxy's offset held still across two
   * animation frames: a scroll the pointer started has then landed, including the part the browser
   * applies a frame after the input. Poll it; one read proves nothing about the next frame.
   *
   * @returns {Promise<{ holderTop: number, settled: boolean }>}
   */
  async settledScrollTop(): Promise<{ holderTop: number, settled: boolean }> {
    return this.grid.evaluate(async(root, proxy) => {
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const vertical = root.querySelector<HTMLElement>(`${proxy}-vertical`);
      const read = () => [holder.scrollTop, vertical ? vertical.scrollTop : 0];
      const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const before = read();

      await nextFrame();
      await nextFrame();

      const after = read();

      return { holderTop: after[0], settled: before[0] === after[0] && before[1] === after[1] };
    }, PROXY);
  }

  /**
   * Scrolls the holder the way the engine or an API call does, then waits for the draw that follows it.
   * Whether the proxies followed is the spec's to assert.
   *
   * @param {{ top?: number, left?: number }} offsets The holder offsets to write.
   */
  async scrollHolderTo(offsets: { top?: number, left?: number }): Promise<void> {
    const before = await this.scrollState();

    await this.grid.evaluate((root, { top, left }) => {
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;

      if (top !== undefined) {
        holder.scrollTop = top;
      }

      if (left !== undefined) {
        holder.scrollLeft = left;
      }
    }, offsets);

    await expect.poll(async() => {
      const state = await this.scrollState();

      return (offsets.top === undefined || state.firstRenderedRow !== before.firstRenderedRow)
        && (offsets.left === undefined || state.firstRenderedColumn !== before.firstRenderedColumn);
    }, { message: 'the grid drew the holder scroll' }).toBe(true);
  }

  /**
   * Scrolls the holder to the middle of its vertical range, where the thumb of the vertical proxy sits
   * in the middle of its track: a point the pointer can press without knowing the scrollbar's arrows.
   */
  async scrollHolderToVerticalMiddle(): Promise<void> {
    const ranges = await this.scrollRanges();

    await this.scrollHolderTo({ top: Math.round(ranges.holderVertical / 2) });
  }

  /**
   * Scrolls one proxy, as the browser does when the user moves its scrollbar. The spec polls for what
   * the grid does with it.
   *
   * @param {Axis} axis Which proxy.
   * @param {number} offset The offset to write.
   */
  async scrollProxyTo(axis: Axis, offset: number): Promise<void> {
    await this.grid.evaluate((root, { selector, property, value }) => {
      const element = root.querySelector<HTMLElement>(selector)!;

      element[property] = value;
    }, {
      selector: `${PROXY}-${axis}`,
      property: axis === 'vertical' ? 'scrollTop' as const : 'scrollLeft' as const,
      value: offset,
    });
  }

  /**
   * The center of a proxy, in viewport coordinates.
   *
   * @param {Axis} axis Which proxy.
   * @returns {Promise<{ x: number, y: number }>}
   */
  async proxyCenter(axis: Axis): Promise<{ x: number, y: number }> {
    const layout = await this.layout();
    const box = layout[axis];

    if (box === null) {
      throw new Error(`No ${axis} proxy is shown`);
    }

    return { x: box.left + (box.width / 2), y: box.top + (box.height / 2) };
  }

  /**
   * Turns the mouse wheel over a proxy's center.
   *
   * @param {Axis} axis Which proxy.
   * @param {number} delta The wheel delta along that axis.
   */
  async wheelOverProxy(axis: Axis, delta: number): Promise<void> {
    const { x, y } = await this.proxyCenter(axis);

    await this.page.mouse.move(x, y);
    await this.page.mouse.wheel(axis === 'horizontal' ? delta : 0, axis === 'vertical' ? delta : 0);
  }

  /**
   * Starts counting the offset writes a script makes to either proxy. The browser's own scroll of a
   * dragged thumb is not a property write and is not counted.
   */
  async startCountingProxyWrites(): Promise<void> {
    await this.grid.evaluate((root, proxy) => {
      const fixture = window as unknown as ProxiesWindow;

      fixture.htProxyWrites = 0;
      root.querySelectorAll<HTMLElement>(proxy).forEach((element) => {
        (['scrollTop', 'scrollLeft'] as const).forEach((property) => {
          const native = Object.getOwnPropertyDescriptor(Element.prototype, property)!;

          Object.defineProperty(element, property, {
            configurable: true,
            get() {
              return native.get!.call(this);
            },
            set(value: number) {
              fixture.htProxyWrites += 1;
              native.set!.call(this, value);
            },
          });
        });
      });
    }, PROXY);
  }

  /**
   * How many offset writes a script made to the proxies since counting started or was reset.
   *
   * @returns {Promise<number>}
   */
  async proxyWrites(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as ProxiesWindow).htProxyWrites);
  }

  /**
   * Sets the write count back to 0.
   */
  async resetProxyWrites(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as ProxiesWindow).htProxyWrites = 0;
    });
  }

  /**
   * Whether the engine treats the current pointer press as a native scrollbar drag.
   *
   * @returns {Promise<boolean>}
   */
  async isScrollbarDragActive(): Promise<boolean> {
    return this.page.evaluate(() => (window as unknown as ProxiesWindow).hot.view._wt.wtOverlays.isStickyScrollActive());
  }

  /**
   * Selects a cell through the API.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   */
  async selectCell(row: number, column: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as unknown as ProxiesWindow).hot.selectCell(r, c);
    }, [row, column]);
  }

  /**
   * The last selection layer, and whether the grid still takes the keyboard.
   *
   * @returns {Promise<{ selected: number[] | null, listening: boolean }>}
   */
  async selectionState(): Promise<{ selected: number[] | null, listening: boolean }> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as ProxiesWindow;

      return { selected: hot.getSelectedLast() ?? null, listening: hot.isListening() };
    });
  }

  /**
   * Appends rows through `alter()`, which redraws the grid.
   *
   * @param {number} amount How many rows.
   */
  async appendRows(amount: number): Promise<void> {
    const rowsBefore = await this.page.evaluate(() => (window as unknown as ProxiesWindow).hot.countRows());

    await this.page.evaluate((count) => {
      const { hot } = window as unknown as ProxiesWindow;

      hot.alter('insert_row_below', hot.countRows() - 1, count);
    }, amount);
    await expect.poll(() => this.page.evaluate(() => (window as unknown as ProxiesWindow).hot.countRows()))
      .toBe(rowsBefore + amount);
  }

  /**
   * The frame and the holder it frames.
   *
   * @returns {Promise<FrameState | null>} `null` when no frame is shown.
   */
  async frame(): Promise<FrameState | null> {
    return this.grid.evaluate((root, selector) => {
      const toBox = (rect: DOMRect) => ({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
      const frame = root.querySelector<HTMLElement>(selector);

      if (frame === null || getComputedStyle(frame).display === 'none') {
        return null;
      }

      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const w = holder.offsetWidth;
      const h = holder.offsetHeight;
      const vb = holder.clientHeight;
      const gv = w - holder.clientWidth;
      const rtl = getComputedStyle(holder).direction === 'rtl';
      const points = rtl
        ? [[0, 0], [gv, 0], [gv, vb], [w, vb], [w, h], [0, h]]
        : [[w - gv, 0], [w, 0], [w, h], [0, h], [0, vb], [w - gv, vb]];
      const frameStyle = getComputedStyle(frame);

      return {
        frame: toBox(frame.getBoundingClientRect()),
        holder: toBox(holder.getBoundingClientRect()),
        clipPath: frameStyle.clipPath,
        expectedClipPath: `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(', ')})`,
        boxShadow: frameStyle.boxShadow,
        pointerEvents: frameStyle.pointerEvents,
        borderRadius: frameStyle.borderRadius,
        holderBorderRadius: getComputedStyle(holder).borderRadius,
      };
    }, FRAME);
  }

  /**
   * The vertical gutter's width next to the width of the vertical proxy's own scrollbar.
   *
   * @returns {Promise<{ gutter: number, proxyBar: number }>}
   */
  async verticalBarWidths(): Promise<{ gutter: number, proxyBar: number }> {
    return this.grid.evaluate((root, proxy) => {
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;
      const vertical = root.querySelector<HTMLElement>(`${proxy}-vertical`)!;

      return {
        gutter: holder.offsetWidth - holder.clientWidth,
        proxyBar: vertical.offsetWidth - vertical.clientWidth,
      };
    }, PROXY);
  }

  /**
   * How many pixels of one color the screen shows inside the vertical proxy's box. The screenshot is
   * decoded in the page, through a canvas.
   *
   * @param {readonly number[]} rgb The color to count.
   * @returns {Promise<{ matching: number, total: number }>}
   */
  async pixelsInVerticalProxy(rgb: readonly number[]): Promise<{ matching: number, total: number }> {
    const box = (await this.layout()).vertical;

    if (box === null) {
      throw new Error('No vertical proxy is shown');
    }

    const png = await this.page.screenshot({
      clip: { x: box.left, y: box.top, width: box.width, height: box.height },
      scale: 'css',
    });

    return this.page.evaluate(async({ data, color }) => {
      const image = new Image();

      image.src = `data:image/png;base64,${data}`;
      await image.decode();

      const canvas = document.createElement('canvas');

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext('2d')!;

      context.drawImage(image, 0, 0);

      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let matching = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        if (Math.abs(pixels[i] - color[0]) <= 8 && Math.abs(pixels[i + 1] - color[1]) <= 8
          && Math.abs(pixels[i + 2] - color[2]) <= 8) {
          matching += 1;
        }
      }

      return { matching, total: pixels.length / 4 };
    }, { data: png.toString('base64'), color: [...rgb] });
  }

  /**
   * Opens the column menu of the first column through its header button and waits for the Filters
   * "Filter by value" list, a nested grid.
   */
  async openFirstColumnMenu(): Promise<void> {
    await this.grid.locator('.ht_clone_top .changeType').first().click();
    await expect(this.page.locator('.htDropdownMenu .htUIMultipleSelect .ht_master .wtHolder').first())
      .toBeVisible();
  }

  /**
   * The frame shadow of the "Filter by value" list, next to the main grid's, with the list holder's
   * vertical gutter. `null` for a frame that is not there.
   *
   * @returns {Promise<{ listGutter: number, listFrameShadow: string | null, gridFrameShadow: string | null }>}
   */
  async frameShadows(): Promise<{ listGutter: number, listFrameShadow: string | null, gridFrameShadow: string | null }> {
    return this.page.evaluate((selector) => {
      const shadowOf = (root: Element | null) => {
        const frame = root?.querySelector<HTMLElement>(`:scope > .ht_master > ${selector}`);

        return frame && getComputedStyle(frame).display !== 'none' ? getComputedStyle(frame).boxShadow : null;
      };
      const list = document.querySelector('.htDropdownMenu .htUIMultipleSelect .handsontable');
      const listHolder = list?.querySelector<HTMLElement>('.ht_master .wtHolder');

      return {
        listGutter: listHolder ? listHolder.offsetWidth - listHolder.clientWidth : 0,
        listFrameShadow: shadowOf(list),
        gridFrameShadow: shadowOf(document.querySelector('[data-testid="grid"] .handsontable')),
      };
    }, FRAME);
  }

  /**
   * The class name of the topmost element at each point.
   *
   * @param {Array<{ x: number, y: number }>} points Viewport points.
   * @returns {Promise<string[]>}
   */
  async classNamesAt(points: Array<{ x: number, y: number }>): Promise<string[]> {
    return this.page.evaluate(spots => spots.map(({ x, y }) => {
      const element = document.elementFromPoint(x, y);

      return element === null ? '' : element.className;
    }), points);
  }

  /**
   * Every element the scrollbars added to the grid, shown or not.
   *
   * @returns {Promise<AddedElement[]>}
   */
  async addedElements(): Promise<AddedElement[]> {
    return this.grid.evaluate((root, selectors) => Array.from(root.querySelectorAll(selectors))
      .map(element => ({
        className: element.className,
        ariaHidden: element.getAttribute('aria-hidden'),
        tabindex: element.getAttribute('tabindex'),
      })), [PROXY, FILLER, FRAME].join(', '));
  }

  /**
   * The holder's gutters and scroll ranges, and how far the page itself can scroll: what decides
   * whether the grid or the window scrolls each axis.
   *
   * @returns {Promise<{ gutters: { vertical: number, horizontal: number }, holderScrolls: boolean, pageScrolls: boolean }>}
   */
  async scrollOwners(): Promise<{
    gutters: { vertical: number, horizontal: number },
    holderScrolls: boolean,
    pageScrolls: boolean,
  }> {
    return this.grid.evaluate((root) => {
      const holder = root.querySelector<HTMLElement>('.ht_master .wtHolder')!;

      return {
        gutters: {
          vertical: holder.offsetWidth - holder.clientWidth,
          horizontal: holder.offsetHeight - holder.clientHeight,
        },
        holderScrolls: holder.scrollHeight > holder.clientHeight && holder.scrollWidth > holder.clientWidth,
        pageScrolls: document.documentElement.scrollHeight > window.innerHeight,
      };
    });
  }
}
