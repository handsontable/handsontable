import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the print-selection fixture (`print-selection.html`).
 *
 * Covers DEV-133: on print, browsers drop `background-color` but keep CSS `border`s, so the
 * selection's fill handle (`.wtBorder.corner`, an inline border + a background) printed as an empty
 * bordered square while the background-only outline vanished. The `@media print` rule in
 * `_selection.scss` hides the transient selection UI; a custom border, which renders through the
 * same `.wtBorder` element with no layer class, must stay visible.
 *
 * Print media is emulated with `page.emulateMedia({ media: 'print' })`, which activates `@media
 * print` rules in `getComputedStyle` (it does NOT simulate the browser's own background drop — the
 * fix does not rely on that: it hides via `display: none`, which the emulation does reflect).
 */
export class PrintSelectionPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for the bundle and the first cell.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/print-selection.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);

    // Surface a constructor throw the fixture captured, so a bad config fails with its real error
    // rather than a distant cell-visibility timeout.
    const initError = await this.page.evaluate(() => (window as any).__hotInitError);

    if (initError) {
      throw new Error(`Handsontable failed to initialize in the fixture: ${initError}`);
    }

    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Select a multi-cell range through the API, producing the current-cell border, the area border,
   * and the fill-handle corner. Selecting through the API (not a click) avoids the dropdown-arrow
   * hazard and is deterministic. Every Border instance (area, focus, custom) owns a
   * `.wtBorder.corner` element, so the visible fill handle is the one that is not `display: none`;
   * waits for it to appear.
   */
  async selectRange(fromRow: number, fromCol: number, toRow: number, toCol: number): Promise<void> {
    await this.page.evaluate(
      ([r1, c1, r2, c2]) => window.hot.selectCells([[r1, c1, r2, c2]]),
      [fromRow, fromCol, toRow, toCol] as const);
    await expect(this.visibleFillHandle()).toHaveCount(1);
  }

  /**
   * Switch the emulated media type to `print` (activates `@media print`).
   */
  async emulatePrint(): Promise<void> {
    await this.page.emulateMedia({ media: 'print' });
  }

  /**
   * Switch the emulated media type back to `screen`.
   */
  async emulateScreen(): Promise<void> {
    await this.page.emulateMedia({ media: 'screen' });
  }

  /**
   * The visible fill-handle corner in the master overlay (the reported "pit" on print).
   */
  visibleFillHandle(): Locator {
    return this.page.locator('.ht_master .wtBorder.corner:visible');
  }

  /**
   * The visible area selection border edges in the master overlay.
   */
  visibleAreaBorder(): Locator {
    return this.page.locator('.ht_master .wtBorder.area:visible');
  }

  /**
   * The visible current-cell selection border edges in the master overlay.
   */
  visibleCurrentBorder(): Locator {
    return this.page.locator('.ht_master .wtBorder.current:visible');
  }

  /**
   * How many VISIBLE custom border edges are in the master overlay, found by their distinctive
   * magenta inline fill so they are never confused with a selection border. Must stay > 0 on both
   * media, or hiding the selection would have broken configured decoration.
   */
  async visibleCustomBorderEdgeCount(): Promise<number> {
    return this.page.evaluate(() => {
      const edges = Array.from(document.querySelectorAll('.ht_master .htBorders .wtBorder'));

      return edges.filter((el) => {
        const style = getComputedStyle(el);

        return style.backgroundColor === 'rgb(255, 0, 255)' && style.display !== 'none';
      }).length;
    });
  }
}
