import { type Locator, type Page, expect } from '@playwright/test';
import { type Bundle, assertKnownBundle, awaitBundle, awaitFixtureBuilt } from '../bundle';

/**
 * The slice of the page the evaluate callbacks reach. Declared locally, not as a `Window`
 * augmentation: `windowTypes.ts` owns `hot` and a second declaration of it with another type is a
 * TS2717 error.
 */
interface PendingScrollWindow {
  hot: {
    selectCell(row: number, col: number, endRow?: number, endCol?: number, scrollToCell?: boolean): boolean;
    deselectCell(): void;
    addHookOnce(key: 'afterScroll', callback: () => void): void;
  };
}

/**
 * Page object for a 100-row grid with a text field outside it. A cell far from the top is not
 * rendered, so a selection on it makes the focus manager wait for the next scroll before it can
 * move the browser focus. The scenarios leave that wait pending and then scroll the grid.
 */
export class FocusPendingScrollPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly externalInput: Locator;
  readonly editorTextarea: Locator;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd') {
    assertKnownBundle(bundle);

    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.externalInput = page.getByTestId('ext');
    this.editorTextarea = page.locator('textarea.handsontableInput');
  }

  /**
   * Opens the fixture and waits until the first cell is rendered.
   *
   * @param options The setting the scenario needs.
   * @param options.imeFastEdit Turns `imeFastEdit` on.
   */
  async goto(options: { imeFastEdit?: boolean } = {}): Promise<void> {
    const query = new URLSearchParams({
      theme: this.theme,
      bundle: this.bundle,
      imeFastEdit: options.imeFastEdit ? '1' : '0',
    });

    await this.page.goto(`/tests/fixtures/demo/focus-pending-scroll.html?${query.toString()}`);
    await awaitBundle(this.page);
    await awaitFixtureBuilt(this.page);
    await expect(this.page.getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * The master table's cell, which exists only while the grid renders it.
   *
   * @param row Visual row.
   * @param col Visual column.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Selects a cell without scrolling to it, so a cell outside the rendered band stays unrendered
   * and the focus manager defers its work to the next scroll.
   *
   * @param row Visual row.
   * @param col Visual column.
   */
  async selectWithoutScrolling(row: number, col: number): Promise<void> {
    await this.page.evaluate(([selectRow, selectCol]) => {
      (window as unknown as PendingScrollWindow).hot.selectCell(selectRow, selectCol, selectRow, selectCol, false);
    }, [row, col]);
  }

  /**
   * Selects a cell the way a user's click does, scrolling it into view when it is not rendered.
   *
   * @param row Visual row.
   * @param col Visual column.
   */
  async select(row: number, col: number): Promise<void> {
    await this.page.evaluate(([selectRow, selectCol]) => {
      (window as unknown as PendingScrollWindow).hot.selectCell(selectRow, selectCol);
    }, [row, col]);
  }

  /**
   * Clears the selection through the API.
   */
  async deselect(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as PendingScrollWindow).hot.deselectCell();
    });
  }

  /**
   * Drops the browser focus from whatever holds it, so the next focus move is the one under test.
   */
  async blurActiveElement(): Promise<void> {
    await this.page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }

  /**
   * Scrolls the grid holder to the middle of its range and resolves once the `afterScroll` hook has run, then lets two
   * animation frames pass: the `imeFastEdit` refocus is a 1 ms debounce, so it has fired by then.
   * The settle is bounded and only meaningful beside a positive control in the same test.
   */
  async scrollHolderAndSettle(): Promise<void> {
    await this.page.evaluate(async() => {
      const holder = document.querySelector('.ht_master .wtHolder');

      if (!(holder instanceof HTMLElement)) {
        throw new Error('Master holder is missing');
      }

      const scrolled = new Promise<void>((resolve) => {
        (window as unknown as PendingScrollWindow).hot.addHookOnce('afterScroll', () => resolve());
      });

      holder.scrollTop = Math.floor(holder.scrollHeight / 2);
      await scrolled;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
  }
}
