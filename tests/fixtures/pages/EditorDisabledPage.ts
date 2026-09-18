import { type Page, type Locator, expect } from '@playwright/test';

/** Which grid of the fixture a locator or probe addresses. */
export type GridName = 'levels' | 'global' | 'typed';

/** The `window` handle each grid of the fixture is published under. */
const INSTANCES: Record<GridName, string> = {
  levels: 'hotLevels',
  global: 'hotGlobal',
  typed: 'hotTyped',
};

/**
 * Page Object for the `editor: false` fixture.
 *
 * `editor: false` is observable only through what the keyboard does — nothing
 * about the cell looks different — so this object exposes the two things a spec
 * needs to judge it: whether an editor is on screen, and where the selection
 * ended up after a keystroke.
 */
export class EditorDisabledPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Navigate to the fixture and wait for every grid to render. The wait is a
   * real DOM condition — the LAST grid's first cell — never a readiness flag.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/editor-disabled.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell('typed', 0, 0)).toBeVisible();
  }

  /**
   * A single data cell, by grid and visual row/column.
   *
   * The `typed` grid is located structurally rather than by a stamped test id:
   * stamping one needs a grid-level `renderer`, which would replace the very
   * cell-type renderers that grid exists to prove are still applied. Its cells
   * live only in `.ht_master` (nothing is frozen), so the match is unambiguous,
   * and `td` skips the row header, which is a `th`.
   */
  cell(grid: GridName, row: number, col: number): Locator {
    if (grid === 'typed') {
      return this.page.getByTestId('typed')
        .locator('.ht_master tbody tr')
        .nth(row)
        .locator('td')
        .nth(col);
    }

    return this.page.getByTestId(`${grid}-${row}-${col}`);
  }

  /** Click a cell to select it, and wait for the selection to land there. */
  async selectCell(grid: GridName, row: number, col: number): Promise<void> {
    await this.cell(grid, row, col).click();
    await this.expectSelection(grid, row, col);
  }

  /** Assert where the grid's selection highlight currently sits. */
  async expectSelection(grid: GridName, row: number, col: number): Promise<void> {
    await expect.poll(() => this.selection(grid)).toEqual([row, col]);
  }

  /** The grid's current highlight coordinates, as `[row, col]`. */
  async selection(grid: GridName): Promise<[number, number] | null> {
    return this.page.evaluate((name) => {
      const selected = (window as any)[name].getSelectedLast();

      return selected ? [selected[0], selected[1]] : null;
    }, INSTANCES[grid]);
  }

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(grid: GridName, row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(grid, row, col)).toHaveText(text);
  }

  /**
   * Assert a cell carries a class its renderer put there.
   *
   * This is how the spec proves a cell type's RENDERER ran, rather than reading
   * the formatted value: `numericFormat` is applied through numbro, which the
   * plain UMD bundle leaves external, so the rendered number differs across the
   * bundle axis while the marker class does not.
   */
  async expectCellClass(grid: GridName, row: number, col: number, className: string): Promise<void> {
    await expect(this.cell(grid, row, col)).toHaveClass(new RegExp(`\\b${className}\\b`));
  }

  /** The text editor's input, shared by every grid on the page. */
  editor(): Locator {
    return this.page.locator('.handsontableInput');
  }

  /**
   * Whether the grid currently has an OPEN editor.
   *
   * The DOM alone cannot answer this: selecting an editable cell prepares its
   * editor, which leaves the textarea attached and, to Playwright, visible —
   * so a spec asserting on `.handsontableInput` reads "an editor is open" for
   * any editable cell the selection merely landed on.
   */
  async isEditorOpen(grid: GridName): Promise<boolean> {
    return this.page.evaluate((name) => {
      const editor = (window as any)[name].getActiveEditor();

      return !!editor && editor.isOpened();
    }, INSTANCES[grid]);
  }

  /** Assert the grid has no open cell editor. */
  async expectNoEditor(grid: GridName): Promise<void> {
    await expect.poll(() => this.isEditorOpen(grid)).toBe(false);
  }

  /** Assert the grid has an open cell editor, and that it is on screen. */
  async expectEditorOpen(grid: GridName): Promise<void> {
    await expect.poll(() => this.isEditorOpen(grid)).toBe(true);
    await expect(this.editor()).toBeVisible();
  }

  /** The checkbox input inside a cell of a `type: 'checkbox'` column. */
  checkbox(grid: GridName, row: number, col: number): Locator {
    return this.cell(grid, row, col).locator('input[type=checkbox]');
  }

  /** The value the grid currently holds at a cell, read from the instance. */
  async dataAtCell(grid: GridName, row: number, col: number): Promise<unknown> {
    return this.page.evaluate(
      ({ name, row: r, col: c }) => (window as any)[name].getDataAtCell(r, c),
      { name: INSTANCES[grid], row, col },
    );
  }
}
