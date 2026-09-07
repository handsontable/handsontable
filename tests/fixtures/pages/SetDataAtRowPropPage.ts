import { type Page, type Locator, expect } from '@playwright/test';

/**
 * One scenario for the `set-data-at-row-prop.html` fixture. Everything is plain data so it
 * survives the `page.evaluate()` boundary.
 */
export interface PropScenario {
  /** Source shape. Defaults to an array of arrays. */
  dataKind?: 'array' | 'object';
  /** The `columns` setting, when the scenario remaps source indexes. */
  columns?: { data: string | number }[];
  /** The `manualColumnMove` setting, when the scenario reorders columns. */
  manualColumnMove?: number[];
  /** The `hiddenColumns.columns` setting. */
  hiddenColumns?: number[];
  /** The prop handed to the method under test. */
  prop: string | number;
  /** Visual row index. Defaults to 1. */
  row?: number;
}

/**
 * What the fixture reports back after driving one scenario.
 */
export interface PropResult {
  oldValue: unknown;
  reportedProp?: unknown;
  before: unknown[] | Record<string, unknown>;
  after: unknown[] | Record<string, unknown>;
  undone?: unknown[] | Record<string, unknown>;
}

/**
 * Page Object for the `setDataAtRowProp` old-value fixture (`set-data-at-row-prop.html`).
 *
 * Both methods under test are addressed by prop, so the assertions are about data rather than
 * layout — the fixture runs each scenario in-page and hands back the values it observed.
 */
export class SetDataAtRowPropPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly status: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.status = page.getByTestId('status');
  }

  /**
   * Navigate to the fixture and wait until its helpers are installed.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/set-data-at-row-prop.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    await expect(this.status).toHaveText('ready');
  }

  /**
   * Drive `setDataAtRowProp()` for one scenario.
   */
  async setDataAtRowProp(scenario: PropScenario): Promise<PropResult> {
    return this.page.evaluate(
      arg => (window as unknown as {
        htRunSetDataAtRowProp(s: PropScenario): PropResult;
      }).htRunSetDataAtRowProp(arg),
      scenario
    );
  }

  /**
   * Drive `setSourceDataAtCell()` for one scenario.
   */
  async setSourceDataAtCell(scenario: PropScenario): Promise<PropResult> {
    return this.page.evaluate(
      arg => (window as unknown as {
        htRunSetSourceDataAtCell(s: PropScenario): PropResult;
      }).htRunSetSourceDataAtCell(arg),
      scenario
    );
  }
}
