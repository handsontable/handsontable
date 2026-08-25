import { test, expect } from '../fixtures/test';
import { TrustedTypesPage } from '../fixtures/pages/TrustedTypesPage';

/**
 * DEV-2617. Handsontable documents Trusted Types support, and the documented recipe
 * does not work: a grid does not construct under `require-trusted-types-for 'script'`.
 * The root cause is not one wrong line, it is that the workflow was published without
 * ever being run, so this spec is the part of the fix that keeps it fixed.
 *
 * The fixture enforces the strictest configuration a page can have. There is no
 * `default` policy, which would launder every unclaimed string and make the whole
 * suite pass vacuously, and the `trusted-types` allowlist names no Handsontable
 * policy. Handsontable therefore has to work here by not producing HTML strings,
 * which is the direction chosen for this task: support the API, do not implement it.
 *
 * These tests fail on the current code. Each one turns green as its class of sink is
 * eliminated, so they double as the plan's progress check:
 *
 *   * the ghost table, dialogs, and the license bar are sinks that build markup as a
 *     string (`nestedHeaders/utils/ghostTable.ts`, `helpers/templateLiteralTag.ts`,
 *     `helpers/mixed.ts`);
 *   * `innerHTML = ''` is a sink too, so clearing an element throws as readily as
 *     writing to one.
 */
test.describe('Trusted Types enforcement', () => {
  let grid: TrustedTypesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new TrustedTypesPage(page, theme, bundle);
  });

  test('constructs a grid with nested headers', async () => {
    await grid.goto();

    // Asserted on the reported outcome rather than on a rendered cell: when a sink
    // throws, the message names the sink, and a bare render assertion would report a
    // timeout instead.
    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.cell(0, 0)).toHaveText('A1');
    await expect(grid.nestedHeaderGroup()).toBeVisible();
  });

  test('raises no CSP violation while constructing', async () => {
    await grid.goto();

    // Distinct from the assertion above on purpose. A grid can construct while still
    // tripping the policy — a violation that a `try`/`catch` swallowed, or one raised
    // by an asynchronous render after the constructor returned — and that is exactly
    // the "it works on my machine" state this task exists to end.
    await grid.expectNoViolations();
  });

  test('opens a dialog', async () => {
    await grid.goto();
    await grid.openDialogButton.click();

    await expect(grid.status).toHaveText('DIALOG-OPENED');
    await grid.expectNoViolations();
  });

  test('pastes HTML through a sanitizer that returns a TrustedHTML', async () => {
    await grid.goto({ trustedSanitizer: true });
    await grid.pasteButton.click();

    // The clipboard parser is the one sink Handsontable cannot avoid: it reads markup the grid
    // did not author, and every HTML parse entry point is a Trusted Types sink. It works only
    // because the sanitizer's value reaches it unmodified - normalizing the payload afterwards
    // would collapse the `TrustedHTML` back to a string and the parser would reject it.
    await expect(grid.status).toHaveText('PASTED: P1,P2');
    await grid.expectNoViolations();
  });

  test('renders the license branding bar', async () => {
    await grid.goto({ expiredLicense: true });

    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.licenseBar()).toBeVisible();
    await grid.expectNoViolations();
  });
});
