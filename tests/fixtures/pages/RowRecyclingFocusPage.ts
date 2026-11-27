import { type CDPSession, type Page, expect } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

/**
 * One focus event the grid root saw in the capture phase.
 */
export type FocusEvent = { type: 'focusin' | 'focusout' | 'focus' | 'blur'; tag: string };

type FixtureWindow = Window & {
  hot: {
    rootElement: HTMLElement;
    selectCell(row: number, column: number): boolean;
    getCoords(element: Element): { row: number; col: number } | null;
    getSelectedLast(): number[] | undefined;
  };
  focusinTargets?: EventTarget[];
  focusedBeforeKey?: Element | null;
  focusEvents: FocusEvent[];
  verticalScrolls: number;
  focusedCell?: Element | null;
};

/**
 * The cell that holds the browser focus after a key press, compared with the one that held it before.
 */
export type FocusedCellAfterKey = {
  sameElementFocused: boolean;
  tag: string | null;
  text: string | null;
  ariaRowIndex: string | null;
  focusinOnFocusedCell: number;
};

/**
 * The accessibility node that has the focus, as Chromium's accessibility tree reports it.
 */
export type FocusedAccessibilityNode = { id: string; name: string };

/**
 * Page Object for the row recycling focus fixture: a 200x3 grid, 120px high, with default settings.
 */
export class RowRecyclingFocusPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  #cdp: CDPSession | null = null;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigates to the fixture and waits for the grid.
   */
  async goto(): Promise<void> {
    const query = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    await this.page.goto(`/tests/fixtures/demo/row-recycling-focus.html?${query}`);
    await awaitBundle(this.page);

    const initError = await this.page.getByTestId('grid').getAttribute('data-init-error');

    if (initError !== null) {
      throw new Error(`The fixture grid failed to build: ${initError}`);
    }

    await expect(this.page.getByTestId('grid-root')).toBeVisible();
  }

  /**
   * Tells whether the engine can move an element without detaching it (`Element#moveBefore()`).
   *
   * @returns {Promise<boolean>}
   */
  async supportsMoveBefore(): Promise<boolean> {
    return this.page.evaluate(() => typeof Element.prototype.moveBefore === 'function');
  }

  /**
   * Selects a cell through the API, keeps the element that took the browser focus, and returns its tag.
   *
   * @param {number} row The visual row.
   * @param {number} column The visual column.
   * @returns {Promise<string|null>} The tag of the focused element when the grid root holds it, otherwise `null`.
   */
  async selectCellAndKeepFocused(row: number, column: number): Promise<string | null> {
    return this.page.evaluate(([targetRow, targetColumn]) => {
      const fixtureWindow = window as unknown as FixtureWindow;

      fixtureWindow.hot.selectCell(targetRow, targetColumn);

      const active = document.activeElement;

      fixtureWindow.focusedCell = active;

      return active && fixtureWindow.hot.rootElement.contains(active) ? active.tagName : null;
    }, [row, column]);
  }

  /**
   * Returns the focus events recorded so far and clears the record.
   *
   * @returns {Promise<FocusEvent[]>}
   */
  async takeFocusEvents(): Promise<FocusEvent[]> {
    return this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const events = fixtureWindow.focusEvents;

      fixtureWindow.focusEvents = [];

      return events;
    });
  }

  /**
   * Scrolls the master holder down by the given distance and waits for the draw that answers it.
   *
   * @param {number} pixels The distance in CSS pixels.
   */
  async scrollDownBy(pixels: number): Promise<void> {
    const before = await this.page.evaluate((distance) => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const holder = fixtureWindow.hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;
      const scrolls = fixtureWindow.verticalScrolls;

      holder.scrollTop += distance;

      return scrolls;
    }, pixels);

    await expect.poll(() => this.page.evaluate(
      () => (window as unknown as FixtureWindow).verticalScrolls,
    )).toBeGreaterThan(before);
  }

  /**
   * Reads whether the element focused by `selectCellAndKeepFocused()` still holds the focus, and the
   * row its TD shows now.
   *
   * @returns {Promise<{ sameElementFocused: boolean, row: number | null }>}
   */
  async focusedCellState(): Promise<{ sameElementFocused: boolean; row: number | null }> {
    return this.page.evaluate(() => {
      const { hot, focusedCell } = window as unknown as FixtureWindow;

      return {
        sameElementFocused: !!focusedCell && document.activeElement === focusedCell,
        row: focusedCell ? hot.getCoords(focusedCell)?.row ?? null : null,
      };
    });
  }

  /**
   * Returns the selected row range of the last selection layer, as `[fromRow, toRow]`.
   *
   * @returns {Promise<number[]>}
   */
  async selectedRows(): Promise<number[]> {
    return this.page.evaluate(() => {
      const selected = (window as unknown as FixtureWindow).hot.getSelectedLast() ?? [];

      return [selected[0], selected[2]];
    });
  }

  /**
   * Presses a key with the grid's cell focused and waits until the selection reaches the given row.
   * Before the press it keeps the focused element and starts recording the targets of `focusin`.
   *
   * @param {string} key The key or chord, in Playwright's notation.
   * @param {number} row The visual row the selection reaches.
   */
  async pressAndWaitForRow(key: string, row: number): Promise<void> {
    await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;

      fixtureWindow.focusedBeforeKey = document.activeElement;

      if (!fixtureWindow.focusinTargets) {
        fixtureWindow.hot.rootElement.addEventListener('focusin', (event) => {
          fixtureWindow.focusinTargets!.push(event.target as EventTarget);
        }, true);
      }

      fixtureWindow.focusinTargets = [];
    });
    await this.page.keyboard.press(key);
    await expect.poll(() => this.selectedRows()).toEqual([row, row]);
  }

  /**
   * Reads the cell that holds the browser focus after `pressAndWaitForRow()`.
   *
   * @returns {Promise<FocusedCellAfterKey>}
   */
  async focusedCellAfterKey(): Promise<FocusedCellAfterKey> {
    return this.page.evaluate(() => {
      const { focusedBeforeKey, focusinTargets } = window as unknown as FixtureWindow;
      const active = document.activeElement;

      return {
        sameElementFocused: active === focusedBeforeKey,
        tag: active?.tagName ?? null,
        text: active?.textContent ?? null,
        ariaRowIndex: active?.parentElement?.getAttribute('aria-rowindex') ?? null,
        focusinOnFocusedCell: (focusinTargets ?? []).filter(target => target === active).length,
      };
    });
  }

  /**
   * Scrolls the master holder to its end and waits for the draw that answers it.
   */
  async scrollToEnd(): Promise<void> {
    const before = await this.page.evaluate(() => {
      const fixtureWindow = window as unknown as FixtureWindow;
      const holder = fixtureWindow.hot.rootElement.querySelector('.ht_master .wtHolder') as HTMLElement;
      const scrolls = fixtureWindow.verticalScrolls;

      holder.scrollTop = holder.scrollHeight;

      return scrolls;
    });

    await expect.poll(() => this.page.evaluate(
      () => (window as unknown as FixtureWindow).verticalScrolls,
    )).toBeGreaterThan(before);
  }

  /**
   * Returns the node of Chromium's accessibility tree that has the focus. Chromium only: it reads the
   * tree through the DevTools protocol.
   *
   * @returns {Promise<FocusedAccessibilityNode|null>}
   */
  async focusedAccessibilityNode(): Promise<FocusedAccessibilityNode | null> {
    if (this.#cdp === null) {
      this.#cdp = await this.page.context().newCDPSession(this.page);
      await this.#cdp.send('Accessibility.enable');
    }

    const { nodes } = await this.#cdp.send('Accessibility.getFullAXTree');
    const focused = nodes.find(node => node.role?.value !== 'RootWebArea' &&
      (node.properties ?? []).some(property => property.name === 'focused' && property.value.value === true));

    return focused ? { id: focused.nodeId, name: String(focused.name?.value ?? '') } : null;
  }
}
