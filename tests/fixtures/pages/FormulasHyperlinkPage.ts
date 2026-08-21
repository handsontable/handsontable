import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the `formulas.hyperlinks` fixture. Encapsulates reading the
 * anchor a `HYPERLINK` cell renders, flipping the option at runtime, and the
 * `Alt`+`Enter` keyboard path (the anchor is deliberately kept out of the tab
 * order, so the shortcut is the only keyboard way to follow a link).
 */
export class FormulasHyperlinkPage {
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
   * Navigate and wait until the engine has evaluated the formulas: the first
   * cell showing its label instead of the raw expression proves both the grid
   * and the engine are up.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/formulas-hyperlink.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell(0, 0)).toHaveText('Example one');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The anchor a `HYPERLINK` cell renders, if any. */
  link(row: number, col: number): Locator {
    return this.cell(row, col).locator('a.ht-hyperlink');
  }

  /** The element the fixture's custom renderer writes into column B. */
  customMark(row: number): Locator {
    return this.cell(row, 1).locator('span.custom-mark');
  }

  /** Turn the `hyperlinks` sub-option on or off through `updateSettings`. */
  async setHyperlinks(enabled: boolean): Promise<void> {
    await this.page.evaluate((hyperlinks) => {
      const hot = (window as any).hot;

      hot.updateSettings({
        formulas: {
          engine: (window as any).HyperFormula,
          sheetName: 'Sheet1',
          hyperlinks,
        },
      });
    }, enabled);
  }

  /** Write a raw value into a cell, replacing whatever formula it held. */
  async setCellValue(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as any).hot.setDataAtCell(r, c, v);
    }, [row, col, value] as [number, number, string]);
  }

  /** Disable the Formulas plugin at runtime and force a redraw. */
  async disableFormulasPlugin(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('formulas').disablePlugin();
      hot.render();
    });
  }

  /**
   * Replace `window.open` with a recorder. The plugin opens links through it,
   * so this keeps the keyboard assertion deterministic and offline.
   */
  async recordWindowOpen(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__opened = [];
      window.open = (url?: string | URL) => {
        (window as any).__opened.push(String(url));

        return null;
      };
    });
  }

  /** The URLs passed to `window.open` since `recordWindowOpen()` was called. */
  async openedUrls(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).__opened as string[]);
  }

  /** Click a cell so it becomes the selected one, without hitting its anchor. */
  async selectCell(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`cell ${row},${col} is not rendered`);
    }

    // Click near the right edge, past the label, so the pointer lands on the
    // cell itself rather than on the anchor.
    await this.page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
    await expect(this.selectedCoords()).resolves.toEqual([row, col]);
  }

  /** The coordinates of the currently highlighted cell. */
  async selectedCoords(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const highlight = (window as any).hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    });
  }

  /** Press the shortcut that opens the link of the selected cell. */
  async pressOpenLinkShortcut(): Promise<void> {
    await this.page.keyboard.press('Alt+Enter');
  }

  /** Whether an editor is open, and what it holds. */
  async editorValue(): Promise<string | null> {
    return this.page.evaluate(() => {
      const editor = (window as any).hot.getActiveEditor();

      return editor?.isOpened() ? editor.getValue() : null;
    });
  }
}
