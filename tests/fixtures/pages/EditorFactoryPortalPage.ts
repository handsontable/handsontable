import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface PageOptions {
  dir?: 'ltr' | 'rtl';
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
  readonly pageLayout: string;
  readonly editorContainer: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd', options: PageOptions = {}) {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.dir = options.dir ?? 'ltr';
    this.pageLayout = options.page ?? 'plain';
    this.editorContainer = page.getByTestId('editor-container');
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   */
  async goto(): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&dir=${this.dir}&page=${this.pageLayout}`;

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
    const offset = this.dir === 'rtl' ? -pixels : pixels;

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
   * Returns the horizontal edges of the edited cell and of the editor container, in viewport
   * coordinates.
   */
  async edges(row: number, col: number): Promise<{ cell: { left: number, right: number },
    editor: { left: number, right: number } }> {
    const cell = await this.cell(row, col).boundingBox();
    const editor = await this.editorContainer.boundingBox();

    if (!cell || !editor) {
      throw new Error('The cell or the editor container is not rendered');
    }

    return {
      cell: { left: cell.x, right: cell.x + cell.width },
      editor: { left: editor.x, right: editor.x + editor.width },
    };
  }
}
