import { expect, type Locator, type Page } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * How far, in pixels, an element may stick out of the bar's client box and still count as wholly in view:
 * a fractional box rounds by up to half a pixel.
 */
const BAR_EDGE_TOLERANCE = 0.5;

/**
 * The layout `window.buildGrid()` builds (see fixtures/demo/sheets-bar-ui.html).
 */
export interface SheetsBarUiConfig {
  sheets?: number;
  activeSheet?: number;
  rtl?: boolean;
  uiContainer?: boolean;
  hidden?: boolean;
  colorScheme?: 'light' | 'dark';
  density?: 'compact' | 'default' | 'comfortable';
  ariaTags?: boolean;
  hostLabel?: string;
  menus?: boolean;
  pagination?: boolean;
  tabNames?: string[];
  columnCounts?: number[];
  fixedHeight?: boolean;
}

/**
 * Page object for the sheets bar UI and accessibility fixture (fixtures/demo/sheets-bar-ui.html).
 */
export class SheetsBarUiPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly bar: Locator;
  readonly strip: Locator;
  readonly activeTab: Locator;
  readonly addButton: Locator;
  readonly allButton: Locator;
  readonly renameInput: Locator;
  readonly openMenu: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.bar = page.locator('.ht-sheets-bar');
    this.strip = this.bar.locator('.ht-sheets-bar__tabs');
    this.activeTab = this.strip.locator('.ht-sheets-bar__tab--active');
    this.addButton = this.bar.locator('.ht-sheets-bar__add');
    this.allButton = this.bar.locator('.ht-sheets-bar__all');
    this.renameInput = this.strip.locator('.ht-sheets-bar__tab-rename');
    this.openMenu = page.locator('.htSheetsBarMenu:visible');
  }

  /**
   * Opens the fixture and builds the grid.
   *
   * @param {SheetsBarUiConfig} [config] The layout under test.
   */
  async goto(config: SheetsBarUiConfig = {}): Promise<void> {
    const pageErrors: string[] = [];

    this.page.on('pageerror', error => pageErrors.push(error.message));

    await this.page.goto(`/tests/fixtures/demo/sheets-bar-ui.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await this.page.waitForFunction(() => (window as any).htFixtureReady === true, null, {
      polling: BUNDLE_POLLING_MS,
    });
    await this.page.evaluate(options => (window as any).buildGrid(options), config);

    const buildError = await this.page.evaluate(() => (window as any).htBuildError);

    expect(buildError, 'the grid threw while it was built').toBeUndefined();
    await expect(
      this.tab(0),
      pageErrors.length > 0 ? `the fixture page threw: ${pageErrors.join(' | ')}` : undefined,
    ).toBeAttached();
  }

  /**
   * A sheet tab, by its position in the strip.
   *
   * @param {number} index The tab's position.
   * @returns {Locator} The tab.
   */
  tab(index: number): Locator {
    return this.strip.locator('.ht-sheets-bar__tab').nth(index);
  }

  /**
   * The menu trigger glyph of a tab.
   *
   * @param {number} index The tab's position.
   * @returns {Locator} The chevron.
   */
  chevron(index: number): Locator {
    return this.tab(index).locator('.ht-sheets-bar__tab-chevron');
  }

  /**
   * A row of the open menu, by its text.
   *
   * @param {string} text The row's label.
   * @returns {Locator} The row's cell.
   */
  menuItem(text: string): Locator {
    return this.openMenu.locator('td', { hasText: text }).first();
  }

  /**
   * The grid's root element, which the bar names after the active sheet.
   *
   * @returns {Locator} The grid.
   */
  grid(): Locator {
    return this.page.getByRole('treegrid');
  }

  /**
   * Starts recording every write of `aria-labelledby` on the grid's root, by the value the
   * attribute held before it: a removal records the `id`, and setting it back records `null`.
   */
  async recordGridNameWrites(): Promise<void> {
    await this.page.evaluate(() => {
      const root = (window as any).hot.rootElement as HTMLElement;
      const writes: (string | null)[] = [];

      (window as any).htGridNameWrites = writes;
      new MutationObserver((records) => {
        records.forEach(record => writes.push(record.oldValue));
      }).observe(root, { attributes: true, attributeFilter: ['aria-labelledby'], attributeOldValue: true });
    });
  }

  /**
   * Reads what `recordGridNameWrites()` recorded so far.
   *
   * @returns {Promise<(string | null)[]>} The value before each write, in order.
   */
  async gridNameWrites(): Promise<(string | null)[]> {
    return this.page.evaluate(() => [...(window as any).htGridNameWrites]);
  }

  /**
   * Shows the container a `hidden` build put the grid in.
   */
  async showHost(): Promise<void> {
    await this.page.evaluate(() => (window as any).showHost());
  }

  /**
   * Switches sheets through the API.
   *
   * @param {number} position The sheet's position in the declared `sheets`.
   */
  async setActiveSheet(position: number): Promise<void> {
    await this.page.evaluate((index) => {
      const plugin = (window as any).hot.getPlugin('sheetsBar');

      plugin.setActiveSheet(plugin.getSheets()[index].id);
    }, position);
  }

  /**
   * The label of a tab, the text a user presses to switch to its sheet.
   *
   * @param {number} index The tab's position.
   * @returns {Locator} The label.
   */
  label(index: number): Locator {
    return this.tab(index).locator('.ht-sheets-bar__tab-label');
  }

  /**
   * Presses and releases the mouse inside a tab, a few pixels from its end edge, the spot a shift of the
   * tab moves out from under the pointer first.
   *
   * @param {number} index The tab's position.
   * @param {number} [inset] How far from the tab's end edge to press, in pixels.
   */
  async clickNearTabEnd(index: number, inset = 3): Promise<void> {
    const box = await this.tab(index).boundingBox();

    if (!box) {
      throw new Error(`Tab ${index} is not rendered.`);
    }

    await this.page.mouse.move(box.x + box.width - inset, box.y + (box.height / 2));
    await this.page.mouse.down();
    await this.page.mouse.up();
  }

  /**
   * Renames every sheet through the API, in tab order.
   *
   * @param {string[]} names The new names.
   */
  async renameSheets(names: string[]): Promise<void> {
    await this.page.evaluate((newNames) => {
      const plugin = (window as any).hot.getPlugin('sheetsBar');

      plugin.getSheets().forEach((sheet: any, index: number) => plugin.renameSheet(sheet.id, newNames[index]));
    }, names);
  }

  /**
   * The sheet names in tab order, the active one marked with a trailing `*`.
   *
   * @returns {Promise<string[]>} The names.
   */
  sheetStates(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).hot.getPlugin('sheetsBar').getSheets()
      .map((sheet: any) => `${sheet.name}${sheet.isActive ? '*' : ''}`));
  }

  /**
   * Makes an `afterSheetTabStateRestore` listener destroy the grid.
   */
  async destroyGridOnStateRestore(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.addHook('afterSheetTabStateRestore', () => hot.destroy());
    });
  }

  /**
   * Whether the grid has been destroyed.
   *
   * @returns {Promise<boolean>} `true` once `destroy()` ran.
   */
  isDestroyed(): Promise<boolean> {
    return this.page.evaluate(() => (window as any).hot.isDestroyed === true);
  }

  /**
   * Whether a tab's border box, which carries its focus ring, lies wholly inside the strip's visible part,
   * with no slack: a ring cut by a fraction of a pixel fails.
   *
   * @param {number} index The tab's position.
   * @returns {Promise<boolean>} `true` when the tab is fully in view.
   */
  tabWhollyInStrip(index: number): Promise<boolean> {
    return this.page.evaluate((position) => {
      const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
      const tab = strip.querySelectorAll('.ht-sheets-bar__tab')[position] as HTMLElement;
      const stripBox = strip.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();

      return tabBox.left >= stripBox.left && tabBox.right <= stripBox.right;
    }, index);
  }

  /**
   * Whether a control of the bar lies wholly inside the bar's visible part (`BAR_EDGE_TOLERANCE`).
   *
   * @param {string} selector The control's selector inside the bar.
   * @returns {Promise<boolean>} `true` when the control is fully in view.
   */
  controlWhollyInBar(selector: string): Promise<boolean> {
    return this.#whollyInBar({ selector });
  }

  /**
   * Whether a tab lies wholly inside the bar's visible part (`BAR_EDGE_TOLERANCE`).
   *
   * @param {number} index The tab's position.
   * @returns {Promise<boolean>} `true` when the tab is fully in view.
   */
  tabWhollyInBar(index: number): Promise<boolean> {
    return this.#whollyInBar({ tab: index });
  }

  /**
   * Whether an element of the bar lies inside the bar's client box, give or take `BAR_EDGE_TOLERANCE`, which
   * covers the half pixel a fractional box rounds to.
   *
   * @param {object} target A `selector`, or the `tab` position.
   * @returns {Promise<boolean>}
   */
  #whollyInBar(target: { selector?: string; tab?: number }): Promise<boolean> {
    return this.page.evaluate(([{ selector, tab }, tolerance]) => {
      const bar = document.querySelector('.ht-sheets-bar') as HTMLElement;
      const left = bar.getBoundingClientRect().left + bar.clientLeft;
      const element = (selector === undefined
        ? bar.querySelectorAll('.ht-sheets-bar__tab')[tab!]
        : bar.querySelector(selector)) as HTMLElement;
      const box = element.getBoundingClientRect();

      return box.left >= left - tolerance && box.right <= left + bar.clientWidth + tolerance;
    }, [target, BAR_EDGE_TOLERANCE] as const);
  }

  /**
   * The tab strip's `scrollLeft`.
   *
   * @returns {Promise<number>}
   */
  stripScrollLeft(): Promise<number> {
    return this.page.evaluate(() => (document.querySelector('.ht-sheets-bar__tabs') as HTMLElement).scrollLeft);
  }

  /**
   * The distance between a tab and the strip edge nearest to it, in pixels: `0` for a tab flush with an edge.
   *
   * @param {number} index The tab's position.
   * @returns {Promise<number>}
   */
  tabGapToStripEdge(index: number): Promise<number> {
    return this.page.evaluate((position) => {
      const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
      const tab = strip.querySelectorAll('.ht-sheets-bar__tab')[position] as HTMLElement;
      const stripBox = strip.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();

      return Math.min(Math.abs(tabBox.left - stripBox.left), Math.abs(stripBox.right - tabBox.right));
    }, index);
  }

  /**
   * Whether a tab lies wholly inside the strip's visible part, with a pixel of slack at each end.
   *
   * @param {number} index The tab's position.
   * @returns {Promise<boolean>} `true` when the tab is in view.
   */
  tabInStrip(index: number): Promise<boolean> {
    return this.page.evaluate((position) => {
      const strip = document.querySelector('.ht-sheets-bar__tabs') as HTMLElement;
      const tab = strip.querySelectorAll('.ht-sheets-bar__tab')[position] as HTMLElement;
      const stripBox = strip.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();

      return tabBox.left >= stripBox.left - 1 && tabBox.right <= stripBox.right + 1;
    }, index);
  }
}
