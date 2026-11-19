import { type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * The accessibility-related attributes of one element: every attribute whose name contains `aria-` or
 * `role` (the names the renderers clear on a recycled element), plus `tabindex`, `scope` and `id`.
 */
export type AriaAttributes = Record<string, string>;

export type CellAria = {
  row: number;
  attributes: AriaAttributes;
  // Whether the custom branch of column B's renderer painted this element at some point.
  customPainted: boolean;
  // What the cell's `aria-describedby` resolves to: the number of elements with that id and the text of
  // the first one.
  describedBy: { count: number; text: string | null };
};

export type HeaderAria = {
  column: number;
  label: string;
  attributes: AriaAttributes;
};

type HotLike = {
  guid: string;
  getCoords(element: Element): { row: number; col: number } | null;
  getColHeader(column: number): string;
  scrollViewportTo(options: Record<string, unknown>): boolean;
  render(): void;
  rootElement: HTMLElement;
  view: {
    getFirstRenderedVisibleRow(): number;
    getLastRenderedVisibleRow(): number;
    getFirstRenderedVisibleColumn(): number;
    getLastRenderedVisibleColumn(): number;
  };
};

type FixtureWindow = Window & {
  hot: HotLike;
  customPainted: WeakSet<Element>;
  entryStates: { row: number; attributes: AriaAttributes }[];
  readAria(element: Element): AriaAttributes;
  ariaMutations?: { attribute: string; tag: string }[];
  ariaObserver?: MutationObserver;
  handleAriaRecords?: (records: MutationRecord[]) => void;
};

/**
 * Page Object for the cell ARIA recycle fixture.
 *
 * Every read happens inside one `evaluate`, because the grid recycles its TD and TH elements: an
 * element resolved before a draw shows another cell after it.
 */
export class CellAriaRecyclePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigates to the fixture and waits for the grid.
   *
   * @param {object} settings JSON-serializable settings merged over the fixture defaults.
   */
  async goto(settings: Record<string, unknown> = {}): Promise<void> {
    const query = new URLSearchParams({
      theme: this.theme,
      bundle: this.bundle,
      settings: JSON.stringify(settings),
    });

    await this.page.goto(`/tests/fixtures/demo/cell-aria-recycle.html?${query}`);
    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
    }

    await expect(this.page.getByTestId('grid-root')).toBeVisible();
  }

  /**
   * Scrolls the viewport so the row is at its top, and waits until the master renders it.
   *
   * @param {number} row The visual row index.
   */
  async scrollToRow(row: number): Promise<void> {
    await this.page.evaluate((targetRow) => {
      (window as unknown as FixtureWindow).hot.scrollViewportTo({ row: targetRow, verticalSnap: 'top' });
    }, row);
    await expect.poll(() => this.page.evaluate((targetRow) => {
      const { view } = (window as unknown as FixtureWindow).hot;

      return view.getFirstRenderedVisibleRow() <= targetRow && view.getLastRenderedVisibleRow() >= targetRow;
    }, row)).toBe(true);
  }

  /**
   * Scrolls the viewport so the column is at its start, and waits until the master renders it.
   *
   * @param {number} column The visual column index.
   */
  async scrollToColumn(column: number): Promise<void> {
    await this.page.evaluate((targetColumn) => {
      (window as unknown as FixtureWindow).hot.scrollViewportTo({ col: targetColumn, horizontalSnap: 'start' });
    }, column);
    await expect.poll(() => this.page.evaluate((targetColumn) => {
      const { view } = (window as unknown as FixtureWindow).hot;

      return view.getFirstRenderedVisibleColumn() <= targetColumn &&
        view.getLastRenderedVisibleColumn() >= targetColumn;
    }, column)).toBe(true);
  }

  /**
   * Calls `render()` on the grid.
   */
  async render(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.render());
  }

  /**
   * Reads the master table's cells of one column.
   *
   * @param {number} column The visual column index.
   * @returns {Promise<CellAria[]>}
   */
  async columnCells(column: number): Promise<CellAria[]> {
    return this.page.evaluate((targetColumn) => {
      const { hot, customPainted, readAria } = window as unknown as FixtureWindow;
      const cells: CellAria[] = [];

      hot.rootElement.querySelectorAll('.ht_master tbody td').forEach((td) => {
        const coords = hot.getCoords(td);

        if (!coords || coords.col !== targetColumn) {
          return;
        }

        const describedById = td.getAttribute('aria-describedby');
        const described = describedById ? document.querySelectorAll(`[id="${describedById}"]`) : [];

        cells.push({
          row: coords.row,
          attributes: readAria(td),
          customPainted: customPainted.has(td),
          describedBy: {
            count: described.length,
            text: described.length > 0 ? (described[0].textContent ?? '').trim() : null,
          },
        });
      });

      return cells;
    }, column);
  }

  /**
   * Reads the master table's leaf column headers and the prefix of the ids they carry.
   *
   * @returns {Promise<{ idPrefix: string, headers: HeaderAria[] }>}
   */
  async masterColumnHeaders(): Promise<{ idPrefix: string; headers: HeaderAria[] }> {
    return this.page.evaluate(() => {
      const { hot, readAria } = window as unknown as FixtureWindow;
      const headers: HeaderAria[] = [];

      // The fixture has one row header column, so the first cell of the head row is the corner.
      hot.rootElement.querySelectorAll('.ht_master thead tr:last-child th:not(:first-child)').forEach((th) => {
        const coords = hot.getCoords(th);

        if (coords && coords.col >= 0) {
          headers.push({ column: coords.col, label: hot.getColHeader(coords.col), attributes: readAria(th) });
        }
      });

      return { idPrefix: `${hot.guid}-colheader-`, headers };
    });
  }

  /**
   * Reads the accessibility attributes of the corner header the grid shows (the top inline-start corner
   * clone) and of every row header the master renders.
   *
   * @returns {Promise<{ corner: AriaAttributes | null, rowHeaders: AriaAttributes[] }>}
   */
  async cornerAndRowHeaders(): Promise<{ corner: AriaAttributes | null; rowHeaders: AriaAttributes[] }> {
    return this.page.evaluate(() => {
      const { hot, readAria } = window as unknown as FixtureWindow;
      const corner = hot.rootElement.querySelector('.ht_clone_top_inline_start_corner thead th');

      return {
        corner: corner ? readAria(corner) : null,
        rowHeaders: [...hot.rootElement.querySelectorAll('.ht_master tbody th')].map(readAria),
      };
    });
  }

  /**
   * Lists every attribute name, on any cell or header of the grid, that contains `aria-` or `role`, or is
   * `id` on a header.
   *
   * @returns {Promise<string[]>}
   */
  async ariaAttributeNamesAnywhere(): Promise<string[]> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const names = new Set<string>();

      hot.rootElement.querySelectorAll('td, th').forEach((element) => {
        element.getAttributeNames().forEach((name) => {
          if (name.includes('aria-') || name.includes('role') || (name === 'id' && element.tagName === 'TH')) {
            names.add(name);
          }
        });
      });

      return [...names].sort();
    });
  }

  /**
   * Reads what each column C cell carried when its renderer started, and clears the record.
   *
   * @returns {Promise<{ row: number, attributes: AriaAttributes }[]>}
   */
  async takeEntryStates(): Promise<{ row: number; attributes: AriaAttributes }[]> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const states = fixtureWindow.entryStates;

      fixtureWindow.entryStates = [];

      return states;
    });
  }

  /**
   * Starts recording every write of an accessibility attribute (`role`, `aria-*`, `tabindex`, `scope`)
   * on a master cell or header that exists now and that column B's custom branch never painted. A removal
   * and a write of the same value are mutations too, so a redraw that rewrites what an element already
   * carries is counted. Elements the draw creates (a taller band) are left out: their first write is not
   * a rewrite.
   */
  async startAriaMutationCounter(): Promise<void> {
    await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const master = fixtureWindow.hot.rootElement.querySelector('.ht_master')!;
      const tracked = new WeakSet<Element>();

      master.querySelectorAll('td, th').forEach((element) => {
        if (!fixtureWindow.customPainted.has(element)) {
          tracked.add(element);
        }
      });
      fixtureWindow.ariaObserver?.disconnect();
      fixtureWindow.ariaMutations = [];
      fixtureWindow.handleAriaRecords = (records) => {
        records.forEach((record) => {
          const name = record.attributeName ?? '';
          const target = record.target as Element;

          if (
            (name.includes('aria-') || name.includes('role') || name === 'tabindex' || name === 'scope') &&
            tracked.has(target) && !fixtureWindow.customPainted.has(target)
          ) {
            fixtureWindow.ariaMutations!.push({ attribute: name, tag: target.tagName });
          }
        });
      };
      fixtureWindow.ariaObserver = new MutationObserver(records => fixtureWindow.handleAriaRecords!(records));
      fixtureWindow.ariaObserver.observe(master, { attributes: true, subtree: true });
    });
  }

  /**
   * Stops the counter and returns what it recorded.
   *
   * @returns {Promise<{ attribute: string, tag: string }[]>}
   */
  async takeAriaMutations(): Promise<{ attribute: string; tag: string }[]> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const observer = fixtureWindow.ariaObserver;

      if (observer) {
        // Records not delivered yet go through the same filter as delivered ones.
        fixtureWindow.handleAriaRecords!(observer.takeRecords());
        observer.disconnect();
        fixtureWindow.ariaObserver = undefined;
      }

      return fixtureWindow.ariaMutations ?? [];
    });
  }
}
