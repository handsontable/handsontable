import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The fixture's options, the visual suite's `/empty-data-state-demo` route params by another name.
 */
export interface EmptyDataStateOptions {
  /**
   * `400` px, `auto`, or `undefined` to leave `height` out of the settings. `400` when omitted.
   */
  height?: '400' | 'auto' | 'undefined';
  noColumns?: boolean;
  dir?: 'ltr' | 'rtl';
}

/**
 * A box in viewport coordinates, as `getBoundingClientRect()` reports it.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * The message panel, its content, the grid's root and its column header row, read in one evaluation.
 */
export interface PanelGeometry {
  panel: Box;
  /**
   * The texts and, when there are any, the buttons below them.
   */
  content: Box;
  /**
   * The title's and the description's text as the browser laid them out (`Range` boxes, so they move
   * with `text-align`), and the first button, or `null` without one.
   */
  titleText: Box;
  descriptionText: Box;
  button: Box | null;
  root: Box;
  /**
   * The master column header row (`thead` of the top overlay), or `null` with no columns.
   */
  headers: Box | null;
  /**
   * The cells of the top overlay's header row, and how many of them carry a column label (the corner's
   * `span.colHeader` is empty).
   */
  headerCellCount: number;
  columnLabelCount: number;
  disablesTopBorder: boolean;
}

/**
 * Page object for `fixtures/demo/empty-data-state-layout.html`, a grid with no rows configured as the
 * visual suite's `/empty-data-state-demo` route configures it.
 */
export class EmptyDataStateLayoutPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly panel: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly dropdownMenu: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.panel = page.locator('.ht-empty-data-state');
    this.title = this.panel.locator('.ht-empty-data-state__title');
    this.description = this.panel.locator('.ht-empty-data-state__description');
    // The dropdown menu root, not its submenus, which carry the same class.
    this.dropdownMenu = page.locator('.htDropdownMenu:not([class*="htDropdownMenuSub_"])');
  }

  /**
   * Opens the fixture with the given options and waits for the message.
   *
   * @param {EmptyDataStateOptions} options The fixture's options.
   */
  async goto(options: EmptyDataStateOptions = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.height) {
      params.set('height', options.height);
    }
    if (options.noColumns !== undefined) {
      params.set('nocolumns', options.noColumns ? '1' : '0');
    }
    if (options.dir) {
      params.set('dir', options.dir);
    }

    await this.page.goto(`/tests/fixtures/demo/empty-data-state-layout.html?${params}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.panel).toBeVisible();
  }

  /**
   * A column header in the top overlay, by its label.
   *
   * @param {string} label The header's text.
   * @returns {Locator}
   */
  columnHeader(label: string): Locator {
    return this.page.locator('.ht_clone_top thead th').filter({ hasText: label });
  }

  /**
   * A button inside the message panel, by its label.
   *
   * @param {string} name The button's text.
   * @returns {Locator}
   */
  button(name: string): Locator {
    return this.panel.getByRole('button', { name, exact: true });
  }

  /**
   * The grid's selection, as `getSelected()` returns it.
   *
   * @returns {Promise<number[][] | undefined>}
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as { hot: { getSelected(): number[][] | undefined } })
      .hot.getSelected());
  }

  /**
   * The filter conditions the Filters plugin holds.
   *
   * @returns {Promise<unknown[]>}
   */
  async filterConditions(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as {
      hot: { getPlugin(name: string): { exportConditions(): unknown[] } };
    }).hot.getPlugin('filters').exportConditions());
  }

  /**
   * Filters every value of the first column out through the Filters API, which reaches the no-results
   * state without the dropdown menu (the keyboard path to it has its own test).
   */
  async filterOutEveryValue(): Promise<void> {
    await this.page.evaluate(() => {
      const filters = (window as unknown as {
        hot: { getPlugin(name: string): { addCondition(column: number, name: string, args: unknown[]): void; filter(): void } };
      }).hot.getPlugin('filters');

      filters.addCondition(0, 'by_value', [[]]);
      filters.filter();
    });
  }

  /**
   * Reads the panel, its content, the root and the column header row in one evaluation.
   *
   * @returns {Promise<PanelGeometry>}
   */
  async geometry(): Promise<PanelGeometry> {
    return this.page.evaluate(() => {
      const box = (element: Element | Range) => {
        const rect = element.getBoundingClientRect();

        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      };
      const textBox = (element: Element) => {
        const range = document.createRange();

        range.selectNodeContents(element);

        return box(range);
      };
      const panel = document.querySelector('.ht-empty-data-state') as HTMLElement;
      const button = panel.querySelector('.ht-empty-data-state__buttons button');
      const hot = (window as unknown as { hot: { rootElement: HTMLElement; countCols(): number } }).hot;
      const headers = hot.countCols() > 0 ? document.querySelector('.ht_clone_top thead') : null;
      // The texts and the buttons row are siblings, so the visible content is the union of the two.
      const content = [panel.querySelector('.ht-empty-data-state__content'), panel.querySelector('.ht-empty-data-state__buttons')]
        .filter((element): element is Element => element !== null && element.getBoundingClientRect().height > 0)
        .map(box)
        .reduce((union, next) => ({
          left: Math.min(union.left, next.left),
          top: Math.min(union.top, next.top),
          right: Math.max(union.right, next.right),
          bottom: Math.max(union.bottom, next.bottom),
        }));

      return {
        panel: box(panel),
        content,
        titleText: textBox(panel.querySelector('.ht-empty-data-state__title') as Element),
        descriptionText: textBox(panel.querySelector('.ht-empty-data-state__description') as Element),
        button: button ? box(button) : null,
        root: box(hot.rootElement),
        headers: headers ? box(headers) : null,
        headerCellCount: document.querySelectorAll('.ht_clone_top thead th').length,
        columnLabelCount: [...document.querySelectorAll('.ht_clone_top thead th span.colHeader')]
          .filter(label => label.textContent!.trim() !== '').length,
        disablesTopBorder: panel.classList.contains('ht-empty-data-state--disable-top-border'),
      };
    });
  }
}
