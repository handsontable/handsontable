/**
 * Declares the one theme CSS variable jsdom needs, for Jest only.
 *
 * jsdom loads no theme stylesheet, so every grid built in a unit test warns
 * `The "ht-theme-main" theme is enabled, but its stylesheets are missing` — `Core#onThemeChange`
 * probes `--ht-line-height` on the themed wrapper and warns when it resolves to nothing. That was
 * 449 `console.warn` calls per CI run.
 *
 * This lives in its own file rather than in `test/bootstrap.js` because bootstrap is SHARED: it is
 * listed in `ALLOWED_E2E_MODULES` in `.config/test-e2e.js`, so it is bundled into the Jasmine
 * Puppeteer suite and runs in a real Chrome. There the rule is not a stub but an override — its
 * `[class*="ht-theme-"]` selector has the same specificity as the stylesheet's own
 * `.ht-theme-main`, and it is appended later, so it WINS. Every theme then renders rows at
 * `22px + padding` instead of the declared 20px (21px for classic), which failed 246 specs across
 * all six E2E legs. Registered in `jest.config.js` only, and absent from that allowlist, this file
 * cannot reach the E2E bundle.
 *
 * Only `--ht-line-height` is declared, on purpose. `StylesHandler#calculateRowHeight()`,
 * NestedHeaders' rowspan header height, and the multi-select dropdown's entry height each need a
 * second variable as well, so with only this one defined they resolve to the same `NaN`/`undefined`
 * as before and no jsdom measurement changes.
 */
beforeAll(() => {
  // A `@jest-environment node` spec file has no `document`; this is a no-op there.
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById('ht-jsdom-theme-vars')) {
    return;
  }

  const themeVars = document.createElement('style');

  themeVars.id = 'ht-jsdom-theme-vars';
  themeVars.textContent = '[class*="ht-theme-"] { --ht-line-height: 22px; }';
  document.head.appendChild(themeVars);
});
