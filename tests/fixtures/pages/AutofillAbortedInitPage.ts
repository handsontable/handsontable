import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import { dragFillHandle } from '../gestures';

/**
 * Page Object for the autofill aborted-init fixture
 * (tests/fixtures/demo/autofill-aborted-init.html).
 *
 * The fixture holds one healthy grid plus a helper that builds a second grid whose init aborts
 * inside `updateSettings()`. Tests express intent (`abortGridInit`, `movePointerAcrossPage`); the
 * selectors and the `window.hot` driving mechanics live here.
 */
export class AutofillAbortedInitPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigate to the fixture and wait for the grid to have rendered - a real DOM condition, never
   * a sleep.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/autofill-aborted-init.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The autofill fill handle of the focus selection, scoped to the master overlay. */
  fillHandle(): Locator {
    return this.page.locator('.ht_master .wtBorder.current.corner:visible');
  }

  /**
   * Build a grid whose init aborts inside `updateSettings()`, leaving the Autofill plugin's
   * `documentElement` listeners bound to an instance that has no `hot.table`.
   *
   * @returns {Promise<string | null>} The message the aborted init threw with, or `null` when it
   * unexpectedly succeeded.
   */
  async abortGridInit(): Promise<string | null> {
    return this.page.evaluate(() => window.abortGridInit());
  }

  /**
   * Move the pointer across the page with no button held. Several moves, so a single swallowed
   * event cannot make the assertion vacuous.
   */
  async movePointerAcrossPage(): Promise<void> {
    await this.page.mouse.move(10, 10);
    await this.page.mouse.move(200, 220, { steps: 6 });
    await this.page.mouse.move(420, 40, { steps: 6 });
  }

  /** Start counting the healthy grid's `getIfMouseWasDraggedOutside()` calls. */
  async instrumentDragOutsideCheck(): Promise<void> {
    await this.page.evaluate(() => window.instrumentDragOutsideCheck());
  }

  /** How many times the healthy grid measured the table for a drag-outside test. */
  async dragOutsideCheckCount(): Promise<number> {
    return this.page.evaluate(() => window.dragOutsideCheckCount);
  }

  /** Click a cell to select it, which is what draws the fill handle. */
  async selectCell(row: number, col: number): Promise<void> {
    await this.cell(row, col).click();
  }

  /** Drag the fill handle with the real pointer onto the given cell and release. */
  async dragFillHandleTo(row: number, col: number): Promise<void> {
    await dragFillHandle(this.page, this.fillHandle(), this.cell(row, col));
  }
}
