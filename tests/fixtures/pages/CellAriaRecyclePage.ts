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
  updateSettings(settings: Record<string, unknown>): void;
  selectCell(row: number, column: number): boolean;
  setCellMeta(row: number, column: number, key: string, value: unknown): void;
  loadData(data: unknown[][]): void;
  setDataAtCell(row: number, column: number, value: unknown): void;
  addHook(name: string, callback: () => void): void;
  removeHook(name: string, callback: () => void): void;
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
  roleMutations?: RoleMutation[];
  roleObserver?: MutationObserver;
  collectRoleRecords?: (records: MutationRecord[]) => void;
};

/**
 * One write of a master cell's `role`. `removed` is `true` for the removal and `false` for the write that
 * follows; `focused` says whether the cell held the focus when the observer delivered it.
 */
export type RoleMutation = { tag: 'TD' | 'TH'; focused: boolean; removed: boolean };

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
   * Calls `updateSettings()` on the grid.
   *
   * @param {object} settings JSON-serializable settings.
   */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate(
      nextSettings => (window as unknown as FixtureWindow).hot.updateSettings(nextSettings),
      settings,
    );
  }

  /**
   * Counts the `afterGetRowHeaderRenderers` calls one `render()` makes, and the master cells it renders.
   *
   * @returns {Promise<{ hookCalls: number, masterCells: number }>}
   */
  async countRowHeaderRenderersHookCalls(): Promise<{ hookCalls: number; masterCells: number }> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      let hookCalls = 0;
      const count = () => {
        hookCalls += 1;
      };

      hot.addHook('afterGetRowHeaderRenderers', count);
      hot.render();
      hot.removeHook('afterGetRowHeaderRenderers', count);

      return { hookCalls, masterCells: hot.rootElement.querySelectorAll('.ht_master tbody td').length };
    });
  }

  /**
   * Reads every column header id in the grid and every data cell's `aria-describedby`, across all
   * overlays.
   *
   * @returns {Promise<{ duplicateIds: string[], unresolved: string[], references: number }>}
   */
  async columnHeaderReferences(): Promise<{ duplicateIds: string[]; unresolved: string[]; references: number }> {
    return this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;
      const prefix = `${hot.guid}-colheader-`;
      const ids = [...document.querySelectorAll(`[id^="${prefix}"]`)].map(element => element.id);
      const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      const references = [...hot.rootElement.querySelectorAll('td[aria-describedby]')]
        .map(td => td.getAttribute('aria-describedby') ?? '');
      const unresolved = [...new Set(references.filter(id => document.querySelectorAll(`[id="${id}"]`).length !== 1))];

      return { duplicateIds, unresolved, references: references.length };
    });
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
   * Reads the accessibility attributes of the corner header in the master table's last head row.
   *
   * @returns {Promise<AriaAttributes | null>}
   */
  async masterCorner(): Promise<AriaAttributes | null> {
    return this.page.evaluate(() => {
      const { hot, readAria } = window as unknown as FixtureWindow;
      const corner = hot.rootElement.querySelector('.ht_master thead tr:last-child th:first-child');

      return corner ? readAria(corner) : null;
    });
  }

  /**
   * Lists every attribute name, on any cell or header of the grid, that contains `aria-` or `role`, or is
   * `id` on a header.
   *
   * @param {string} selector The elements to read, within the grid.
   * @returns {Promise<string[]>}
   */
  async ariaAttributeNamesAnywhere(selector = 'td, th'): Promise<string[]> {
    return this.page.evaluate((elementSelector) => {
      const { hot } = window as unknown as FixtureWindow;
      const names = new Set<string>();

      hot.rootElement.querySelectorAll(elementSelector).forEach((element) => {
        element.getAttributeNames().forEach((name) => {
          if (name.includes('aria-') || name.includes('role') || (name === 'id' && element.tagName === 'TH')) {
            names.add(name);
          }
        });
      });

      return [...names].sort();
    }, selector);
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
   * Starts recording every write of an accessibility attribute core owns (`role`, `tabindex`, `scope`,
   * `aria-colindex`, `aria-describedby`, `aria-label`) on a master cell or header that exists now and that
   * column B's custom branch never painted. A removal and a write of the same value are mutations too, so a
   * redraw that rewrites what an element already carries is counted. Elements the draw creates (a taller
   * band) are left out: their first write is not a rewrite. Attributes a renderer adds itself (the header
   * renderer's `aria-x`) are cleared and set again on every paint by design, so they are not counted.
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
            ['role', 'tabindex', 'scope', 'aria-colindex', 'aria-describedby', 'aria-label'].includes(name) &&
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

  /**
   * Selects a cell through the API and reports whether a master cell now holds the browser focus.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<boolean>}
   */
  async selectCell(row: number, column: number): Promise<boolean> {
    return this.page.evaluate(([targetRow, targetColumn]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.selectCell(targetRow, targetColumn);

      const active = document.activeElement;

      return ['TD', 'TH'].includes(active?.tagName ?? '') && hot.rootElement.contains(active);
    }, [row, column]);
  }

  /**
   * Turns a cell into a checkbox cell with the given value.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @param {boolean} checked The value.
   */
  async makeCheckboxCell(row: number, column: number, checked: boolean): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn, value]) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.setCellMeta(targetRow as number, targetColumn as number, 'type', 'checkbox');
      hot.setDataAtCell(targetRow as number, targetColumn as number, value);
    }, [row, column, checked]);
  }

  /**
   * Sets a cell's value through the API.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @param {string} value The value.
   */
  async setData(row: number, column: number, value: string): Promise<void> {
    await this.page.evaluate(([targetRow, targetColumn, nextValue]) => {
      (window as unknown as FixtureWindow).hot
        .setDataAtCell(targetRow as number, targetColumn as number, nextValue);
    }, [row, column, value]);
  }

  /**
   * Starts recording every write of `role` on a master cell, with the old value, and whether the cell held
   * the focus when the write was delivered.
   */
  async startRoleRecorder(): Promise<void> {
    await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const { rootElement } = fixtureWindow.hot;

      fixtureWindow.roleObserver?.disconnect();
      fixtureWindow.roleMutations = [];
      fixtureWindow.collectRoleRecords = (records) => {
        records.forEach((record) => {
          const target = record.target as Element;

          // Column B's custom renderer writes its own role on every paint of the rows it takes.
          if (['TD', 'TH'].includes(target.tagName) && !fixtureWindow.customPainted.has(target)) {
            fixtureWindow.roleMutations!.push({
              tag: target.tagName as 'TD' | 'TH',
              focused: target === document.activeElement,
              removed: record.oldValue !== null,
            });
          }
        });
      };
      fixtureWindow.roleObserver = new MutationObserver(records => fixtureWindow.collectRoleRecords!(records));
      fixtureWindow.roleObserver.observe(rootElement, {
        attributes: true,
        attributeFilter: ['role'],
        attributeOldValue: true,
        subtree: true,
      });
    });
  }

  /**
   * Stops the recorder and returns what it recorded.
   *
   * @returns {Promise<RoleMutation[]>}
   */
  async takeRoleMutations(): Promise<RoleMutation[]> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const observer = fixtureWindow.roleObserver;

      if (observer) {
        // Records not delivered yet go through the same filter as delivered ones.
        fixtureWindow.collectRoleRecords!(observer.takeRecords());
        observer.disconnect();
        fixtureWindow.roleObserver = undefined;
      }

      return fixtureWindow.roleMutations ?? [];
    });
  }

  /**
   * Counts the cells the master renders, leaving out the ones column B's custom renderer paints.
   *
   * @returns {Promise<number>}
   */
  async countPlainMasterCells(): Promise<number> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;

      return Array.from(fixtureWindow.hot.rootElement.querySelectorAll('.ht_master tbody td'))
        .filter(cell => !fixtureWindow.customPainted.has(cell)).length;
    });
  }

  /**
   * Loads a spreadsheet of the given size and gives the grid a small viewport, so that a jump to the last row
   * reaches rows the grid renders only then.
   *
   * @param {number} rows The row count.
   * @param {number} columns The column count.
   * @param {number} height The grid height in pixels.
   */
  async loadSmallViewportSpreadsheet(rows: number, columns: number, height: number): Promise<void> {
    await this.page.evaluate(([rowCount, columnCount, gridHeight]) => {
      const { hot } = window as unknown as FixtureWindow;
      const { Handsontable } = window as unknown as {
        Handsontable: { helper: { createSpreadsheetData(rows: number, columns: number): unknown[][] } };
      };

      hot.updateSettings({ height: gridHeight });
      hot.loadData(Handsontable.helper.createSpreadsheetData(rowCount, columnCount));
    }, [rows, columns, height]);
  }
}
