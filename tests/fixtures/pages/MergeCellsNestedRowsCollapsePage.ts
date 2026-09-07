import { type Locator, type Page } from '@playwright/test';

export interface FirstColumnCell {
  covered: boolean;
  rowspan: number;
  text: string;
}

interface FixtureWindow extends Window {
  htReadFirstColumn(): FirstColumnCell[];
  htToggleGroup(row: number, collapse: boolean): void;
}

/**
 * Page Object for the fixture that builds a `nestedRows` grid whose groups are each covered by one
 * merge in the first column (#7686).
 */
export class MergeCellsNestedRowsCollapsePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
  }

  /**
   * Opens the fixture and waits for the grid the bundle builds at parse time. A captured
   * constructor throw is rethrown here, so a failed build is one diagnosed red rather than a bare
   * wait-for-`hot` timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/merge-cells-nested-rows-collapse.html' +
      `?theme=${this.theme}&bundle=${this.bundle}`,
    );

    // The bundle script and the block that builds the grid are separate, so waiting on the
    // fixture's own state without this can fail inside the first evaluate with a bare
    // `Handsontable is not defined`.
    await this.page.waitForFunction(() => 'Handsontable' in window, undefined, { polling: 100 });
    await this.page.waitForFunction(
      () => 'htReady' in window || 'htBuildError' in window, undefined, { polling: 100 },
    );

    const buildError = await this.page.evaluate(
      () => (window as { htBuildError?: string }).htBuildError ?? null,
    );

    if (buildError !== null) {
      throw new Error(`Handsontable constructor threw in the fixture:\n${buildError}`);
    }
  }

  /**
   * Returns a data cell through its fixture-owned test id.
   */
  cell(row: number, col: number): Locator {
    return this.page.getByTestId(`cell-${row}-${col}`);
  }

  /**
   * The first column as it is currently rendered, one entry per row.
   */
  async firstColumn(): Promise<FirstColumnCell[]> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htReadFirstColumn());
  }

  /**
   * Collapses the group whose parent sits at the given row of the source data, and draws. The
   * index is the parent's position in the nested structure, which a collapse elsewhere does not
   * move.
   */
  async collapse(row: number): Promise<void> {
    await this.page.evaluate(
      ([parentRow]) => (window as unknown as FixtureWindow).htToggleGroup(parentRow as number, true),
      [row],
    );
  }

  /**
   * Expands the group whose parent sits at the given row of the source data, and draws.
   */
  async expand(row: number): Promise<void> {
    await this.page.evaluate(
      ([parentRow]) => (window as unknown as FixtureWindow).htToggleGroup(parentRow as number, false),
      [row],
    );
  }
}
