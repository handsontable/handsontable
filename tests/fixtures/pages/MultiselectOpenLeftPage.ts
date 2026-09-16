import { type Locator, type Page, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

interface Placement {
  cellLeft: number;
  cellRight: number;
  dropdownLeft: number;
  dropdownRight: number;
  gridRight: number;
}

/**
 * Page object for the DEV-1198 fixture: a narrow grid whose last multiselect
 * column has too little room on the right for its option list.
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
   * Closes the editor so the next case starts from a hidden list.
   */
  async closeEditor(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.dropdown).toBeHidden();
  }

  /**
   * Last option row in the open list — the target that is cut off when the list
   * hangs past the grid's inline end.
   */
  lastOption(): Locator {
    return this.dropdown.locator('li').last();
  }

  /**
   * Scrolls `target` into the dropdown's own overflow box.
   *
   * Horizon's taller menu items put the last option below the fold on a short
   * grid (`updateDimensions` shrinks the list). The list is still scrollable —
   * do not hit-test the option's unclipped centre until this has run. Only the
   * dropdown's `scrollTop` moves; the page and grid stay put.
   */
  async revealInDropdown(target: Locator): Promise<void> {
    await target.evaluate((element: Element) => {
      const dropdown = element.closest('.ht-multi-select-editor');

      if (!(dropdown instanceof HTMLElement)) {
        throw new Error('the option is not inside the multiselect dropdown');
      }

      const optionBox = element.getBoundingClientRect();
      const dropdownBox = dropdown.getBoundingClientRect();

      if (optionBox.bottom > dropdownBox.bottom) {
        dropdown.scrollTop += optionBox.bottom - dropdownBox.bottom;
      } else if (optionBox.top < dropdownBox.top) {
        dropdown.scrollTop -= dropdownBox.top - optionBox.top;
      }
    });
  }

  /**
   * Search field at the top of the open list.
   */
  searchInput(): Locator {
    return this.dropdown.locator('.ht-multi-select-editor-search-input');
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
        gridRight: gridBox.right,
      };
    }, await cell.elementHandle());
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
      return window.hot.getActiveEditor()?.dropdownController?.isFlippedHorizontally() === true;
    });
  }
}
