import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

type Settings = Record<string, unknown>;

/**
 * The fixture's globals. Not `extends Window`: `windowTypes.ts` already declares `hot` globally with the
 * full instance type, so every access is cast.
 */
interface FixtureWindow {
  hot: {
    rootElement: HTMLElement;
    view: { getRowHeadersCount(): number };
    updateSettings(settings: Settings): void;
    render(): void;
    scrollViewportTo(coords: { col: number; horizontalSnap: 'start' }): boolean;
    getFirstRenderedVisibleColumn(): number | null;
  };
}

export type CornerFixturePlugin = 'dropdownMenu' | 'filters' | 'columnSorting' | 'multiColumnSorting' |
  'hiddenColumns' | 'checkboxHeader' | 'rowSelectionColumn' | 'rowSelection';

/**
 * Everything the header plugins draw: the elements and label classes they add inside a header cell, and
 * the classes and states they set on the cell itself.
 */
const PLUGIN_MARKUP_INSIDE = [
  '.changeType', '.columnSorting', '.sortAction', '.ascending', '.descending', '.ht-sort-indicator',
  '.ht-hidden-indicator-start', '.ht-hidden-indicator-end', '.htCheckboxHeaderBox', '.htRowSelectionCheckboxBox',
].join(', ');
const PLUGIN_MARKUP_ON_HEADER = [
  '.htFiltersActive', '.beforeHiddenColumn', '.afterHiddenColumn', '.htCheckboxHeader', '.htRowSelectionHeader',
  '[aria-sort]', '[aria-haspopup]',
].join(', ');

/**
 * Page Object for the column header corner fixture: one grid with one plugin that draws into column
 * headers, with twelve columns in a viewport that shows three.
 */
export class ColumnHeaderCornerMarkupPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture with one plugin, with or without row headers.
   */
  async goto(plugin: CornerFixturePlugin, { rowHeaders = true } = {}): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/column-header-corner-markup.html?theme=${this.theme}&bundle=${this.bundle}` +
      `&plugin=${plugin}&rowHeaders=${rowHeaders ? 1 : 0}`
    );
    await awaitBundle(this.page);
    await expect(this.grid().locator('.ht_clone_top thead th').first()).toBeVisible();
  }

  /**
   * Returns the grid's container.
   */
  grid(): Locator {
    return this.page.getByTestId('grid');
  }

  /**
   * Applies settings to the grid.
   */
  async updateSettings(settings: Settings): Promise<void> {
    await this.page.evaluate((update) => {
      (window as unknown as FixtureWindow).hot.updateSettings(update);
    }, settings);
  }

  /**
   * Lists the plugin markup found in the corner header cells of every table of the grid (the master and
   * each overlay), as `table: markup` strings. A corner is one of the row header columns a header row
   * starts with.
   */
  async cornerMarkup(): Promise<string[]> {
    return this.page.evaluate(([inside, onHeader]) => {
      const { hot } = window as unknown as FixtureWindow;
      const rowHeadersCount = hot.view.getRowHeadersCount();
      const found: string[] = [];

      hot.rootElement.querySelectorAll('thead tr').forEach((row) => {
        const table = row.closest('[class*="ht_clone_"], .ht_master')?.className.split(' ')[0];

        Array.from(row.children).slice(0, rowHeadersCount).forEach((corner) => {
          const markup = Array.from(corner.querySelectorAll(inside)).map(node => node.className);

          if (corner.matches(onHeader)) {
            markup.push(`th[${corner.className}${corner.hasAttribute('aria-sort') ? ' aria-sort' : ''}` +
              `${corner.hasAttribute('aria-haspopup') ? ' aria-haspopup' : ''}]`);
          }

          if (markup.length > 0) {
            found.push(`${table}: ${markup.join(' | ')}`);
          }
        });
      });

      return found;
    }, [PLUGIN_MARKUP_INSIDE, PLUGIN_MARKUP_ON_HEADER]);
  }

  /**
   * Counts the plugin markup in the column headers that are not corners, in every table of the grid.
   */
  async columnHeaderMarkupCount(): Promise<number> {
    return this.page.evaluate(([inside, onHeader]) => {
      const { hot } = window as unknown as FixtureWindow;
      const rowHeadersCount = hot.view.getRowHeadersCount();
      let count = 0;

      hot.rootElement.querySelectorAll('thead tr').forEach((row) => {
        Array.from(row.children).slice(rowHeadersCount).forEach((header) => {
          count += header.querySelectorAll(inside).length + (header.matches(onHeader) ? 1 : 0);
        });
      });

      return count;
    }, [PLUGIN_MARKUP_INSIDE, PLUGIN_MARKUP_ON_HEADER]);
  }

  /**
   * Scrolls the grid so that each of the given columns in turn starts the viewport, renders, and reads
   * the corner markup after each scroll. Returns, per column, the first rendered column and the markup.
   */
  async cornerMarkupWhileScrolledTo(columns: number[]): Promise<Array<{ firstRendered: number; markup: string[] }>> {
    const steps: Array<{ firstRendered: number; markup: string[] }> = [];

    for (const column of columns) {
      const firstRendered = await this.page.evaluate((col) => {
        const { hot } = window as unknown as FixtureWindow;

        hot.scrollViewportTo({ col, horizontalSnap: 'start' });
        hot.render();

        return hot.getFirstRenderedVisibleColumn() ?? -1;
      }, column);

      steps.push({ firstRendered, markup: await this.cornerMarkup() });
    }

    return steps;
  }

  /**
   * Lists the labels of the column headers that carry the corner's `cornerHeader` class without being a
   * corner, in every table of the grid.
   */
  async columnLabelsMarkedAsCorner(): Promise<string[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const rowHeadersCount = hot.view.getRowHeadersCount();
      const labels: string[] = [];

      hot.rootElement.querySelectorAll('thead tr').forEach((row) => {
        Array.from(row.children).slice(rowHeadersCount).forEach((header) => {
          const label = header.querySelector('.colHeader.cornerHeader');

          if (label) {
            labels.push(label.textContent ?? '');
          }
        });
      });

      return labels;
    });
  }
}
