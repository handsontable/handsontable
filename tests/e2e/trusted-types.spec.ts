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
 * Each test covers a surface that used to build its markup as a string: the nested-header
 * ghost table, the dialog templates, and the license branding bar. Clearing an element
 * counted too, because `innerHTML = ''` is a sink whatever the value.
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

    // Distinct from the assertion above on purpose: a grid can construct while still tripping
    // the policy, if something swallowed the violation in a `try`/`catch`. The grid has finished
    // its first render by the time `goto()` returns, which is the point this reads.
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

  test('pastes the plain-text flavour when no sanitizer is configured', async () => {
    await grid.goto();
    await grid.pasteButton.click();

    // With no `sanitizer` the HTML flavour reaches the parser as a plain string, which the sink
    // refuses. That must cost the richer flavour, not the paste: before the fallback the throw
    // escaped `onPaste` and nothing landed at all, on every paste, including grid-to-grid.
    await expect(grid.status).toHaveText('PASTED: T1,T2');
  });

  test('reports the refused clipboard parse rather than hiding it', async () => {
    await grid.goto();
    await grid.pasteButton.click();
    await expect(grid.status).toHaveText('PASTED: T1,T2');

    // The one place this suite expects a violation. Attempting the parse IS the report, and the
    // page is entitled to see it: the fix is that the grid survives the refusal, not that the
    // refusal goes unrecorded. Configure a sanitizer returning a `TrustedHTML` and it disappears,
    // which the test above this one holds.
    const violations = await grid.violations();

    // Matched on the sample, not just the count: the sample names the sink and the payload, so this
    // cannot be satisfied by some other violation raised while the page was constructing - which
    // the test above proves there are none of anyway.
    expect(violations).toEqual([{
      directive: 'require-trusted-types-for',
      sample: expect.stringContaining('DOMParser parseFromString|<table>'),
    }]);
  });

  test('renders the license branding bar', async () => {
    await grid.goto({ expiredLicense: true });

    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.licenseBar()).toBeVisible();
    await grid.expectNoViolations();
  });
});
