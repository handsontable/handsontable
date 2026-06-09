import path from 'path';
import { test, expect } from '@playwright/test';
import { loadRecipePages } from './recipePages';

/**
 * Errors that are expected in a no-backend test environment and should not
 * cause the test to fail. Genuine JS errors (TypeError, ReferenceError, etc.)
 * are NOT listed here and will still fail the test.
 */
const IGNORED_ERROR_PATTERNS: RegExp[] = [
  /net::ERR_/i,
  /Failed to load resource/i,
  /Failed to fetch/i,
  /AbortError/i,
  /NetworkError/i,
  /Load failed/i,
  // Server-side recipe examples intentionally throw `new Error('HTTP 404')`
  // when no backend is running. The dataProvider plugin catches these and
  // shows a notification, but in a race with the test assertion they can
  // appear as uncaught page errors. This pattern is expected no-backend
  // behavior, not a Handsontable bug.
  /^HTTP \d{3}$/,
  // Vite dep-optimizer cache invalidation during dev-server warm-up.
  /Outdated Optimize Dep/i,
];

function shouldIgnoreError(message: string): boolean {
  return IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Recipe pages are discovered automatically by scanning the markdown files
 * under docs/content/recipes/. No manual updates are needed here when a
 * new recipe page is added.
 *
 * See docs/tests/recipePages.ts for the scanning logic.
 */
const recipePages = loadRecipePages(
  path.join(__dirname, '..', 'content', 'recipes'),
);

test.beforeEach(async ({ page, baseURL }) => {
  const url = new URL(baseURL?.toString() || '');
  const domain = url.hostname;

  await page.context().addCookies([
    {
      name: 'CookieConsent',
      value: '-2',
      domain,
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: '70d6d6e3-3a3e-4392-a095-5fe2a6b8bd70',
      value: process.env.PASS_COOKIE ?? '',
      domain: 'dev.handsontable.com',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
});

recipePages.forEach(({ path: pagePath, framework, hasExamples }) => {
  const label = `[${framework.replace('-data-grid', '')}] ${pagePath}`;

  test(label, async ({ page, baseURL }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !shouldIgnoreError(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      if (!shouldIgnoreError(err.message)) {
        pageErrors.push(err.message);
      }
    });

    const fullUrl = `${baseURL}/${framework}/${pagePath}`;

    await page.goto(fullUrl);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);
    await page.waitForLoadState('domcontentloaded');

    if (hasExamples) {
      // Angular bootstrapApplication is the slowest initializer. 30 s is also
      // needed for JS/React recipes when the dev server is under parallel load.
      const loadTimeout = 30_000;

      // Wait for JS to hydrate the example container before checking loading state.
      // Recipe pages use .hot-example-loader (not .hot-example-preview--loading) so
      // the negative wait below resolves immediately — this positive wait prevents
      // the count check from racing ahead of hydration.
      await expect(page.locator('.hot-example').first()).toBeAttached({
        timeout: loadTimeout,
      });

      // Every .hot-example-preview--loading class must be removed before we check.
      await expect(page.locator('.hot-example-preview--loading')).toHaveCount(0, {
        timeout: loadTimeout,
      });

      // At least one example container must be present.
      const exampleCount = await page.locator('.hot-example').count();

      expect(exampleCount, `No .hot-example elements found on ${fullUrl}`).toBeGreaterThan(0);
    }

    expect(pageErrors, `Uncaught page errors on ${fullUrl}:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(
      consoleErrors,
      `Console errors on ${fullUrl}:\n${consoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
