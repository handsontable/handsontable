import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';
import './windowTypes';
import { chromiumAccessibility } from '../accessibility';

/**
 * Page Object for the cell description fixture. Row 0 holds a plain value (A1), a read-only cell (B1), a
 * link (C1) and a read-only formula (D1); A2:B3 is one merged block.
 */
export class CellDescriptionPage {
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
   * Navigate to the fixture and wait until the engine has evaluated the formula. `ariaTags` is an init-only
   * option, so a grid without ARIA attributes is built that way.
   */
  async goto(options: {
    ariaTags?: 'on' | 'off',
    render?: 'default' | 'onChange',
    comment?: 'on' | 'off',
    readonlygrid?: 'on' | 'off',
    headers?: 'on' | 'off',
    dir?: 'ltr' | 'rtl',
  } = {}): Promise<void> {
    const { ariaTags = 'on', render = 'default', comment = 'off', readonlygrid = 'off', headers = 'on',
      dir = 'ltr' } = options;

    await this.page.goto(
      `/tests/fixtures/demo/cell-description.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&ariaTags=${ariaTags}&render=${render}&comment=${comment}&readonlygrid=${readonlygrid}&headers=${headers}&dir=${dir}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 3)).toHaveText('3');
  }

  /**
   * A single data cell, by visual row/column, via its stable test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The name and the description Chromium's own accessibility tree gives a cell, which is what a screen reader on
   * Chromium reads from it (Playwright's `toHaveAccessibleName()` computes them from the DOM and the styles instead).
   */
  async chromiumAccessibility(row: number, col: number): Promise<{ name: string; description: string }> {
    const { name, description } = await chromiumAccessibility(this.page, `[data-testid="cell-${row}-${col}"]`);

    return { name: name.trim(), description: description.trim() };
  }

  /**
   * The text of the hidden elements a cell points at through `aria-describedby`, one string per element, read from
   * the DOM. The first one of a cell with a column header is the header's own.
   */
  async describedByTexts(row: number, col: number): Promise<string[]> {
    return this.cell(row, col).evaluate((td) => {
      return (td.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map((id) => {
        return td.ownerDocument.getElementById(id)?.textContent?.trim() ?? '';
      });
    });
  }

  /**
   * Make a cell read only, or editable again, through the cell meta, and render.
   */
  async setReadOnly(row: number, col: number, readOnly: boolean): Promise<void> {
    await this.page.evaluate(([r, c, value]) => {
      window.hot.setCellMeta(r, c, 'readOnly', value);
      window.hot.render();
    }, [row, col, readOnly] as [number, number, boolean]);
  }

  /**
   * Switch the grid to another language pack.
   */
  async setLanguage(languageCode: string, phrases: Record<string, string>): Promise<void> {
    await this.page.evaluate(([code, dictionary]) => {
      const hotClass = (window as any).Handsontable;

      hotClass.languages.registerLanguageDictionary({ languageCode: code, ...dictionary });
      window.hot.updateSettings({ language: code });
    }, [languageCode, phrases] as [string, Record<string, string>]);
  }

  /**
   * Call a method of a plugin by its key.
   */
  async callPlugin(plugin: string, method: string): Promise<void> {
    await this.page.evaluate(([key, name]) => {
      (window.hot.getPlugin(key as any) as any)[name]();
      window.hot.render();
    }, [plugin, method] as [string, string]);
  }

  /**
   * Unmerge the block of the fixture (A2:B3), or merge it again, and render.
   */
  async setMerged(merged: boolean): Promise<void> {
    await this.page.evaluate((value) => {
      const plugin = window.hot.getPlugin('mergeCells') as any;

      if (value) {
        plugin.merge(1, 0, 2, 1);
      } else {
        plugin.unmerge(1, 0, 2, 1);
      }

      window.hot.render();
    }, merged);
  }

  /**
   * Fill the grid with many rows and count the writes to the `aria-describedby` of its cells while it repaints
   * unchanged and while it scrolls down and back over recycled cells. A warm-up pass first paints every cell the
   * scroll reaches, so a cell that is new is not counted.
   */
  async countDescribedByWrites(): Promise<{ repaint: number; scroll: number }> {
    return this.page.evaluate(async() => {
      const hot = window.hot;
      const data = Array.from({ length: 300 }, (_, r) => Array.from({ length: 4 }, (_, c) => `r${r}c${c}`));

      hot.updateSettings({ data, mergeCells: false, autoLink: false, formulas: false, height: 200 });
      hot.render();
      hot.scrollViewportTo({ row: 250 });
      hot.scrollViewportTo({ row: 0 });
      hot.render();

      const observer = new MutationObserver(() => {});

      observer.observe(hot.rootElement, { attributes: true, attributeFilter: ['aria-describedby'], subtree: true });
      hot.render();

      const repaint = observer.takeRecords().length;

      hot.scrollViewportTo({ row: 250 });
      hot.scrollViewportTo({ row: 0 });
      hot.render();

      const scroll = observer.takeRecords().length;

      observer.disconnect();

      return { repaint, scroll };
    });
  }
}

