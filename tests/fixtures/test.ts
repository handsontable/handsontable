import { test as base, expect } from '@playwright/test';

/**
 * Shared test fixture for the functional E2E suite.
 *
 * Declares the `theme` option so every spec runs across the Handsontable
 * themes (main/horizon/classic) via the per-theme projects in
 * playwright.config.ts — the same theme coverage the Puppeteer e2e matrix
 * gives the legacy suite. A spec authored against this `test` needs no theme
 * awareness: it is parametrized automatically by the active project, and the
 * page objects append the active theme to the fixture URL.
 *
 * Import `test`/`expect` from here (not from `@playwright/test`) in every spec
 * so the `theme` option is available.
 */
export type TestOptions = {
  theme: string;
};

export const test = base.extend<TestOptions>({
  theme: ['main', { option: true }],
});

export { expect };
