import { test, expect } from '@playwright/test';

type RecipePage = {
  path: string;
  framework: 'javascript-data-grid' | 'react-data-grid' | 'angular-data-grid';
  hasExamples: boolean;
};

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
 * Full list of recipe pages to test. Multi-framework pages are tested with the
 * javascript-data-grid prefix (JS variant). Framework-exclusive pages use their
 * own prefix.
 */
const recipePages: RecipePage[] = [
  // Introduction
  { path: 'recipes', framework: 'javascript-data-grid', hasExamples: false },

  // Accessibility
  { path: 'recipes/accessibility', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/accessibility/aria-grid', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/accessibility/keyboard-shortcuts', framework: 'javascript-data-grid', hasExamples: true },

  // Cell types
  { path: 'recipes/cell-types', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/cell-types/color-picker', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/color-picker-angular', framework: 'angular-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/colorful-picker', framework: 'react-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/datepicker', framework: 'angular-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/feedback', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/feedback-angular', framework: 'angular-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/feedback-react', framework: 'react-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/flatpickr', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/moment-date', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/moment-time', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/numbro', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/pikaday', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/rating', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/rating-angular', framework: 'angular-data-grid', hasExamples: true },
  { path: 'recipes/cell-types/react-rating', framework: 'react-data-grid', hasExamples: true },

  // Column management
  { path: 'recipes/column-management', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/column-management/column-visibility', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/column-management/freeze-columns', framework: 'javascript-data-grid', hasExamples: true },

  // Context menu
  { path: 'recipes/context-menu', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/context-menu/custom-context-menu', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/context-menu/row-operations', framework: 'javascript-data-grid', hasExamples: true },

  // Data management
  { path: 'recipes/data-management', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/data-management/auto-save-backend', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/load-data-graphql', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/load-data-rest-api', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/server-side-django', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/data-management/server-side-laravel', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/data-management/server-side-nestjs', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/data-management/server-side-rails', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/server-side-spring', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/sync-two-grids', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/data-management/undo-redo-custom-ui', framework: 'javascript-data-grid', hasExamples: true },

  // Editing / validation
  { path: 'recipes/editing-validation', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/editing-validation/dependent-dropdowns', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/editing-validation/row-validation-error-summary', framework: 'javascript-data-grid', hasExamples: true },

  // Filtering and search (two separate sections in sidebar)
  { path: 'recipes/filtering-and-search', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/filtering-and-search/external-search-box', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/filtering-and-search/highlight-search-matches', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/filtering-search', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/filtering-search/multi-column-filter-panel', framework: 'javascript-data-grid', hasExamples: true },

  // Import / export
  { path: 'recipes/import-export', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/import-export/export-to-pdf', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/import-export/import-csv-excel', framework: 'javascript-data-grid', hasExamples: true },

  // Performance
  { path: 'recipes/performance', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/performance/lazy-loading', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/performance/persist-column-layout', framework: 'javascript-data-grid', hasExamples: true },

  // Real-time
  { path: 'recipes/real-time', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/real-time/chartjs-sync', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/real-time/websocket-updates', framework: 'javascript-data-grid', hasExamples: true },

  // Rendering / styling
  { path: 'recipes/rendering-styling', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/rendering-styling/conditional-row-coloring', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/rendering-styling/frozen-summary-row', framework: 'javascript-data-grid', hasExamples: true },
  { path: 'recipes/rendering-styling/sparkline-cell-renderer', framework: 'javascript-data-grid', hasExamples: true },

  // Themes (use CodeSandbox iframes, no inline hot-example blocks)
  { path: 'recipes/themes', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/themes/ant-design', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/themes/base-theme', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/themes/custom-theme', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/themes/fluent-ui', framework: 'javascript-data-grid', hasExamples: false },
  { path: 'recipes/themes/mui-theme', framework: 'javascript-data-grid', hasExamples: false },
];

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

recipePages.forEach(({ path, framework, hasExamples }) => {
  const label = `[${framework.replace('-data-grid', '')}] ${path}`;

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

    const fullUrl = `${baseURL}/${framework}/${path}`;

    await page.goto(fullUrl);
    await expect(page.getByText('Page not found (404)')).toHaveCount(0);
    await expect(page.getByText('Password protected site')).toHaveCount(0);
    await page.waitForLoadState('domcontentloaded');

    if (hasExamples) {
      // Angular bootstrapApplication is the slowest initializer — 30 s is safe.
      const loadTimeout = framework === 'angular-data-grid' ? 30_000 : 20_000;

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
