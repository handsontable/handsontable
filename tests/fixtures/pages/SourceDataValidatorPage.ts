import { type Page, type Locator, expect } from '@playwright/test';

/**
 * One scenario for the `source-data-validator-address.html` fixture.
 */
export interface ValidatorScenario {
  /** Index in the `columns` array whose column rejects every value. */
  targetColumn: number;
  /** The `columns` setting. Defaults to six plain columns. */
  columns?: { data?: string | number }[];
  /** The `manualColumnMove` setting. */
  manualColumnMove?: number[];
  /**
   * Address every column with a `columns[].data` accessor function over object rows, instead of
   * the default index-addressed array rows.
   */
  accessors?: boolean;
}

/**
 * What the fixture observed while validating at load.
 */
export interface ValidatorResult {
  /** Every value the rejecting validator was handed, in visit order. */
  seenValues: unknown[];
  /**
   * Physical source row 0 after validation blanked whatever it judged invalid. An array for the
   * index-addressed scenarios, an object when `accessors` is set.
   */
  sourceRow0: unknown[] | Record<string, unknown>;
}

/**
 * Page Object for the `sourceDataValidator` addressing fixture.
 *
 * The assertions are about which source cell a validator read and which one it blanked, so the
 * fixture runs each scenario in-page and hands back both.
 */
export class SourceDataValidatorPage {
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
   * Navigate to the fixture and wait until its helper is installed.
   */
  async goto(): Promise<void> {
    await this.page.goto(
      `/tests/fixtures/demo/source-data-validator-address.html?theme=${this.theme}&bundle=${this.bundle}`
    );

    // The uncompressed bundle is several megabytes, and every worker pulls its own copy, so this
    // wait can outlast the `expect` timeout on a cold or busy server. `waitForFunction` polls
    // against the test budget instead, and the fixture installs its helper and reports `ready`
    // in the block right after the bundle's own script.
    await this.page.waitForFunction(() => 'Handsontable' in window);

    await expect(this.status).toHaveText('ready');
  }

  /**
   * Build a grid for one scenario and report what its validator saw and blanked.
   */
  async run(scenario: ValidatorScenario): Promise<ValidatorResult> {
    return this.page.evaluate(
      arg => (window as unknown as {
        htRunSourceDataValidator(s: ValidatorScenario): ValidatorResult;
      }).htRunSourceDataValidator(arg),
      scenario
    );
  }
}
