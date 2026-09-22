import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the "NestedHeaders vs currentRow/ColClassName" fixture (DEV-3012).
 *
 * Every grid shares the same 2-level column-header group and a second row-header column. The page
 * object selects a body cell through the API and returns Locators scoped to the sticky overlay
 * clones, so the spec asserts with web-first matchers (`toHaveCount`) how many header levels the
 * row/column highlight reaches.
 */
export class NestedHeadersCurrentRowColClassPage {
  /** `disableVisualSelection: false` - the positive control. */
  static readonly FALSE = 'false-grid';
  /** `disableVisualSelection: 'header'` - the row/column highlight must still reach every level. */
  static readonly HEADER = 'header-grid';
  /** `selectionMode: 'single'` - the `#applyRowColumnHighlights` single-mode branch. */
  static readonly SINGLE = 'single-grid';
  /** No nested headers, no second row-header column - the single-level regression control. */
  static readonly FLAT = 'flat-grid';

  static readonly ALL_GRIDS = ['false-grid', 'header-grid', 'single-grid', 'flat-grid'];

  static readonly CURRENT_ROW_CLASS = 'currentRow';
  static readonly CURRENT_COL_CLASS = 'currentCol';
  /** The default header-selection highlight class (`currentHeaderClassName`), untouched by DEV-3012. */
  static readonly HEADER_HIGHLIGHT_CLASS = 'ht__highlight';

  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /** Navigate and wait for every grid to have rendered - a real DOM condition, never a sleep. */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/nested-headers-current-row-col-class.html` +
      `?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    for (const gridId of NestedHeadersCurrentRowColClassPage.ALL_GRIDS) {
      const initError = await this.initError(gridId);

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of NestedHeadersCurrentRowColClassPage.ALL_GRIDS) {
      await expect(this.grid(gridId).locator('.ht_master')).toBeVisible();
    }
  }

  /** One of the grid containers. */
  grid(gridId: string): Locator {
    return this.page.getByTestId(gridId);
  }

  /** The message a throwing constructor stamped on the container, or `null`. */
  async initError(gridId: string): Promise<string | null> {
    return this.grid(gridId).getAttribute('data-init-error');
  }

  /** Select a single body cell through the API, so no stray click can open an editor. */
  async selectCell(gridId: string, row: number, col: number): Promise<void> {
    await this.page.evaluate(([id, r, c]) => {
      (window as unknown as {
        hots: Record<string, { selectCell: (row: number, col: number) => void }>;
      }).hots[id as string].selectCell(r as number, c as number);
    }, [gridId, row, col] as const);
  }

  /** Column-header cells (`th`) carrying the given class, scoped to the top overlay clone. */
  topCloneHeaderCells(gridId: string, className: string): Locator {
    return this.grid(gridId).locator('.ht_clone_top').locator(`th.${className}`);
  }

  /** Row-header cells (`th`) carrying the given class, scoped to the inline-start overlay clone. */
  inlineStartCloneHeaderCells(gridId: string, className: string): Locator {
    return this.grid(gridId).locator('.ht_clone_inline_start').locator(`th.${className}`);
  }
}
