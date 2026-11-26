import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * Page object for the DEV-2917 fixture: one grid with `emptyDataState`, `hiddenColumns` and undo.
 *
 * Cells are addressed by `data-testid="cell-<row>-<col>"`. The overlay itself has no test id, so it
 * is located by `.ht-empty-data-state`, the class the themes style it through — a public surface,
 * not a DOM shape the renderer is free to change.
 *
 * `window.hot` is declared once, in `windowTypes.ts`.
 */
export class EmptyDataStateShortcutsPage {
  /** The Playwright page the fixture is driven through. */
  readonly page: Page;
  /** The active theme, passed through to the fixture URL. */
  readonly theme: string;
  /** The active bundle, passed through to the fixture URL. */
  readonly bundle: string;
  /** Requests the browser could not complete, so a missing bundle names itself. */
  readonly failedRequests: string[] = [];

  /**
   * Wires up the page object for one theme/bundle leg and starts collecting failed requests, so a
   * bundle the server did not deliver surfaces as its own URL rather than as a mute timeout.
   */
  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    page.on('requestfailed', (request) => {
      this.failedRequests.push(`${request.url()} (${request.failure()?.errorText ?? 'unknown'})`);
    });
  }

  /**
   * Navigate to the fixture and wait for the grid to render.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/empty-data-state-shortcuts.html?theme=${this.theme}&bundle=${this.bundle}`);
    // The bundle is injected with `document.write`, so the page can be loaded while the constructor
    // is not there yet. Waiting on a cell instead would report "element(s) not found".
    try {
      await awaitBundle(this.page);
    } catch (error) {
      const reason = this.failedRequests.length > 0 ?
        `requests failed: ${this.failedRequests.join(', ')}` :
        'no request failed - the bundle evaluated too slowly';

      throw new Error(`The Handsontable bundle never evaluated (${reason}).`, { cause: error });
    }

    const fixtureError = await this.page.evaluate(() => window.htFixtureError ?? null);

    if (fixtureError !== null) {
      throw new Error(`The fixture failed to build the grid: ${fixtureError}`);
    }

    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** The empty-data-state overlay that covers the grid body. */
  get overlay(): Locator {
    return this.page.locator('.ht-empty-data-state').locator('visible=true');
  }

  /**
   * Builds a second grid with an empty data state on the page, with its own settings, and returns the
   * element of its message that takes the focus.
   *
   * @param {object} settings Setting overrides of the second grid, `ariaTags` for one.
   * @returns {Locator} The second grid's message element.
   */
  async buildSecondGrid(settings: Record<string, unknown> = {}): Promise<Locator> {
    await this.page.evaluate((overrides) => {
      const host = document.createElement('div');

      host.setAttribute('data-testid', 'second-grid');
      document.body.appendChild(host);
      const win = window as any;

      // A function cannot cross the evaluate boundary, so a `callback` key arrives as a placeholder and
      // becomes a no-op here, which the buttons of the message require.
      const revive = (value: unknown): unknown => {
        if (Array.isArray(value)) {
          return value.map(revive);
        }

        if (value !== null && typeof value === 'object') {
          return Object.fromEntries(Object.entries(value).map(
            ([key, item]) => [key, key === 'callback' ? () => {} : revive(item)]));
        }

        return value;
      };

      win.secondHot = new win.Handsontable(host, {
        data: [],
        colHeaders: ['A', 'B'],
        width: 300,
        height: 200,
        emptyDataState: true,
        licenseKey: win.htTestLicenseKey,
        ...(revive(overrides) as Record<string, unknown>),
      });
    }, settings);

    const message = this.page.getByTestId('second-grid').locator('.ht-empty-data-state__content-wrapper-inner');

    await expect(message).toBeVisible();

    return message;
  }

  /** The element of the message that takes the focus when the message has no buttons. */
  get messageTarget(): Locator {
    return this.overlay.locator('.ht-empty-data-state__content-wrapper-inner');
  }

  /** The message's title. */
  get messageTitle(): Locator {
    return this.messageTarget.locator('.ht-empty-data-state__title');
  }

  /** The message's description. */
  get messageDescription(): Locator {
    return this.messageTarget.locator('.ht-empty-data-state__description');
  }

  /**
   * Presses Tab from outside the grid until the message holds the focus, the way a keyboard user
   * reaches it. The grid has no rows, so the presses go through its headers first.
   */
  async focusMessageWithTab(): Promise<void> {
    for (let press = 0; press < 12; press++) {
      await this.page.keyboard.press('Tab');

      const focused = await this.messageTarget.evaluate(element => element === element.ownerDocument.activeElement);

      if (focused) {
        return;
      }
    }

    throw new Error('Twelve Tab presses never reached the empty data state message.');
  }

  /**
   * Selects the whole grid the way a user does: click a cell, then Ctrl/Cmd+A.
   *
   * Which cell is a parameter because two calls that press the SAME point within the double-click
   * interval read as a double click, which opens the editor - and the Ctrl+A that follows then goes
   * to the `editor` context and selects nothing. A test that selects all twice passes a second cell.
   */
  async selectAllWithKeyboard(row = 0, col = 0): Promise<void> {
    await this.cell(row, col).click();
    await this.page.keyboard.press('ControlOrMeta+a');
  }

  /**
   * Opens the context menu on one of the grid's headers and clicks the given item. The row header
   * is the only handle left once every column is hidden; the column header is the only one left
   * once every row is removed.
   */
  async runContextMenuItem(on: 'rowHeader' | 'columnHeader', item: string | RegExp): Promise<void> {
    const header = on === 'rowHeader'
      ? this.page.locator('.ht_clone_inline_start tbody tr').first().locator('th')
      : this.page.locator('.ht_clone_top thead tr').first().locator('th').nth(1);

    await header.click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu.handsontable').locator('visible=true');

    await expect(menu).toBeVisible();
    await menu.locator('.ht_master td').filter({ hasText: item }).click();
    await expect(menu).toBeHidden();
  }

  /** Clicks the overlay itself — what a user hits when aiming at a header the overlay covers. */
  async clickOverlay(): Promise<void> {
    await this.overlay.click();
  }

  /** The name of the shortcut context the manager currently runs. */
  async activeShortcutContext(): Promise<string> {
    return this.page.evaluate(() => window.hot.getShortcutManager().getActiveContextName());
  }

  /** Whether the empty-data-state overlay considers itself visible. */
  async isEmptyDataStateVisible(): Promise<boolean> {
    return this.page.evaluate(() => window.hot.getPlugin('emptyDataState').isVisible());
  }

  /**
   * Shows the overlay through the plugin's DataProvider loading branch, which is the one path that puts
   * it over cells that are still DRAWN. The hook is fired by hand because it is exactly the signal the
   * plugin listens for - a real fetch is this plus a network round trip, which would add nothing here.
   */
  async startDataProviderFetch(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.runHooks('beforeDataProviderFetch', {});
    });
    await expect(this.overlay).toBeVisible();
  }

  /** Ends the fetch started above, so the overlay hides again. */
  async finishDataProviderFetch(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.runHooks('afterDataProviderFetch');
    });
    await expect(this.overlay).toBeHidden();
  }

  /** How many rows and columns the grid currently draws. */
  async renderedCounts(): Promise<{ rows: number, cols: number }> {
    return this.page.evaluate(() => ({
      rows: window.hot.countRenderedRows(),
      cols: window.hot.countRenderedCols(),
    }));
  }

  /** The id of the focus scope that currently owns the keyboard. */
  async activeScopeId(): Promise<string | null> {
    return this.page.evaluate(() => window.hot.getFocusScopeManager().getActiveScopeId());
  }

  /** Opens a modal dialog over the grid. */
  async showDialog(content: string): Promise<void> {
    await this.page.evaluate((text) => {
      window.hot.getPlugin('dialog').show({ content: text });
    }, content);
  }

  /**
   * Empties the grid through the API, so the overlay shows from a clean state, and takes the focus out
   * of the page's controls - the starting point of a user who Tabs INTO the grid.
   */
  async loadEmptyDataAndLeaveFocus(): Promise<void> {
    await this.page.evaluate(() => {
      window.hot.loadData([]);
      (document.activeElement as HTMLElement | null)?.blur();
    });
    await expect(this.overlay).toBeVisible();
  }

  /** Applies setting overrides to the live grid. */
  async updateSettings(settings: Record<string, unknown>): Promise<void> {
    await this.page.evaluate((overrides) => {
      window.hot.updateSettings(overrides);
    }, settings);
  }

  /**
   * Selects one cell through the API, for a cell whose own control a real click would land on.
   * The grid must already be listening, so click a cell first.
   */
  async selectCell(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => {
      window.hot.selectCell(r, c);
    }, [row, col]);
  }

  /** Whether the grid's active editor is open. */
  async isEditorOpened(): Promise<boolean> {
    return this.page.evaluate(() => !!window.hot.getActiveEditor()?.isOpened());
  }

  /** The grid's current selection, as `getSelected()` returns it. */
  async selection(): Promise<number[][] | null> {
    return this.page.evaluate(() => window.hot.getSelected() ?? null);
  }

  /** The number of rows the grid currently holds. */
  async rowCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.countRows());
  }

  /** The number of columns the grid can actually render (0 once every column is hidden). */
  async renderableColumnCount(): Promise<number> {
    return this.page.evaluate(() => window.hot.view.countRenderableColumns());
  }

  /**
   * Presses a key and reports whether anything called `preventDefault()` on it.
   *
   * The listener is installed before the press and sits on the window in the bubble phase, so it runs
   * after every handler below it and reads their verdict - nothing here is timed.
   */
  async pressAndReadDefaultPrevented(key: string): Promise<boolean | null> {
    await this.page.evaluate(() => {
      window.htLastKeyDefaultPrevented = null;
      window.addEventListener('keydown', (event) => {
        window.htLastKeyDefaultPrevented = event.defaultPrevented;
      }, { once: true });
    });

    await this.page.keyboard.press(key);

    return this.page.evaluate(() => window.htLastKeyDefaultPrevented);
  }

  /**
   * Every cell value, flattened. A destructive shortcut that slipped through shows up here even
   * when the cells are hidden, which reading one corner would miss.
   */
  async allValues(): Promise<unknown[]> {
    return this.page.evaluate(() => window.hot.getData().flat());
  }
}
