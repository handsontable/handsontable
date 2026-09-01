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
}

/**
 * What the fixture observed while validating at load.
 */
export interface ValidatorResult {
  /** Every value the rejecting validator was handed, in visit order. */
  seenValues: unknown[];
  /** Physical source row 0 after validation blanked whatever it judged invalid. */
  sourceRow0: unknown[];
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
