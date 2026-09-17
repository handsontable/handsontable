import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle, BUNDLE_POLLING_MS } from '../bundle';

/**
 * Page Object for the fixture that starts with NestedRows turned OFF (DEV-2938).
 *
 * The plugin is switched on with `updateSettings()` from the spec, which is the path an app
 * takes when nesting is a user-toggled feature - and the one the React wrapper takes on its
 * first commit that carries `nestedRows`.
 */
export class NestedRowsRuntimeEnablePage {
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
   * Navigate to the fixture and wait for the grid to render.
   *
   * `data: 'arrays'` seeds an array-of-arrays dataset, which the plugin cannot work with.
   */
  async goto(options: { data?: 'objects' | 'arrays', size?: 'small' | 'tall' } = {}): Promise<void> {
    const dataShape = options.data ? `&data=${options.data}` : '';
    const size = options.size ? `&size=${options.size}` : '';

    await this.page.goto(
      `/tests/fixtures/demo/nested-rows-runtime-enable.html?theme=${this.theme}&bundle=${this.bundle}${dataShape}${size}`
    );

    await awaitBundle(this.page);

    const fixtureError = await this.page.evaluate(() => window.htFixtureError);

    if (fixtureError) {
      throw new Error(`The fixture grid failed to build: ${fixtureError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The names the grid has actually PAINTED, read off the master table.
   *
   * The row count and the cell values both come from the plugin's own model, so they report a
   * flattened tree whether or not the grid ever redrew. Only the DOM proves the user can see it.
   *
   * `first-of-type`, not `first-child`: the fixture renders row headers, so each row opens with a
   * `th` and a `first-child` match finds nothing at all.
   */
  paintedNames(): Locator {
    return this.page.locator('.ht_master tbody tr td:first-of-type');
  }

  /** Whether an editor is currently open over the grid. */
  isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const editor = window.hot.getActiveEditor();

      return editor ? editor.isOpened() : false;
    });
  }

  /** The active selection, as `[rowStart, colStart, rowEnd, colEnd]`, or `null` when there is none. */
  selection(): Promise<number[] | null> {
    return this.page.evaluate(() => window.hot.getSelectedLast() ?? null);
  }

  /**
   * Turns the plugin on or off the way an app toggling the feature does, and waits for the grid to
   * have drawn the row count that follows from it.
   *
   * The wait is the point: the toggle changes how many rows exist, and a caller that reads the DOM
   * without an auto-retrying assertion would otherwise race the draw.
   */
  async setNestedRows(value: boolean): Promise<void> {
    const drawsBefore = await this.renderCount();

    await this.page.evaluate(enabled => window.hot.updateSettings({ nestedRows: enabled }), value);

    // Waits for a draw rather than for a row count: on a grid taller than its viewport the master
    // only ever holds the rendered band, so comparing it against `countRows()` never settles.
    await this.page.waitForFunction(
      drawn => (window.renderCount ?? 0) > drawn, drawsBefore, { polling: BUNDLE_POLLING_MS }
    );
  }

  /** The text of the first column, top to bottom - what the user actually sees. */
  visibleNames(): Promise<string[]> {
    return this.page.evaluate(() => {
      const rows: string[] = [];

      for (let row = 0; row < window.hot.countRows(); row++) {
        rows.push(String(window.hot.getDataAtCell(row, 0)));
      }

      return rows;
    });
  }

  /** Whether the plugin reports itself as running. */
  isPluginEnabled(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').enabled);
  }

  /** Physical row indexes of the parents that are collapsed right now. */
  collapsedParents(): Promise<number[]> {
    return this.page.evaluate(() => window.hot.getPlugin('nestedRows').getCollapsedParents());
  }

  /** Collapses one parent through the public API, by visual row index. */
  collapseParent(row: number): Promise<boolean> {
    return this.page.evaluate(
      visualRow => window.hot.getPlugin('nestedRows').collapseParent(visualRow), row
    );
  }

  /** Expands one parent through the public API, by visual row index. */
  expandParent(row: number): Promise<boolean> {
    return this.page.evaluate(
      visualRow => window.hot.getPlugin('nestedRows').expandParent(visualRow), row
    );
  }

  /** Selects a range by its corners. */
  async selectRange(row: number, col: number, row2: number, col2: number): Promise<void> {
    await this.page.evaluate(
      corners => window.hot.selectCells([corners]), [row, col, row2, col2]
    );
  }

  /** Opens the editor over one cell, the way a double click or Enter would. */
  async openEditor(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ r, c }) => {
      window.hot.selectCell(r, c);
      window.hot.getActiveEditor()?.beginEditing();
    }, { r: row, c: col });
  }

  /**
   * The rendered width of the first row header, and the width the plugin asked for.
   *
   * They have to agree: the plugin sizes the header from the tree's depth to fit its indentation
   * and its collapse button, and a `null` cache silently leaves the header at the grid default.
   */
  rowHeaderWidths(): Promise<{ rendered: number, requested: number | null }> {
    return this.page.evaluate(() => {
      const header = window.hot.rootElement.querySelector('.ht_clone_inline_start tbody tr th');
      // `headersUI` only exists while the plugin runs, so this reads `null` before the first enable.
      const headersUI = window.hot.getPlugin('nestedRows').headersUI;

      return {
        rendered: Math.round((header as HTMLElement).getBoundingClientRect().width),
        requested: headersUI ? headersUI.rowHeaderWidthCache : null,
      };
    });
  }

  /** Scrolls the viewport to a row and returns where the master holder ended up. */
  async scrollToRow(row: number): Promise<number> {
    return this.page.evaluate((target) => {
      window.hot.scrollViewportTo({ row: target });

      const holder = window.hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;

      return holder.scrollTop;
    }, row);
  }

  /** The master holder's current vertical scroll offset. */
  scrollTop(): Promise<number> {
    return this.page.evaluate(() => {
      const holder = window.hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;

      return holder.scrollTop;
    });
  }

  /** How many times the grid has drawn since the fixture loaded. */
  renderCount(): Promise<number> {
    return this.page.evaluate(() => window.renderCount ?? 0);
  }

  /** Writes a value, then undoes it, the way Ctrl+Z would. */
  async undo(): Promise<void> {
    await this.page.evaluate(() => window.hot.getPlugin('undoRedo').undo());
  }

  /** What the grid currently holds for the `nestedRows` setting - the plugin's public answer. */
  nestedRowsSetting(): Promise<unknown> {
    return this.page.evaluate(() => window.hot.getSettings().nestedRows);
  }

  /** Writes a value into a cell, by visual row/column. */
  async setCell(row: number, col: number, value: string): Promise<void> {
    await this.page.evaluate(
      ({ r, c, v }) => window.hot.setDataAtCell(r, c, v), { r: row, c: col, v: value }
    );
  }

  /**
   * Reads the names out of the array the fixture passed to the constructor and still holds a
   * reference to - what an app's own state, or a React `data` prop, would see.
   */
  callerDataNames(): Promise<{ parent: unknown, child: unknown }> {
    return this.page.evaluate(() => {
      const root = (window.sourceData ?? [])[0] as { name: unknown, __children: { name: unknown }[] };

      return { parent: root.name, child: root.__children[0].name };
    });
  }

  /** Everything the page logged through `console.error`, in order. */
  consoleErrors(): Promise<string[]> {
    return this.page.evaluate(() => window.consoleErrors ?? []);
  }
}
