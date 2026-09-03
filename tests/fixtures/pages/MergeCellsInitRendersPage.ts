import { type Locator, type Page } from '@playwright/test';

export type MergeCellsScenario = 'none' | 'enabled' | 'areas' | 'async-validator';

export interface InitRenderSnapshot {
  afterRender: number;
  afterRenderer: number;
  spannedCells: number;
}

interface FixtureWindow extends Window {
  hot: unknown;
  htAfterConstruct: InitRenderSnapshot;
  htRenderCounts: { afterRender: number; afterRenderer: number };
  htCountSpannedCells(): number;
}

/**
 * Page Object for the fixture that builds a grid with a given `mergeCells` configuration and
 * records how many times the grid drew while the constructor ran (#5687).
 */
export class MergeCellsInitRendersPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly scenario: MergeCellsScenario;

  constructor(page: Page, theme = 'main', bundle = 'umd', scenario: MergeCellsScenario = 'none') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.scenario = scenario;
  }

  /**
   * Opens the fixture and waits for the grid the bundle builds at parse time. A captured
   * constructor throw is rethrown here, so a failed build is one diagnosed red rather than a
   * bare wait-for-`hot` timeout.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/merge-cells-init-renders.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&scenario=${this.scenario}`,
    );

    // The bundle script and the block that builds the grid are separate, so waiting on the
    // fixture's own state without this can fail inside the first evaluate with a bare
    // `Handsontable is not defined`.
    await this.page.waitForFunction(() => 'Handsontable' in window, undefined, { polling: 100 });

    await this.page.waitForFunction(
      () => 'htAfterConstruct' in window || 'htBuildError' in window, undefined, { polling: 100 },
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
   * The hook counts and the merge state as they stood the instant the constructor returned.
   */
  async afterConstruct(): Promise<InitRenderSnapshot> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htAfterConstruct);
  }

  /**
   * How many cells the master table spans right now - the observable proof that the merges were
   * applied, read from the DOM because that is what this tier verifies.
   */
  async spannedCells(): Promise<number> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htCountSpannedCells());
  }

  /**
   * The live running hook counts, including any draw that landed after construction.
   */
  async renderCounts(): Promise<{ afterRender: number; afterRenderer: number }> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htRenderCounts);
  }
}
