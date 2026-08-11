import { test as base, expect } from '@playwright/test';

/**
 * Shared test fixture for the functional E2E suite.
 *
 * Declares the `theme` and `bundle` options so every spec runs across the
 * same matrix the Puppeteer e2e suite covers: themes (main/horizon/classic)
 * × bundles (`umd` = dist/handsontable.js, `full-min` =
 * dist/handsontable.full.min.js — the same files the Puppeteer `test:e2e` and
 * `test:production` legs load), via the projects in playwright.config.ts.
 * A spec authored against this
 * `test` needs no theme or bundle awareness: it is parametrized automatically
 * by the active project, and the page objects append both to the fixture URL.
 *
 * Import `test`/`expect` from here (not from `@playwright/test`) in every spec
 * so the options are available.
 */
export type TestOptions = {
  theme: string;
  bundle: string;
};

export const test = base.extend<TestOptions>({
  theme: ['main', { option: true }],
  bundle: ['umd', { option: true }],
});

export { expect };
