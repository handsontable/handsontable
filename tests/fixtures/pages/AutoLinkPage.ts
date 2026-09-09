import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page Object for the `autoLink` fixture: reading the anchors a cell renders, flipping the option at
 * runtime, and the `Alt`+`Enter` keyboard path.
 */
export class AutoLinkPage {
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

  /** Navigate, wait for the bundle, then for the engine (the HYPERLINK label proves both are up). */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/auto-link.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 5)).toHaveText('HF label');
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The `autoLink` anchors of a cell. */
  links(row: number, col: number): Locator {
    return this.cell(row, col).locator('a.ht-auto-link');
  }

  /** Every anchor of a cell, whichever feature made it. */
  anyLinks(row: number, col: number): Locator {
    return this.cell(row, col).locator('a');
  }

  /** Set the grid-level `autoLink` option through `updateSettings`. */
  async setAutoLink(value: boolean | Record<string, unknown>): Promise<void> {
    await this.page.evaluate((autoLink) => {
      (window as any).hot.updateSettings({ autoLink });
    }, value);
  }

  /**
   * Turn the whole Formulas plugin off or on through `updateSettings`. Turning it on goes through the
   * base plugin's `enablePlugin()` path, which registers its `afterRenderer` AFTER AutoLink's — the
   * reversed hook order the two features must converge from.
   */
  async setFormulasEnabled(enabled: boolean): Promise<void> {
    await this.page.evaluate((on) => {
      const hot = (window as any).hot;

      hot.updateSettings({
        formulas: on ? { engine: (window as any).HyperFormula, sheetName: 'Sheet1', hyperlinks: true } : false,
      });
    }, enabled);
  }

  /** Switch the render mode through `updateSettings`. */
  async setRenderMode(renderMode: 'always' | 'onChange'): Promise<void> {
    await this.page.evaluate((mode) => {
      (window as any).hot.updateSettings({ renderMode: mode });
    }, renderMode);
  }

  /** Disable the plugin WITHOUT a redraw, which is what a caller that simply turns it off does. */
  async disablePluginWithoutRender(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).hot.getPlugin('autoLink').disablePlugin();
    });
  }

  /**
   * Re-enable the plugin through its own `enablePlugin()`, then force a render. This is what a caller
   * that flips the plugin back on through the API (rather than through `updateSettings`) does.
   */
  async enablePluginWithoutSettings(): Promise<void> {
    await this.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('autoLink').enablePlugin();
      hot.render();
    });
  }

  /** Write a raw value into a cell. */
  async setCellValue(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(([r, c, v]) => {
      (window as any).hot.setDataAtCell(r, c, v);
    }, [row, col, value] as [number, number, string]);
  }

  /** Force N extra draws, so TD reuse and re-decoration are actually exercised. */
  async render(times = 1): Promise<void> {
    await this.page.evaluate((count) => {
      for (let i = 0; i < count; i++) {
        (window as any).hot.render();
      }
    }, times);
  }

  /** Replace `window.open` with a recorder, so the keyboard assertion is deterministic and offline. */
  async recordWindowOpen(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__opened = [];
      window.open = (url?: string | URL, target?: string) => {
        (window as any).__opened.push([String(url), target]);

        return null;
      };
    });
  }

  /** The `[url, target]` pairs passed to `window.open` since `recordWindowOpen()`. */
  async openedUrls(): Promise<[string, string][]> {
    return this.page.evaluate(() => (window as any).__opened as [string, string][]);
  }

  /**
   * Select a cell through the API. A mouse click would have to miss the anchor, and the prose cells
   * here wrap onto several lines, so there is no reliable anchor-free spot to click.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      (window as any).hot.selectCell(r, c);
    }, [row, col] as [number, number]);
    await expect(this.selectedCoords()).resolves.toEqual([row, col]);
  }

  /** The coordinates of the currently highlighted cell. */
  async selectedCoords(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const highlight = (window as any).hot.getSelectedRangeActive()?.highlight;

      return highlight ? [highlight.row, highlight.col] : null;
    });
  }

  /** Record the `Alt`+`Enter` keydown events that reach the document and whether they were prevented. */
  async recordHostAltEnter(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__altEnter = [];
      document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key === 'Enter') {
          (window as any).__altEnter.push(event.defaultPrevented);
        }
      });
    });
  }

  /** The `Alt`+`Enter` events that reached the document since `recordHostAltEnter()`. */
  async hostAltEnterEvents(): Promise<boolean[]> {
    return this.page.evaluate(() => (window as any).__altEnter as boolean[]);
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
