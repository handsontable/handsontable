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

  test('renders the license lock screen', async () => {
    await grid.goto({ invalidLicense: true });

    // A separate surface from the bar above, with its own markup
    // (`utils/licenseBranding/lockScreen.ts`), reached by a key that cannot be read.
    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.lockScreen()).toBeVisible();
    await grid.expectNoViolations();
  });

  test('renders the pagination bar', async () => {
    await grid.goto({ pagination: true });

    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.paginationBar()).toBeVisible();
    await grid.expectNoViolations();
  });

  test('renders the empty data state', async () => {
    await grid.goto({ emptyData: true });

    expect(await grid.statusText()).toBe('CONSTRUCTED');

    await expect(grid.emptyDataState()).toBeVisible();
    await grid.expectNoViolations();
  });

  test('renders the export progress dialog', async () => {
    await grid.goto();
    await grid.exportButton.click();

    // The spinner count is the load-bearing part: it is an `<svg>`, and one built through
    // `createElement` without the SVG namespace is an unknown HTML element that renders nothing,
    // with no error to notice. Reading it here proves the namespace survived the DOM rewrite on a
    // real browser, not only in the unit test's jsdom.
    await expect(grid.status).toHaveText('EXPORT-DIALOG: 1 spinner');
    await grid.expectNoViolations();
  });

  test('renders the loading overlay', async () => {
    await grid.goto();
    await grid.loadingButton.click();

    // `loadingContent` returned an HTML string that the dialog plugin wrote through
    // `fastInnerHTML`, so this threw. The overlay is only built on `show()`, not at construct,
    // which is why a repro that merely constructs a grid with `loading: true` looked clean.
    await expect(grid.status).toHaveText('LOADING: 1 spinner');
    await grid.expectNoViolations();
  });

  test.describe('the surviving sink: header content', () => {
    // Cell data is not in scope here and cannot be: `textRenderer` writes through `fastInnerText`,
    // so it never reaches a sink whatever it contains. Headers go through `fastInnerHTML`, and
    // `HTML_CHARACTERS` sends anything holding a `<`, or an `&` with a later `;`, down the
    // `innerHTML` path. These two tests pin the boundary and its remedy, so neither can rot
    // unnoticed the way the original documented claim did.

    test('throws for a header holding markup when no sanitizer is configured', async () => {
      await grid.goto({ colHeader: 'markup' });

      // Not a degraded render: `fastInnerHTML` has no `catch` and `renderCell` uses
      // `try`/`finally`, so the TypeError escapes the constructor and NOTHING renders.
      expect(await grid.statusText()).toContain('CONSTRUCT-THREW');
      expect(await grid.statusText()).toContain('TrustedHTML');
      await expect(grid.cell(0, 0)).toHaveCount(0);
    });

    test('throws for a header holding no markup at all, only an ampersand and a semicolon',
      async () => {
        await grid.goto({ colHeader: 'prose' });

        // `Smith & Sons, Ltd.; est. 1920`. This is the case a user hits by accident, having
        // written no markup, and it is why the security guide cannot claim enforcement needs
        // nothing. DEV-2642 narrows the regex to cover this shape; the `markup` case above
        // outlives that ticket.
        expect(await grid.statusText()).toContain('CONSTRUCT-THREW');
        await expect(grid.cell(0, 0)).toHaveCount(0);
      });

    test('throws when the context menu marks an item as selected', async () => {
      await grid.goto();
      await grid.contextMenuButton.click();

      // `markLabelAsSelected` (`contextMenu/utils.ts`) prefixes the label with
      // `<span class="selected">` and the item renderer writes the result through
      // `fastInnerHTML`. Unlike a header this is not the user's data - it is the grid's own
      // markup - so it is a genuine gap in the no-policy claim rather than a documented boundary.
      // Tracked separately; converting it means changing how a menu item carries its selected
      // state, which the `name` option's string contract does not currently allow.
      expect(await grid.statusText()).toContain('MENU-THREW');
      expect(await grid.statusText()).toContain('TrustedHTML');
    });

    test('renders the context menu through a sanitizer that returns a TrustedHTML', async () => {
      await grid.goto({ trustedSanitizer: true });
      await grid.contextMenuButton.click();

      await expect(grid.status).toHaveText('MENU: 1 checkmark');
      await grid.expectNoViolations();
    });

    test('renders both header shapes through a sanitizer that returns a TrustedHTML', async () => {
      await grid.goto({ colHeader: 'markup', trustedSanitizer: true });

      expect(await grid.statusText()).toBe('CONSTRUCTED');

      await expect(grid.cell(0, 0)).toHaveText('A1');
      await grid.expectNoViolations();

      await grid.goto({ colHeader: 'prose', trustedSanitizer: true });

      expect(await grid.statusText()).toBe('CONSTRUCTED');

      await expect(grid.cell(0, 0)).toHaveText('A1');
      await grid.expectNoViolations();
    });
  });
});
