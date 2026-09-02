import { type Locator, type Page, expect } from '@playwright/test';

interface EditorFixture {
  isOpened(): boolean;
  row: number;
  col: number;
}

// Deliberately not `extends Window`: `windowTypes.ts` already declares `hot` globally with the full
// instance type, and narrowing it here to the members these probes use would be a TS2430 conflict.
// Every access goes through an explicit cast anyway.
interface FixtureWindow {
  hot: {
    getSelected(): number[][] | undefined;
    getActiveEditor(): EditorFixture | undefined;
    getCell(row: number, col: number, topmost?: boolean): HTMLElement | null;
    scrollViewportTo(options: { col: number }): boolean;
    updateSettings(settings: { colWidths: number }): void;
    render(): void;
  };
}

export type CellType = 'autocomplete' | 'dropdown' | 'handsontable' | 'multiselect';

// `multiselect` builds its own indicator in `multiSelectRenderer` rather than reusing
// `htAutocompleteArrow`, whose styling and global listener belong to `autocompleteRenderer`.
const ARROW_CLASS: Record<CellType, string> = {
  autocomplete: 'htAutocompleteArrow',
  dropdown: 'htAutocompleteArrow',
  handsontable: 'htAutocompleteArrow',
  multiselect: 'ht-multi-select-arrow',
};

/**
 * Page Object for the fixture whose cells carry a dropdown arrow.
 *
 * Openness is read through `hot.getActiveEditor()`, never a CSS locator: `.handsontableInput` is
 * always in the DOM and a closed editor is only `opacity: 0`, which Playwright counts as visible.
 */
export class CellDropdownArrowPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly cellType: CellType;

  constructor(page: Page, theme = 'main', bundle = 'umd', cellType: CellType = 'autocomplete') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.cellType = cellType;
  }

  /**
   * Opens the fixture and waits for the first data cell to render.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.frozen] Freeze the first column and add columns to scroll past it.
   */
  async goto({ frozen = false, overflow = false }: {
    frozen?: boolean, overflow?: boolean,
  } = {}): Promise<void> {
    const query = `theme=${this.theme}&bundle=${this.bundle}&cellType=${this.cellType}`
      + (frozen ? '&frozen=1' : '')
      + (overflow ? '&overflow=1' : '');

    await this.page.goto(`/tests/fixtures/demo/cell-dropdown-arrow.html?${query}`);

    // Wait for the bundle before the cell. The test id comes from the fixture's `afterRenderer`,
    // so "cell not found" alone cannot tell a slow bundle apart from a grid that failed to render.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    // Scoped to the master table: with a frozen column, cell (0, 0) is rendered in the inline-start
    // overlay clone as well, and an unscoped test id then matches twice and fails strict mode.
    await expect(this.page.locator('.ht_master').getByTestId('cell-0-0')).toBeVisible();
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Returns a cell's dropdown arrow. The renderer builds the arrow, so it carries no test id of its
   * own and has to be reached through the cell that owns it.
   */
  arrow(row: number, col: number): Locator {
    return this.cell(row, col).locator(`.${ARROW_CLASS[this.cellType]}`);
  }

  /**
   * Clicks a cell near its leading edge, far from the dropdown arrow.
   *
   * A centred click can land on the right-floated arrow at narrow column widths, and whether it
   * does is theme-dependent. Addressing the leading edge keeps "a click on the cell body" a
   * meaningful control regardless of theme or column width.
   */
  async clickCellBody(row: number, col: number): Promise<void> {
    const box = await this.cell(row, col).boundingBox();

    if (!box) {
      throw new Error(`Cell (${row}, ${col}) is not rendered`);
    }

    await this.page.mouse.click(box.x + 4, box.y + (box.height / 2));
  }

  /**
   * Returns a frozen cell's indicator from the inline-start overlay clone.
   *
   * Header and frozen cells are rendered in more than one overlay layer, so the plain `arrow()`
   * locator matches twice and fails Playwright's strict mode. This scopes to the clone the user
   * actually sees once the master's rendered range has scrolled past the frozen column.
   */
  frozenArrow(): Locator {
    return this.page.locator(`.ht_clone_inline_start .${ARROW_CLASS[this.cellType]}`).first();
  }

  /**
   * Scrolls the viewport to a column and waits until the frozen column has left the master table's
   * rendered range — the state where `getCell()` without `topmost` answers `null`.
   *
   * @param {number} col Visual column index to scroll to.
   */
  async scrollPastFrozenColumn(col: number): Promise<void> {
    await this.page.evaluate((target) => {
      const { hot } = window as unknown as FixtureWindow;

      hot.scrollViewportTo({ col: target });
      hot.render();
    }, col);

    await expect.poll(() => this.page.evaluate(() => {
      const { hot } = window as unknown as FixtureWindow;

      return hot.getCell(0, 0) === null && hot.getCell(0, 0, true) !== null;
    })).toBe(true);
  }

  /**
   * Sweeps a multiselect column through a range of widths and measures, at each one, how far the
   * cell's content reaches against its dropdown indicator.
   *
   * A sweep rather than one fixed width, because the reservation only decides anything inside a
   * narrow band: it is worth about the indicator's own width, so at most widths the chips have slack
   * and a single-width check passes whether the reservation is there or not. Somewhere in the range
   * the cumulative chip width lands in that band, and that is the width that catches its removal.
   * Sweeping also keeps the case honest across themes, whose chip padding and icon size differ, so
   * no hardcoded width could sit in the band on all three.
   *
   * Everything is read from real boxes, never from the renderer's own arithmetic — the failure this
   * guards against is visible overlap, not a wrong number.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number[]} widths Column widths to measure, in pixels.
   * @returns {Promise<object[]>} One entry per width: the indicator's left edge, the furthest right
   *   edge any visible chip or `+N` badge reaches, and whether the badge was showing.
   */
  async chipLayoutAcrossWidths(row: number, col: number, widths: number[]): Promise<Array<{
    width: number,
    cellRight: number,
    contentRight: number,
    overflowing: boolean,
  }>> {
    return this.page.evaluate(({ row: r, col: c, widths: ws }) => {
      const { hot } = window as unknown as FixtureWindow;
      const isShown = (el: HTMLElement) => getComputedStyle(el).display !== 'none'
        && getComputedStyle(el).visibility !== 'hidden';

      return ws.map((width) => {
        hot.updateSettings({ colWidths: width });

        const td = hot.getCell(r, c)!;
        const badge = td.querySelector('.ht-multi-select-overflow') as HTMLElement | null;
        const shownChips = Array.from(td.querySelectorAll('.ht-multi-select-chip'))
          .filter(el => isShown(el as HTMLElement));
        const badgeShown = !!badge && isShown(badge);
        const rights = shownChips.map(el => el.getBoundingClientRect().right);

        if (badgeShown) {
          rights.push(badge!.getBoundingClientRect().right);
        }

        return {
          width,
          cellRight: td.getBoundingClientRect().right,
          contentRight: rights.length ? Math.max(...rights) : Number.NEGATIVE_INFINITY,
          overflowing: badgeShown,
        };
      });
    }, { row, col, widths });
  }

  /**
   * Reports whether a cell editor is open.
   */
  async isEditorOpen(): Promise<boolean> {
    return this.page.evaluate(() => (
      (window as unknown as FixtureWindow).hot.getActiveEditor()?.isOpened() === true
    ));
  }

  /**
   * Returns the coordinates of the cell the active editor is bound to, or `null` when there is no
   * editor. `isEditorOpen()` only reports that SOME editor is open, which cannot tell an editor on
   * the wrong cell apart from the right one.
   */
  async editorCoords(): Promise<[number, number] | null> {
    return this.page.evaluate(() => {
      const editor = (window as unknown as FixtureWindow).hot.getActiveEditor();

      return editor ? [editor.row, editor.col] : null;
    });
  }

  /**
   * Returns the current selection.
   */
  async selected(): Promise<number[][] | undefined> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getSelected());
  }
}
