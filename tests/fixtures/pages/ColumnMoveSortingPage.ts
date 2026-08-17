import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the column-move-with-sorting fixture.
 *
 * Column headers are rendered into several overlay layers, so every header locator is
 * scoped to the top overlay (`.ht_clone_top`) — an unscoped `getByTestId` would match
 * more than once and fail Playwright's strict mode.
 */
export class ColumnMoveSortingPage {
  readonly page: Page;
  readonly theme: string;
  readonly grid: Locator;
  readonly headerOverlay: Locator;

  constructor(page: Page, theme = 'main') {
    this.page = page;
    this.theme = theme;
    this.grid = page.getByTestId('grid');
    this.headerOverlay = page.locator('.ht_clone_top');
  }

  /**
   * Navigate to the fixture and wait for the grid to render. The active theme is passed
   * as a query param so the fixture loads the matching stylesheet; `colWidths` drives the
   * narrow-column case. `withMove: false` drops ManualColumnMove.
   */
  async goto(colWidths?: number, options: { withMove?: boolean } = {}): Promise<void> {
    const width = colWidths === undefined ? '' : `&colWidths=${colWidths}`;
    const move = options.withMove === false ? '&move=off' : '';

    await this.page.goto(`/tests/fixtures/demo/column-move-sorting.html?theme=${this.theme}${width}${move}`);
    await expect(this.cell(0, 0)).toBeVisible();
  }

  /** A single data cell, by visual row/column, via its stable test id. */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /** A column header, scoped to the top overlay so the match is unambiguous. */
  header(col: number): Locator {
    return this.headerOverlay.getByTestId(`col-header-${col}`);
  }

  /** The clickable sorting label inside a column header. */
  sortLabel(col: number): Locator {
    return this.header(col).locator('span.colHeader');
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(row, col)).toHaveText(text);
  }

  /** Assert the whole first row, left to right — the cheapest read of column order. */
  async expectFirstRow(values: string[]): Promise<void> {
    for (const [col, value] of values.entries()) {
      await this.expectCell(0, col, value);
    }
  }

  /**
   * Click a column header's sorting label. This is the user flow the bug report
   * describes: the click sorts the column and selects it, which is what makes the
   * header draggable in the first place.
   */
  async sortByHeader(col: number): Promise<void> {
    await this.sortLabel(col).click();
    await expect(this.sortLabel(col)).toHaveClass(/ascending|descending/);
  }

  /**
   * Drag a column by pressing at the exact horizontal centre of its header.
   *
   * The centre is the point users naturally reach for, and the point the sorting label
   * covered when it was allowed to fill the header. The first short move crosses the
   * drag threshold before the pointer travels to the drop target.
   */
  async dragColumnFromHeaderCentre(fromCol: number, toCol: number): Promise<void> {
    const from = await this.headerBox(fromCol);
    const to = await this.headerBox(toCol);
    const y = from.y + (from.height / 2);
    const startX = from.x + (from.width / 2);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + 20, y, { steps: 5 });
    await this.page.mouse.move(to.x + (to.width / 2), y, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Drag a column by pressing on its sorting label - the element that covers most of the
   * header, and the one a press has to be able to start a move from.
   */
  async dragFromSortLabel(fromCol: number, toCol: number): Promise<void> {
    const label = await this.sortLabel(fromCol).boundingBox();
    const to = await this.headerBox(toCol);

    if (label === null) {
      throw new Error(`Sorting label for column ${fromCol} has no bounding box`);
    }

    const y = label.y + (label.height / 2);
    const startX = label.x + (label.width / 2);

    await this.page.mouse.move(startX, y);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + 20, y, { steps: 5 });
    await this.page.mouse.move(to.x + (to.width / 2), y, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Press and release at the header centre without moving the pointer at all - the gesture
   * that has to read as a click rather than a drag.
   */
  async pressAndReleaseHeaderCentre(col: number): Promise<void> {
    const box = await this.headerBox(col);

    await this.page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
    await this.page.mouse.down();
    await this.page.mouse.up();
  }

  /**
   * A point inside the header but outside its sorting label - the bare area a user presses to
   * select a column without sorting it.
   *
   * The area has to be a real target, not just the cell padding. When the label was allowed to
   * fill the header only the 8px padding was left, which is what made a column impossible to
   * select without sorting it, so anything at or below that is treated as no bare area at all.
   */
  private async bareHeaderPoint(col: number): Promise<{ x: number, y: number }> {
    const MIN_BARE_AREA = 16;
    const header = await this.headerBox(col);
    const label = await this.sortLabel(col).boundingBox();

    if (label === null) {
      throw new Error(`Sorting label for column ${col} has no bounding box`);
    }

    const gap = label.x - header.x;

    if (gap < MIN_BARE_AREA) {
      throw new Error(`Column ${col} leaves no usable bare header area: only ${Math.round(gap)}px ` +
        `before the sorting label, need at least ${MIN_BARE_AREA}px`);
    }

    return { x: header.x + (gap / 2), y: header.y + (header.height / 2) };
  }

  /** Click the header outside its sorting label. */
  async clickBareHeader(col: number): Promise<void> {
    const point = await this.bareHeaderPoint(col);

    await this.page.mouse.click(point.x, point.y);
  }

  /** Drag a column by pressing the bare header area, outside the sorting label. */
  async dragFromBareHeader(fromCol: number, toCol: number): Promise<void> {
    const from = await this.bareHeaderPoint(fromCol);
    const to = await this.headerBox(toCol);

    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down();
    await this.page.mouse.move(from.x + 20, from.y, { steps: 5 });
    await this.page.mouse.move(to.x + (to.width / 2), from.y, { steps: 10 });
    await this.page.mouse.up();
  }

  /**
   * Assert a column carries no sort indicator - the visible signal that it is unsorted.
   */
  async expectNotSorted(col: number): Promise<void> {
    await expect(this.sortLabel(col)).not.toHaveClass(/ascending|descending/);
  }

  /**
   * Bounding box of a column header, once it is actually laid out.
   */
  private async headerBox(col: number): Promise<{ x: number, y: number, width: number, height: number }> {
    const locator = this.header(col);

    await expect(locator).toBeVisible();

    const box = await locator.boundingBox();

    if (box === null) {
      throw new Error(`Column header ${col} has no bounding box`);
    }

    return box;
  }
}
