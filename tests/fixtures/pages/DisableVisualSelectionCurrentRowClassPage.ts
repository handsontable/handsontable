import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the "disableVisualSelection vs currentRow/ColClassName" fixture (DEV-228).
 *
 * The fixture holds one grid per `disableVisualSelection` value, each with both class options set.
 * The page object selects a body cell and exposes the two things the bug damaged - whether the
 * body cells carry the current-row/column classes - alongside the thing that must NOT come back
 * with them, the header-selection highlight.
 */
export class DisableVisualSelectionCurrentRowClassPage {
  /** `disableVisualSelection: 'header'` - the ticket's case. */
  static readonly HEADER = 'dvs-header';
  /** `disableVisualSelection: false` - the positive control. */
  static readonly FALSE = 'dvs-false';
  /** `disableVisualSelection: true` - everything off. */
  static readonly TRUE = 'dvs-true';
  /** `disableVisualSelection: 'current'`. */
  static readonly CURRENT = 'dvs-current';
  /** `disableVisualSelection: 'area'`. */
  static readonly AREA = 'dvs-area';
  /** `disableVisualSelection: ['area', 'header']` - the array form, whose blast radius includes 'header'. */
  static readonly ARRAY = 'dvs-array';

  static readonly ALL_GRIDS = ['dvs-header', 'dvs-false', 'dvs-true', 'dvs-current', 'dvs-area', 'dvs-array'];

  static readonly CURRENT_ROW_CLASS = 'currentRow';
  static readonly CURRENT_COL_CLASS = 'currentCol';

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
      `/tests/fixtures/demo/disable-visual-selection-current-row-class.html` +
      `?theme=${this.theme}&bundle=${this.bundle}`
    );

    await awaitBundle(this.page);

    for (const gridId of DisableVisualSelectionCurrentRowClassPage.ALL_GRIDS) {
      const initError = await this.initError(gridId);

      if (initError !== null) {
        throw new Error(`Grid "${gridId}" failed to build: ${initError}`);
      }
    }

    for (const gridId of DisableVisualSelectionCurrentRowClassPage.ALL_GRIDS) {
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

  /** The class tokens on one body cell. */
  async cellClasses(gridId: string, row: number, col: number): Promise<string[]> {
    const cell = this.grid(gridId).getByTestId(`cell-${row}-${col}`);
    const className = await cell.getAttribute('class');

    return (className ?? '').split(/\s+/).filter(Boolean);
  }

  /** How many rendered body cells carry the given class. */
  async cellCount(gridId: string, className: string): Promise<number> {
    return this.grid(gridId).locator(`td.${className}`).count();
  }

  /** How many header cells (`th`) carry the given class. */
  async headerCellCount(gridId: string, className: string): Promise<number> {
    return this.grid(gridId).locator(`th.${className}`).count();
  }

  /** How many header cells carry the header-selection highlight (`ht__highlight`). */
  async headerHighlightCount(gridId: string): Promise<number> {
    return this.grid(gridId).locator('th.ht__highlight').count();
  }
}
