import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';

export type SizingVariant =
  | 'css-fixed' | 'tiny' | 'stretch' | 'flex-fill' | 'scrollable-ancestor' | 'explicit-height'
  | 'auto-height' | 'inline-block-host';
export type BottomSlotPlugin = 'pagination' | 'sheetsBar' | 'none';

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
export interface SlotGeometry {
  container: Box;
  shell: Box;
  wrapper: Box;
  grid: Box;
  root: Box;
  /** The master table's own box (the `.htCore` table), what the slot width follows. */
  table: Box;
  holder: Box;
  bar: Box | null;
  bottomSlot: Box;
  /** The bottom edge of the lowest row the master rendered (viewport coordinates). */
  lastRowBottom: number;
  shellScrollTop: number;
  shellClientHeight: number;
  verticalByWindow: boolean;
  horizontalByWindow: boolean;
  viewportHeight: number;
  wrapperClasses: string[];
}

/**
 * Page Object for the bottom-slot sizing fixture: a grid with NO `height` option inside a
 * CSS-sized container (or a scrollable ancestor), with the pagination or the sheets bar in the
 * bottom slot (DEV-2848). Encapsulates the fixture's variant/plugin selection, the geometry reads
 * and the two bar interactions the specs use to prove the bar is reachable.
 */
export class BottomSlotSizingPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly shell: Locator;
  readonly master: Locator;
  readonly bottomSlot: Locator;
  readonly paginationBar: Locator;
  readonly sheetsBar: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.shell = page.getByTestId('shell');
    this.master = this.grid.locator('.ht_master');
    this.bottomSlot = this.grid.locator('.ht-slot-bottom');
    this.paginationBar = this.bottomSlot.locator('.ht-pagination');
    this.sheetsBar = this.bottomSlot.locator('.ht-sheets-bar');
  }

  /**
   * Opens the fixture in the given layout with the given bottom-slot plugin and waits for the
   * first data row to render.
   */
  async goto(variant: SizingVariant, plugin: BottomSlotPlugin): Promise<void> {
    const params = new URLSearchParams({
      theme: this.theme, bundle: this.bundle, variant, plugin,
    });

    await this.page.goto(`/tests/fixtures/demo/bottom-slot-sizing.html?${params.toString()}`);
    await awaitBundle(this.page);
    await this.waitForRender();
  }

  /**
   * Rebuilds the grid in place with grid option overrides (the layout and plugin stay those of
   * the current page) and waits for the first data row.
   */
  async rebuild(overrides: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(o => window.initSlotGrid(undefined, undefined, o), overrides);
    await this.waitForRender();
  }

  /**
   * Waits for the first data row. Row 1 sits right under the header on every theme, so it is
   * inside the rendered band whatever the layout.
   */
  async waitForRender(): Promise<void> {
    await expect(this.cell(1, 1)).toBeVisible();
  }

  /** A data cell in the master table. */
  cell(row: number, col: number): Locator {
    return this.master.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * All boxes at once. The bar is the pagination or the sheets bar in the bottom slot (the
   * evaluation license notification shares the slot, so the selector names the plugin bars).
   */
  async geometry(): Promise<SlotGeometry> {
    return this.page.evaluate(() => {
      const toBox = (element: Element | null): Box => {
        if (!element) {
          return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
        }

        const { top, bottom, left, right, width, height } = element.getBoundingClientRect();

        return { top, bottom, left, right, width, height };
      };
      const hot = window.hot;
      const shell = document.getElementById('shell');
      const holder = document.querySelector('.ht_master .wtHolder');
      const bar = document.querySelector('.ht-slot-bottom .ht-pagination, .ht-slot-bottom .ht-sheets-bar');
      const rows = Array.from(document.querySelectorAll('.ht_master tbody tr'));

      if (!holder || !shell) {
        throw new Error('the fixture is not rendered');
      }

      return {
        container: toBox(hot.rootContainer),
        shell: toBox(shell),
        wrapper: toBox(hot.rootWrapperElement),
        grid: toBox(hot.rootGridElement),
        root: toBox(hot.rootElement),
        table: toBox(document.querySelector('.ht_master .htCore')),
        holder: toBox(holder),
        bar: bar ? toBox(bar) : null,
        bottomSlot: toBox(hot.rootSlotBottomElement),
        lastRowBottom: Math.max(0, ...rows.map(row => row.getBoundingClientRect().bottom)),
        shellScrollTop: shell.scrollTop,
        shellClientHeight: shell.clientHeight,
        verticalByWindow: hot.view.isVerticallyScrollableByWindow(),
        horizontalByWindow: hot.view.isHorizontallyScrollableByWindow(),
        viewportHeight: hot.view.getViewportHeight(),
        wrapperClasses: Array.from(hot.rootWrapperElement.classList),
      };
    });
  }

  /** How many rows the master rendered (virtualization probe). */
  async renderedRowCount(): Promise<number> {
    return this.page.evaluate(() => document.querySelectorAll('.ht_master tbody tr').length);
  }

  /** Inserts rows through the grid API and waits for the first row to be back. */
  async insertRows(amount: number): Promise<void> {
    await this.page.evaluate(n => window.hot.alter('insert_row_below', 0, n), amount);
    await this.waitForRender();
  }

  /** Removes columns through the grid API and waits for the first row to be back. */
  async removeColumns(amount: number): Promise<void> {
    await this.page.evaluate(n => window.hot.alter('remove_col', 0, n), amount);
    await this.waitForRender();
  }

  /** Applies settings to the live grid and waits for the first row to be back. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(s => window.hot.updateSettings(s), settings);
    await this.waitForRender();
  }

  /**
   * Shows the dialog plugin's modal (animation off) and returns its box. The dialog lives in the
   * overlays layer, which sizes against the root wrapper, so its box says what the wrapper is.
   */
  async openDialogBox(): Promise<Box> {
    await this.page.evaluate(() => {
      window.hot.updateSettings({ dialog: { animation: false } });
      window.hot.getPlugin('dialog').show({ content: 'probe' });
    });

    const dialog = this.grid.locator('.ht-dialog');

    await expect(dialog).toBeVisible();

    return dialog.evaluate((element) => {
      const { top, bottom, left, right, width, height } = element.getBoundingClientRect();

      return { top, bottom, left, right, width, height };
    });
  }

  /** The pagination counter text, e.g. `1 - 25 of 300`. */
  pageCounter(): Locator {
    return this.paginationBar.locator('.ht-page-counter-section');
  }

  /** Clicks the pagination "next page" button. */
  async nextPage(): Promise<void> {
    await this.paginationBar.locator('.ht-page-next').click();
  }

  /** The sheets-bar tab with the given name. */
  sheetTab(name: string): Locator {
    return this.sheetsBar.locator('.ht-sheets-bar__tab', { hasText: name });
  }

  /** The active sheets-bar tab. */
  activeSheetTab(): Locator {
    return this.sheetsBar.locator('.ht-sheets-bar__tab--active');
  }
}
