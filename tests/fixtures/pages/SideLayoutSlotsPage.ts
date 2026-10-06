import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';
import { INSTANT } from './LicenseBrandingPage';
import './windowTypes';

export type SideSlot = 'start' | 'end';

/**
 * One side panel's physical border widths and corner radii, in pixels.
 */
export interface PanelSeam {
  borderLeftWidth: number;
  borderRightWidth: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
}

/**
 * One rectangle in viewport coordinates.
 */
export interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

/**
 * Everything the specs compare, read in ONE `evaluate` so every box comes from the same layout.
 */
export interface SideSlotGeometry {
  wrapper: Box;
  grid: Box;
  root: Box;
  table: Box;
  container: Box;
  rootInlineWidth: string;
  wrapperInlineWidth: string;
  documentScrollWidth: number;
  documentClientWidth: number;
  viewportWidth: number;
  holder: Box;
  startSlot: Box;
  endSlot: Box;
  startPanels: Box[];
  endPanels: Box[];
  paginationBar: Box | null;
  bottomSlot: Box;
  lock: Box | null;
  badge: Box | null;
  notification: Box | null;
  overlayLayer: Box;
  dialog: Box | null;
  startPanelScrollHeight: number;
  startPanelClientHeight: number;
  holderScrollWidth: number;
  holderClientWidth: number;
  wrapperClasses: string[];
}

/**
 * Page Object for the side layout slots fixture: a 720 x 360 px grid (`width`/`height` `'100%'`)
 * whose `start` and `end` layout slots take fixed-width panels registered through the layout
 * manager. Encapsulates the rebuild, the panel registration, and the single-pass geometry read.
 */
export class SideLayoutSlotsPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly master: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.master = this.grid.locator('.ht_master');
  }

  /**
   * Opens the fixture and waits for the first data row. A constructor throw is rethrown with its
   * own message instead of reading as a visibility timeout.
   */
  async goto({ license = 'non-commercial' }: { license?: 'non-commercial' | 'trial' } = {}): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/side-layout-slots.html?theme=${this.theme}&bundle=${this.bundle}&license=${license}`
    );
    await awaitBundle(this.page);
    await this.page.waitForFunction(
      () => 'hot' in window || 'htBuildError' in window,
      undefined,
      { polling: BUNDLE_POLLING_MS }
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }

    await this.waitForRender();
  }

  /**
   * Rebuilds the grid with `cols` columns and grid option overrides, then waits for the first row.
   * `containerHeight: 'auto'` drops the fixture container's fixed 360 px CSS height,
   * `sizeOptions: 'unset'` passes no `width`/`height` option (the window owns both axes), and
   * `documentDir` sets the document direction.
   */
  async rebuild(options: {
    cols?: number,
    overrides?: Record<string, unknown>,
    containerHeight?: 'fixed' | 'auto',
    sizeOptions?: 'fill' | 'unset',
    documentDir?: 'ltr' | 'rtl',
    hostLayout?: 'fixed' | 'inline-block' | 'flex',
    widthFunction?: number,
  }): Promise<void> {
    await this.page.evaluate(o => window.initSideSlotGrid(o), options);
    await this.waitForRender();
  }

  /**
   * Waits for the first data row. Row 1 sits right under the header, inside the rendered band.
   */
  async waitForRender(): Promise<void> {
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /**
   * A data cell in the master table.
   */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * A registered side panel, by its registration key.
   */
  panel(key: string): Locator {
    return this.grid.getByTestId(`panel-${key}`);
  }

  /**
   * Registers a fixed-width panel into a side slot and waits for it to be attached.
   */
  async addPanel(side: SideSlot, key: string, width: number): Promise<void> {
    await this.page.evaluate(([s, k, w]) => window.addSidePanel(s, k, w), [side, key, width] as const);
    await expect(this.panel(key)).toBeVisible();
  }

  /**
   * Registers a fixed-width side panel with a layout weight (lower comes first).
   */
  async addWeightedPanel(side: SideSlot, key: string, width: number, weight: number): Promise<void> {
    await this.page.evaluate(
      ([s, k, w, order]) => window.addSidePanel(s, k, w, undefined, order),
      [side, key, width, weight] as const
    );
    await expect(this.panel(key)).toBeVisible();
  }

  /**
   * Registers a fixed-width side panel holding `contentHeight` pixels of scrollable content.
   */
  async addTallPanel(side: SideSlot, key: string, width: number, contentHeight: number): Promise<void> {
    await this.page.evaluate(
      ([s, k, w, h]) => window.addSidePanel(s, k, w, h),
      [side, key, width, contentHeight] as const
    );
    await expect(this.panel(key)).toBeVisible();
  }

  /**
   * A counting button registered through `addTopButton()` or `addPanelButton()`.
   */
  button(key: string): Locator {
    return this.grid.getByTestId(`button-${key}`);
  }

  /**
   * Registers a plain, non-positioned button into the `top` slot.
   */
  async addTopButton(key: string): Promise<void> {
    await this.page.evaluate(k => window.addTopButton(k), key);
    await expect(this.button(key)).toBeVisible();
  }

  /**
   * Appends a plain, non-positioned button into a registered side panel.
   */
  async addPanelButton(panelKey: string, key: string): Promise<void> {
    await this.page.evaluate(([p, k]) => window.addPanelButton(p, k), [panelKey, key] as const);
    await expect(this.button(key)).toBeVisible();
  }

  /**
   * How many clicks a counting button received.
   */
  async clickCount(key: string): Promise<number> {
    return this.page.evaluate(k => window.slotButtonClicks[k], key);
  }

  /**
   * Whether the topmost element at the button's center is the button itself (or its text).
   */
  async isTopmostAtCenter(key: string): Promise<boolean> {
    return this.page.evaluate((k) => {
      const button = document.querySelector(`[data-testid="button-${k}"]`);

      if (!button) {
        return false;
      }

      const { left, top, width, height } = button.getBoundingClientRect();
      const hit = document.elementFromPoint(left + (width / 2), top + (height / 2));

      return hit !== null && button.contains(hit);
    }, key);
  }

  /**
   * Scrolls the window to the inline end of the page and waits until the grid's last column is
   * rendered. Under an RTL document the inline end is a negative `scrollX`.
   */
  async scrollWindowToInlineEnd(lastColumn: number): Promise<void> {
    await this.page.evaluate(() => {
      const { scrollWidth } = document.documentElement;
      const sign = document.documentElement.dir === 'rtl' ? -1 : 1;

      window.scrollTo(sign * scrollWidth, 0);
    });
    await expect(this.cell(1, lastColumn)).toBeVisible();
  }

  /**
   * Shows the dialog plugin's modal and waits for it to be visible.
   */
  async showDialog(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('dialog').show({ content: 'probe' }));
    await expect(this.grid.locator('.ht-dialog')).toBeVisible();
  }

  /**
   * Registers a side panel sized by a CSS class only.
   */
  async addClassPanel(side: SideSlot, key: string, className: string): Promise<void> {
    await this.page.evaluate(([s, k, c]) => window.addClassPanel(s, k, c), [side, key, className] as const);
    await expect(this.panel(key)).toBeVisible();
  }

  /**
   * Sets the grid container's width.
   */
  async resizeContainer(width: number): Promise<void> {
    await this.page.evaluate(w => window.resizeSideSlotContainer(w), width);
  }

  /**
   * Pins the clock past the fixture trial key's grace period, then reloads the fixture with that
   * key, so the grid mounts the license lock screen.
   */
  async gotoWithExpiredTrial(): Promise<void> {
    await this.page.clock.setFixedTime(new Date(INSTANT.trialHardStop));
    await this.goto({ license: 'trial' });
  }

  /**
   * Pins the clock inside the fixture trial key's validity, then reloads the fixture with that key,
   * so the grid shows the trial license badge without locking.
   */
  async gotoDuringTrial(): Promise<void> {
    await this.page.clock.setFixedTime(new Date(INSTANT.duringTrial));
    await this.goto({ license: 'trial' });
  }

  /**
   * Registers a fixed-width panel and returns the root element's inline width read in the same
   * task, before any scheduled pass or frame could run.
   */
  async addPanelAndReadRootWidth(side: SideSlot, key: string, width: number): Promise<string> {
    return this.page.evaluate(([s, k, w]) => window.addSidePanelAndReadRootWidth(s, k, w), [side, key, width] as const);
  }

  /**
   * How many times the `width` function has been called since the last rebuild.
   */
  async widthFunctionCalls(): Promise<number> {
    return this.page.evaluate(() => window.htWidthCalls);
  }

  /**
   * Shows a notification toast that stays until it is closed.
   */
  async showToast(): Promise<void> {
    await this.page.evaluate(() => window.showToast());
    await expect(this.grid.locator('.ht-notification__toast')).toBeVisible();
  }

  /**
   * How many draws happen while the page paints `frames` animation frames. Frames are counted
   * inside the page, so the window is a frame count, not a wall-clock wait.
   */
  async rendersOverFrames(frames: number): Promise<number> {
    return this.page.evaluate(async (count) => {
      const before = window.htRenderCount;

      for (let frame = 0; frame < count; frame += 1) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }

      return window.htRenderCount - before;
    }, frames);
  }

  /**
   * How many draws the grid has made since the last rebuild.
   */
  async renderCount(): Promise<number> {
    return this.page.evaluate(() => window.htRenderCount);
  }

  /**
   * The root wrapper's direct children (by their first `ht-` class) and its computed `display`.
   */
  async wrapperStructure(): Promise<{ children: string[], display: string }> {
    return this.page.evaluate(() => {
      const wrapper = document.querySelector('.ht-root-wrapper') as HTMLElement;

      return {
        children: Array.from(wrapper.children)
          .map(child => Array.from(child.classList).find(name => name.startsWith('ht-')) ?? ''),
        display: getComputedStyle(wrapper).display,
      };
    });
  }

  /**
   * The physical border widths and corner radii of every panel in a side slot, in DOM order, plus
   * the theme's `--ht-border-radius` as the panels resolve it.
   */
  async panelSeams(side: SideSlot): Promise<{ themeRadius: number, panels: PanelSeam[] }> {
    return this.page.evaluate((slotSide) => {
      const panels = Array.from(document.querySelectorAll(`.ht-root-wrapper > .ht-slot-${slotSide} > .ht-slot-element`));
      const px = (value: string) => parseFloat(value) || 0;
      const first = panels[0];

      return {
        themeRadius: first ? px(getComputedStyle(first).getPropertyValue('--ht-border-radius')) : 0,
        panels: panels.map((panel) => {
          const style = getComputedStyle(panel);

          return {
            borderLeftWidth: px(style.borderLeftWidth),
            borderRightWidth: px(style.borderRightWidth),
            topLeftRadius: px(style.borderTopLeftRadius),
            topRightRadius: px(style.borderTopRightRadius),
            bottomLeftRadius: px(style.borderBottomLeftRadius),
            bottomRightRadius: px(style.borderBottomRightRadius),
          };
        }),
      };
    }, side);
  }

  /**
   * Moves the browser focus onto a counting button.
   */
  async focusButton(key: string): Promise<void> {
    await this.button(key).focus();
    await expect(this.button(key)).toBeFocused();
  }

  /**
   * Where the keyboard is: the test id of the focused counting button (`null` for anything else,
   * a grid cell included) and
   * whether the grid listens to the keyboard with a selection.
   */
  async focusState(): Promise<{ focused: string | null, gridActive: boolean }> {
    return this.page.evaluate(() => {
      const hot = window.hot as unknown as { isListening(): boolean, getSelected(): unknown };

      const testId = document.activeElement?.getAttribute('data-testid') ?? '';

      return {
        focused: testId.startsWith('button-') ? testId : null,
        gridActive: hot.isListening() && hot.getSelected() !== undefined,
      };
    });
  }

  /**
   * Presses `key` until the counting button `target` holds the focus, at most `maxPresses` times,
   * and returns every focus stop on the way (`'grid'` while the grid holds the keyboard).
   */
  async pressUntilFocused(key: 'Tab' | 'Shift+Tab', target: string, maxPresses: number): Promise<string[]> {
    const stops: string[] = [];

    for (let press = 0; press < maxPresses; press += 1) {
      await this.page.keyboard.press(key);

      const { focused, gridActive } = await this.focusState();

      stops.push(focused ?? (gridActive ? 'grid' : 'other'));

      if (focused === `button-${target}`) {
        break;
      }
    }

    return stops;
  }

  /**
   * The license lock screen.
   */
  lock(): Locator {
    return this.grid.locator('.ht-license-lock');
  }

  /**
   * Changes a registered panel's width at runtime.
   */
  async resizePanel(key: string, width: number): Promise<void> {
    await this.panel(key).evaluate((panel, w) => {
      (panel as HTMLElement).style.width = `${w}px`;
    }, width);
  }

  /**
   * Polls until the grid's root element (`.ht-wrapper`) is `width` pixels wide (within 1px), so a
   * `width` re-applied after a side panel change has landed before the spec measures.
   */
  async waitForRootWidth(width: number): Promise<void> {
    await expect.poll(async () => Math.abs((await this.geometry()).root.width - width) <= 1).toBe(true);
  }

  /**
   * Unregisters a panel from its side slot and waits for it to be detached.
   */
  async removePanel(side: SideSlot, key: string): Promise<void> {
    await this.page.evaluate(([s, k]) => window.removeSidePanel(s, k), [side, key] as const);
    await expect(this.panel(key)).toHaveCount(0);
  }

  /**
   * Applies settings to the live grid and waits for the first row to be back.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(o => window.hot.updateSettings(o), settings);
    await this.waitForRender();
  }

  /**
   * Scrolls the master holder to its inline end and waits until the last column is rendered.
   */
  async scrollHolderToInlineEnd(lastColumn: number): Promise<void> {
    await this.master.locator('.wtHolder').evaluate((holder) => {
      holder.scrollLeft = holder.scrollWidth;
    });
    await expect(this.cell(1, lastColumn)).toBeVisible();
  }

  /**
   * All boxes at once.
   */
  async geometry(): Promise<SideSlotGeometry> {
    return this.page.evaluate(() => {
      const toBox = (element: Element | null): Box => {
        if (!element) {
          return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
        }

        const { top, bottom, left, right, width, height } = element.getBoundingClientRect();

        return { top, bottom, left, right, width, height };
      };
      const wrapper = document.querySelector('.ht-root-wrapper');
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!wrapper || !holder) {
        throw new Error('the fixture is not rendered');
      }

      const bar = wrapper.querySelector('.ht-slot-bottom .ht-pagination');
      const dialog = wrapper.querySelector('.ht-dialog');
      const startPanel = wrapper.querySelector(':scope > .ht-slot-start > .ht-slot-element');

      return {
        wrapper: toBox(wrapper),
        grid: toBox(wrapper.querySelector(':scope > .ht-grid')),
        root: toBox(wrapper.querySelector('.ht-grid .ht-wrapper')),
        table: toBox(wrapper.querySelector('.ht_master .htCore')),
        container: toBox(wrapper.parentElement),
        rootInlineWidth: (wrapper.querySelector('.ht-grid .ht-wrapper') as HTMLElement | null)?.style.width ?? '',
        wrapperInlineWidth: (wrapper as HTMLElement).style.width,
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        viewportWidth: window.innerWidth,
        holder: toBox(holder),
        startSlot: toBox(wrapper.querySelector(':scope > .ht-slot-start')),
        endSlot: toBox(wrapper.querySelector(':scope > .ht-slot-end')),
        startPanels: Array.from(wrapper.querySelectorAll(':scope > .ht-slot-start > .ht-slot-element')).map(toBox),
        endPanels: Array.from(wrapper.querySelectorAll(':scope > .ht-slot-end > .ht-slot-element')).map(toBox),
        paginationBar: bar ? toBox(bar) : null,
        bottomSlot: toBox(wrapper.querySelector(':scope > .ht-slot-bottom')),
        lock: wrapper.querySelector('.ht-license-lock') ? toBox(wrapper.querySelector('.ht-license-lock')) : null,
        badge: wrapper.querySelector('.ht-license-badge-wrapper')
          ? toBox(wrapper.querySelector('.ht-license-badge-wrapper')) : null,
        notification: wrapper.querySelector('.ht-notification')
          ? toBox(wrapper.querySelector('.ht-notification')) : null,
        overlayLayer: toBox(wrapper.querySelector(':scope > .ht-overlay')),
        dialog: dialog ? toBox(dialog) : null,
        startPanelScrollHeight: startPanel?.scrollHeight ?? 0,
        startPanelClientHeight: startPanel?.clientHeight ?? 0,
        holderScrollWidth: holder.scrollWidth,
        holderClientWidth: holder.clientWidth,
        wrapperClasses: Array.from(wrapper.classList),
      };
    });
  }
}
