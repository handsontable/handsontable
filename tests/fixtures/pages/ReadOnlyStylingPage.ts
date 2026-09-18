import { type Page, type Locator, expect } from '@playwright/test';

/** Which grid of the fixture a locator or probe addresses. */
export type GridName = 'editable' | 'styled' | 'unstyled';

/** The `window` handle each grid of the fixture is published under. */
const INSTANCES: Record<GridName, string> = {
  editable: 'hotEditable',
  styled: 'hotStyled',
  unstyled: 'hotUnstyled',
};

/** The painted properties that decide whether a cell reads as "dimmed". */
export interface CellLook {
  color: string;
  backgroundColor: string;
}

/**
 * Page Object for the `readOnlyStyling` fixture.
 *
 * The option changes appearance only, so the useful probes are a cell's painted
 * colors — always compared against the fixture's editable reference grid rather
 * than against a fixed palette, so the assertions hold on every theme.
 */
export class ReadOnlyStylingPage {
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
    await this.page.goto(`/tests/fixtures/demo/read-only-styling.html?theme=${this.theme}&bundle=${this.bundle}`);
    await expect(this.cell('unstyled', 0, 0)).toBeVisible();
  }

  /** A single data cell, by grid and visual row/column, via its stable test id. */
  cell(grid: GridName, row: number, col: number): Locator {
    return this.page.getByTestId(`${grid}-${row}-${col}`);
  }

  /**
   * A cell's painted colors.
   *
   * Both values are read in ONE evaluation on one resolved node, so they cannot
   * describe two different states, and the caller compares them against another
   * cell read the same way.
   */
  async cellLook(grid: GridName, row: number, col: number): Promise<CellLook> {
    return this.cell(grid, row, col).evaluate((td) => {
      const style = getComputedStyle(td);

      return { color: style.color, backgroundColor: style.backgroundColor };
    });
  }

  /** Assert two cells are painted identically — the theme-agnostic form of "looks the same". */
  async expectSameLook(a: [GridName, number, number], b: [GridName, number, number]): Promise<void> {
    const reference = await this.cellLook(...b);

    await expect.poll(() => this.cellLook(...a)).toEqual(reference);
  }

  /** Assert two cells are painted differently. */
  async expectDifferentLook(a: [GridName, number, number], b: [GridName, number, number]): Promise<void> {
    const reference = await this.cellLook(...b);

    await expect.poll(() => this.cellLook(...a)).not.toEqual(reference);
  }

  /** Whether the grid currently has an OPEN editor. */
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

  /** Assert a cell shows the expected text (web-first, auto-retrying). */
  async expectCell(grid: GridName, row: number, col: number, text: string): Promise<void> {
    await expect(this.cell(grid, row, col)).toHaveText(text);
  }

  /** The `aria-readonly` attribute a screen reader would announce for a cell. */
  async ariaReadonly(grid: GridName, row: number, col: number): Promise<string | null> {
    return this.cell(grid, row, col).getAttribute('aria-readonly');
  }
}
