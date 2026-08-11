import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the editor window-scroll fixture: a grid with
 * `preventOverflow: 'horizontal'`, frozen rows/columns, and no set height, so
 * the WINDOW is the vertical scroller. Encapsulates opening the editor and
 * measuring whether it tracks its cell during page scroll — the behavior the
 * legacy Jasmine env could not exercise.
 */
export class EditorScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly editorHolder: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.editorHolder = page.locator('.handsontableInputHolder');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   * Theme and bundle flow as query params so the fixture loads the matching
   * stylesheet and Handsontable build (the Puppeteer parity legs).
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-scroll.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The master table does not render frozen columns at all — cell (0,0)
    // exists only in the corner clone, so that is the render signal.
    await expect(this.frozenCornerCell(0, 0)).toBeVisible();
  }

  /**
   * A single data cell in the MASTER table. Frozen rows/columns duplicate
   * their cells into overlay clones (same test id), so master must be scoped
   * explicitly.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The visible instance of a cell inside the frozen top/inline-start CORNER
   * overlay — the one the user actually sees and the editor must cover.
   */
  frozenCornerCell(row: number, col: number): Locator {
    return this.page.locator('.ht_clone_top_inline_start_corner').getByTestId(`cell-${row}-${col}`);
  }

  /** Open the editor on a cell (double click puts it into editing mode). */
  async openEditorAt(cell: Locator): Promise<void> {
    await cell.dblclick();
    await expect(this.page.locator('.handsontableInput')).toBeVisible();
  }

  /** Scroll the window by a delta and wait for the grid to settle on a frame. */
  async scrollWindowBy(x: number, y: number): Promise<void> {
    await this.page.evaluate(([dx, dy]) => {
      window.scrollBy(dx, dy);

      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }, [x, y]);
  }

  /**
   * The offset between a cell's top-left corner and the editor holder's
   * top-left corner. When the editor correctly tracks its cell the offset
   * stays constant (the holder sits 1px above/left of the cell).
   */
  async editorOffsetFromCell(cell: Locator): Promise<{ dx: number, dy: number }> {
    const cellBox = await cell.boundingBox();
    const editorBox = await this.editorHolder.boundingBox();

    if (!cellBox || !editorBox) {
      throw new Error('cell or editor holder is not rendered');
    }

    return { dx: cellBox.x - editorBox.x, dy: cellBox.y - editorBox.y };
  }
}
