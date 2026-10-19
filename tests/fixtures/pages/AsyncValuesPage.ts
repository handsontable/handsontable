import { type Page, type Locator, expect } from '@playwright/test';
import { awaitBundle } from '../bundle';

/**
 * The outcome of a request, as the fixture records it.
 */
export type RecordedResult = { status: string; reason?: string; value?: unknown } | null;

/**
 * Page Object for the `asyncValues` fixture: starting, settling and inspecting the requests the
 * fixture controls, and reading the painted pending and error states.
 */
export class AsyncValuesPage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: string;
  readonly grid: Locator;

  constructor(page: Page, theme = 'main', bundle = 'umd') {
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.grid = page.getByTestId('grid');
  }

  /**
   * Navigates to the fixture and waits for the grid.
   */
  async goto(): Promise<void> {
    await this.page.goto(`/tests/fixtures/demo/async-values.html?theme=${this.theme}&bundle=${this.bundle}`);
    await awaitBundle(this.page);
    await expect(this.cell(0, 1)).toHaveText('Old A');
  }

  /**
   * A data cell, by visual row and column.
   */
  cell(row: number, column: number): Locator {
    return this.page.getByTestId(`cell-${row}-${column}`);
  }

  /**
   * The pending indicator of a cell.
   */
  indicator(row: number, column: number): Locator {
    return this.cell(row, column).locator('.htAsyncIndicator');
  }

  /**
   * Starts a request for a cell and returns its id.
   */
  async start(row: number, column: number): Promise<number> {
    return this.page.evaluate(([r, c]) => (window as any).startRequest(r, c), [row, column]);
  }

  /**
   * Resolves a request.
   */
  async resolve(id: number, value: unknown): Promise<void> {
    await this.page.evaluate(([requestId, result]) => (window as any).resolveRequest(requestId, result), [id, value]);
  }

  /**
   * Rejects a request with an error message.
   */
  async reject(id: number, message: string): Promise<void> {
    await this.page.evaluate(([requestId, text]) => (window as any).rejectRequest(requestId, text), [id, message]);
  }

  /**
   * The recorded outcome of a request, or `null` while it is pending.
   */
  async result(id: number): Promise<RecordedResult> {
    return this.page.evaluate(requestId => (window as any).requests[requestId].result, id);
  }

  /**
   * Whether a request's AbortSignal was aborted.
   */
  async isAborted(id: number): Promise<boolean> {
    return this.page.evaluate(requestId => (window as any).requests[requestId].signal.aborted, id);
  }

  /**
   * The source data of a physical row.
   */
  async sourceRow(physicalRow: number): Promise<Record<string, unknown>> {
    return this.page.evaluate(row => (window as any).hot.getSourceDataAtRow(row), physicalRow);
  }

  /**
   * A cell's background color, and the `--ht-async-error-background-color` token resolved to a color on
   * a probe inside the grid, for a theme-independent comparison.
   */
  async errorColors(row: number, column: number): Promise<{ cell: string; token: string }> {
    return this.cell(row, column).evaluate((td) => {
      const probe = td.ownerDocument.createElement('div');

      probe.style.backgroundColor = 'var(--ht-async-error-background-color)';
      td.closest('.handsontable')!.appendChild(probe);

      const token = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return { cell: getComputedStyle(td).backgroundColor, token };
    });
  }
}
