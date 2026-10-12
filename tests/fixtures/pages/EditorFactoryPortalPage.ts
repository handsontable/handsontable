import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface PageOptions {
  dir?: 'ltr' | 'rtl';
  pageDir?: 'ltr' | 'rtl';
  page?: 'plain' | 'inset';
}

/**
 * Page Object for the fixture whose grid uses a custom editor built with
 * `editorFactory({ position: 'portal' })`.
 */
export class EditorFactoryPortalPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly dir: string;
  readonly pageDir: string;
  readonly pageLayout: string;
  readonly editorContainer: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dir = options.dir ?? 'ltr';
    this.pageDir = options.pageDir ?? this.dir;
    this.pageLayout = options.page ?? 'plain';
    this.editorContainer = page.getByTestId('editor-container');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&dir=${this.dir}&pageDir=${this.pageDir}&page=${this.pageLayout}`;

    await this.page.goto(`/tests/fixtures/demo/editor-factory-portal.html?${query}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Scrolls the page horizontally towards its inline end, which is a negative offset under RTL.
   */
  async scrollPageTowardsInlineEnd(pixels: number): Promise<void> {
    const offset = this.pageDir === 'rtl' ? -pixels : pixels;

    await this.page.evaluate(x => window.scrollTo(x, 0), offset);
    await expect.poll(() => this.page.evaluate(() => window.pageXOffset)).toBe(offset);
  }

  /**
   * Selects a cell and opens its editor with Enter.
   */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      const hot = (window as unknown as { hot: { selectCell(r: number, c: number): void } }).hot;

      hot.selectCell(r, c);
    }, [row, col]);
    await this.page.keyboard.press('Enter');
    await expect(this.editorContainer).toBeVisible();
  }

  /**
   * Returns the edges of the edited cell and of the editor container, in viewport coordinates, read
   * in one round trip.
   */
  async edges(row: number, col: number): Promise<{
    cell: { top: number, left: number, right: number },
    editor: { top: number, left: number, right: number },
  }> {
    return this.page.evaluate(([r, c]) => {
      const cell = document.querySelector(`[data-testid="cell-${r}-${c}"]`)!.getBoundingClientRect();
      const editor = document.querySelector('[data-testid="editor-container"]')!.getBoundingClientRect();

      return {
        cell: { top: cell.top, left: cell.left, right: cell.right },
        editor: { top: editor.top, left: editor.left, right: editor.right },
      };
    }, [row, col]);
  }
}
