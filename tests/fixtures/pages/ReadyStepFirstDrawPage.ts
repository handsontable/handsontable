import { type Locator, type Page } from '@playwright/test';
import { awaitBundle, type Bundle } from '../bundle';

export type ReadyStepScenario = 'sorted' | 'borders';

export interface FirstDrawSnapshot {
  draws: number;
  firstColumnOfFirstDraw: string[] | null;
}

interface FixtureWindow extends Window {
  htAfterConstruct: FirstDrawSnapshot;
  hot: {
    getPlugin(name: 'customBorders'): { enablePlugin(): void; disablePlugin(): void };
  };
}

/**
 * Page Object for the fixture that builds a grid whose plugins set up their state in the ready step:
 * a sorted grid, or a grid with declared custom borders.
 */
export class ReadyStepFirstDrawPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly scenario: ReadyStepScenario;

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', scenario: ReadyStepScenario = 'sorted') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.scenario = scenario;
  }

  /**
   * Opens the fixture and waits for the grid it builds. A captured constructor throw is rethrown here.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      '/tests/fixtures/demo/ready-step-first-draw.html' +
      `?theme=${this.theme}&bundle=${this.bundle}&scenario=${this.scenario}`,
    );

    await awaitBundle(this.page);
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
   * The draw count, and the first column as the first draw showed it, the instant the constructor returned.
   */
  async afterConstruct(): Promise<FirstDrawSnapshot> {
    return this.page.evaluate(() => (window as unknown as FixtureWindow).htAfterConstruct);
  }

  /**
   * The custom border edges the master table paints, the same set the legacy specs count.
   */
  customBorderEdges(): Locator {
    return this.page.locator('.ht_master .wtBorder:not(.fill):not(.current):not(.area)').filter({ visible: true });
  }

  /**
   * Turns the CustomBorders plugin off through its own API, the way an application does.
   */
  async disableCustomBorders(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getPlugin('customBorders').disablePlugin());
  }

  /**
   * Turns the CustomBorders plugin back on through its own API.
   */
  async enableCustomBorders(): Promise<void> {
    await this.page.evaluate(() => (window as unknown as FixtureWindow).hot.getPlugin('customBorders').enablePlugin());
  }
}
