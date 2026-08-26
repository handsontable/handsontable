import { type Page, type Locator, expect } from '@playwright/test';

/**
 * A Content Security Policy violation as the fixture records it. `sample` is the
 * prefix of the offending value the browser reports, and it is what names the sink
 * — without it a failure says only that something was blocked.
 */
export type CspViolation = {
  directive: string;
  sample: string;
};

/**
 * Page Object for the Trusted Types enforcement fixture (DEV-2617).
 *
 * The fixture serves a page under `require-trusted-types-for 'script'` with no
 * `default` policy and no Handsontable policy in the allowlist, so any raw HTML
 * string Handsontable assigns to a sink throws. The page object exposes the two
 * things a spec needs to judge that: what the fixture reports about construction,
 * and the CSP violations the browser raised.
 */
export class TrustedTypesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;
  readonly status: Locator;
  readonly openDialogButton: Locator;
  readonly pasteButton: Locator;
  readonly exportButton: Locator;
  readonly loadingButton: Locator;
  readonly contextMenuButton: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
    this.status = page.getByTestId('status');
    this.openDialogButton = page.getByTestId('open-dialog');
    this.pasteButton = page.getByTestId('paste-html');
    this.exportButton = page.getByTestId('export-file');
    this.loadingButton = page.getByTestId('show-loading');
    this.contextMenuButton = page.getByTestId('open-context-menu');
  }

  /**
   * Navigate to the fixture and wait until it has reported a construction outcome.
   *
   * The wait is on the status element carrying *something*, not on the grid
   * rendering: when a sink throws, the grid never renders and waiting for a cell
   * would surface as an opaque timeout instead of the actual error message.
   *
   * @param {object} [options] Fixture options.
   * @param {boolean} [options.expiredLicense] Render the license branding bar, whose
   * message goes through a sink of its own.
   * @param {boolean} [options.invalidLicense] Render the Core-owned lock screen, a separate
   * surface from the bar with its own markup.
   * @param {boolean} [options.trustedSanitizer] Configure a `sanitizer` that returns a
   * `TrustedHTML`, as a page under enforcement must.
   * @param {boolean} [options.pagination] Render the pagination bar.
   * @param {boolean} [options.emptyData] Render the empty data state.
   * @param {'markup'|'prose'} [options.colHeader] Put content in a column header, the one surface
   * that still reaches `innerHTML`. `prose` carries no markup at all.
   */
  async goto(options: {
    expiredLicense?: boolean,
    invalidLicense?: boolean,
    trustedSanitizer?: boolean,
    pagination?: boolean,
    emptyData?: boolean,
    colHeader?: 'markup' | 'prose',
  } = {}): Promise<void> {
    const params = new URLSearchParams({ theme: this.theme, bundle: this.bundle });

    if (options.expiredLicense) {
      params.set('license', 'expired');
    }
    if (options.invalidLicense) {
      params.set('license', 'invalid');
    }
    if (options.trustedSanitizer) {
      params.set('sanitizer', 'trusted');
    }
    if (options.pagination) {
      params.set('pagination', '1');
    }
    if (options.emptyData) {
      params.set('empty', '1');
    }
    if (options.colHeader) {
      params.set('colHeader', options.colHeader);
    }

    await this.page.goto(`/tests/fixtures/demo/trusted-types.html?${params}`);
    await expect(this.status).not.toBeEmpty();
  }

  /** What the fixture reported: `CONSTRUCTED`, or `CONSTRUCT-THREW: <message>`. */
  async statusText(): Promise<string> {
    return (await this.status.textContent()) ?? '';
  }

  /** Every CSP violation the page raised, in order. */
  async violations(): Promise<CspViolation[]> {
    return this.page.evaluate(() => (window as unknown as {
      htViolations: CspViolation[];
    }).htViolations);
  }

  /**
   * Assert the page raised no CSP violation at all.
   *
   * Failure output names the sinks rather than a bare count, because "1 violation" is not
   * actionable and the `sample` is the only part that identifies the writer.
   *
   * Read once rather than polled: a negative assertion passes on the first read, so polling
   * would add no settling time and would only make the check look stronger than it is. The
   * caller supplies the sync point — `goto()` waits for the construction outcome, and the
   * interaction tests await their status assertion first.
   */
  async expectNoViolations(): Promise<void> {
    const violations = await this.violations();

    expect(violations.map(v => `${v.directive} | ${v.sample}`)).toEqual([]);
  }

  /** A single data cell, addressed the way the master overlay renders it. */
  cell(row: number, col: number): Locator {
    return this.page.locator('.ht_master .htCore tbody tr').nth(row).locator('td').nth(col);
  }

  /** The nested-header group label, in the top overlay clone that renders headers. */
  nestedHeaderGroup(): Locator {
    return this.page.locator('.ht_clone_top .htCore thead').getByText('Group', { exact: true });
  }

  /** The license branding bar, present only under an expired key. */
  licenseBar(): Locator {
    return this.page.locator('.hot-display-license-info');
  }

  /** The Core-owned lock screen, present only under a key that cannot be read. */
  lockScreen(): Locator {
    return this.page.locator('.ht-license-lock');
  }

  /** The pagination bar. */
  paginationBar(): Locator {
    return this.page.locator('.ht-pagination');
  }

  /** The empty data state container. */
  emptyDataState(): Locator {
    return this.page.locator('.ht-empty-data-state');
  }
}
