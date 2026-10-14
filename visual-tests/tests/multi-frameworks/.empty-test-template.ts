import { visualTest, expect } from '../../src/test-runner';
import { helpers } from '../../src/helpers';

/**
 * Say what this capture proves that a `tests/e2e` assertion cannot – the decision rule in
 * ../../AGENTS.md is what settles whether a screenshot is the right tool at all – and name the ticket
 * that owns it: DEV-<number>, or a GitHub issue as #<number>. The spec lint rejects a block that names
 * no ticket, so a copy fails until this placeholder is replaced.
 */
visualTest(__filename, {
  // The default for a new spec: two themes, one browser, no wrapper. Add `CLASSIC` to `themes` when the
  // spec is about the delivery path the bare render covers (the core inlines the main theme stylesheet
  // there), a `horizon` theme when the pixels being judged are theme tokens rather than geometry, and a
  // wrapper only with a `wrappersReason` saying what the wrapper render proves that the js render does
  // not — each wrapper is one more golden per capture. A spec here photographs the shared `/` grid, which
  // every wrapper demo also builds; the seed copies each spec's bare js captures into the wrappers that
  // spec declares (`lib/wrapper-copy.mjs`), so a spec that declares none gets no wrapper golden.
  //
  // The sweep in `lib/__tests__/visual-declarations.test.mjs` names the shapes this directory hosts:
  // this default, the five js variants with no wrapper, and the five js variants under all three
  // `WRAPPERS` (the parity canary, which needs `CLASSIC` and a `wrappersReason`).
  themes: ['main', 'main-dark'],
  browsers: ['chromium'],
  wrappers: [],
}, async({ tablePage }) => {
  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  // One capture per distinct visual state, and the state asserted before the capture: a screenshot on
  // the line after a click or a key press records whichever half of the transition the runner reached.
  await expect(table).toBeVisible();
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
