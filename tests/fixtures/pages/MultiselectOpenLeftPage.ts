import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface Placement {
  cellLeft: number;
  cellRight: number;
  dropdownLeft: number;
  dropdownRight: number;
  gridLeft: number;
  gridRight: number;
  isRtl: boolean;
}

/**
 * Page object for the DEV-1198 fixture: a narrow grid whose last multiselect
 * column has too little room on the inline end for its option list.
 */
export class MultiselectOpenLeftPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly dropdown: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.dropdown = page.locator('.ht-multi-select-editor');
  }

  /**
   * Navigate and wait for the grid to render (a real DOM condition, no sleep).
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/multiselect-open-left.html?theme=${this.theme}&bundle=${this.bundle}`
    );
    await awaitBundle(this.page);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * Rebuilds the grid with the given setting overrides (RTL is one rebuild, not a second page).
   */
  async rebuild(overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(settings => window.initMultiselectOpenLeftGrid(settings), overrides);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /**
   * A data cell in the master table, addressed by the stamped test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master').getByTestId(`cell-${row}-${col}`);
  }

  /**
   * Opens the multiselect editor through the API plus Enter, not a centred click.
   *
   * A centred press on a multiselect cell can land on the arrow or a chip's ×
   * (see `tests/AGENTS.md`), which would open or deselect the cell by accident.
   */
  async openEditorAt(row: number, col: number): Promise<void> {
    await this.page.evaluate(({ rowIndex, colIndex }) => {
      window.hot.selectCell(rowIndex, colIndex);
    }, { rowIndex: row, colIndex: col });
    await this.page.keyboard.press('Enter');
    await expect(this.dropdown).toBeVisible();
  }

  /**
   * First option row in the open list — always in the dropdown's painted box.
   *
   * Horizon's taller menu items put the last row below the fold on a short
   * grid. The first row stays on screen, and without the open-left flip its
   * centre still sits past the grid's `overflow: clip` on the last column.
   */
  firstOption(): Locator {
    return this.dropdown.locator('li').first();
  }

  /**
   * First option's checkbox in the open list.
   */
  firstOptionCheckbox(): Locator {
    return this.firstOption().locator('input[type="checkbox"]');
  }

  /**
   * Search field at the top of the open list.
   */
  searchInput(): Locator {
    return this.dropdown.locator('.ht-multi-select-editor-search-input');
  }

  /**
   * Filters the open list by typing into the search field.
   *
   * Waits on the first option showing the query so the next geometry read is
   * after the filter, not a stale layout from the unfiltered list.
   */
  async filterBy(query: string): Promise<void> {
    await this.searchInput().fill(query);
    await expect(this.firstOption()).toContainText(query, { ignoreCase: true });
  }

  /**
   * Cell, dropdown, and grid boxes, read in one evaluation so a re-render cannot
   * mix two rounds of geometry.
   */
  async placement(row: number, col: number): Promise<Placement> {
    const cell = this.cell(row, col);

    return this.dropdown.evaluate((dropdownEl, cellEl) => {
      if (!(cellEl instanceof Element)) {
        throw new Error('the edited cell is not rendered');
      }

      const cellBox = cellEl.getBoundingClientRect();
      const dropdownBox = dropdownEl.getBoundingClientRect();
      const gridRoot = dropdownEl.closest('.handsontable');

      if (!gridRoot) {
        throw new Error('the dropdown is not inside a Handsontable root');
      }

      const gridBox = gridRoot.getBoundingClientRect();

      return {
        cellLeft: cellBox.left,
        cellRight: cellBox.right,
        dropdownLeft: dropdownBox.left,
        dropdownRight: dropdownBox.right,
        gridLeft: gridBox.left,
        gridRight: gridBox.right,
        isRtl: window.hot.isRtl(),
      };
    }, await cell.elementHandle());
  }

  /**
   * How much of the dropdown overlaps the grid root, in CSS pixels.
   *
   * The flip may still overhang the inline-start side (HandsontableEditor
   * parity). Overlap proves the painted box was not traded for a fully clipped
   * list on the other edge.
   */
  overlapWithGrid(placement: Placement): number {
    return Math.min(placement.dropdownRight, placement.gridRight) -
      Math.max(placement.dropdownLeft, placement.gridLeft);
  }

  /**
   * How much of the target is genuinely on screen, in CSS pixels, after intersecting
   * every clipping ancestor. `boundingBox()` and `toBeVisible()` both ignore
   * `overflow: clip` on the grid root.
   */
  async visibleWidthOf(target: Locator): Promise<number> {
    return target.evaluate((element: Element) => {
      const view = element.ownerDocument.defaultView;

      if (!view) {
        throw new Error('the element is not attached to a rendered document');
      }

      const rect = element.getBoundingClientRect();
      let left = rect.left;
      let right = rect.right;
      let ancestor = element.parentElement;

      while (ancestor && ancestor !== element.ownerDocument.body) {
        const overflowX = view.getComputedStyle(ancestor).overflowX;

        if (overflowX !== 'visible') {
          const box = ancestor.getBoundingClientRect();

          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }

        ancestor = ancestor.parentElement;
      }

      return Math.max(0, right - left);
    });
  }

  /**
   * True when `target`'s centre is hit-tested back to itself — the user can press it.
   */
  async isReachable(target: Locator): Promise<boolean> {
    return target.evaluate((element: Element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      const y = rect.top + (rect.height / 2);
      const hit = element.ownerDocument.elementFromPoint(x, y);

      return hit !== null && element.contains(hit);
    });
  }

  /**
   * True when the editor wrapper opened the list toward the inline start.
   */
  async isFlippedHorizontally(): Promise<boolean> {
    return this.page.evaluate(() => {
      return window.hot.getActiveEditor()?.isFlippedHorizontally === true;
    });
  }
}
