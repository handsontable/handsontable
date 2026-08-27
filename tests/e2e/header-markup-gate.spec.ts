import { test, expect } from '../fixtures/test';
import { HeaderMarkupGatePage } from '../fixtures/pages/HeaderMarkupGatePage';

/**
 * The markup gate that picks a header's write path (DEV-2642). Only a real browser
 * settles these: whether a label ended up as a text node or as parsed markup, and
 * whether the parser decoded a character reference the grid was right to pass on.
 *
 * The boundary is deliberate. Prose is fixed here; a label holding real markup keeps
 * reaching `innerHTML`, because that is content the user asked to be rendered as HTML.
 */
test.describe('header markup gate', () => {
  test('renders a prose header holding `&` and `;` as text', async({ page, theme, bundle }) => {
    const grid = new HeaderMarkupGatePage(page, theme, bundle);

    await grid.goto({ colHeader: 'prose' });

    await expect(grid.columnHeader()).toHaveText('Smith & Sons, Ltd.; est. 1920');
    // No element was built from it, so nothing was parsed as markup.
    await expect(grid.columnHeader().locator('*')).toHaveCount(0);
    // The label is not markup, so nudging the user toward a sanitizer would be noise.
    //
    // This one stays a single read rather than a poll, deliberately: nothing in this leg is
    // markup, so no warning ever fires and there is no positive for a poll to settle on - polling
    // a negative only re-reads the same `false` until it times out. The risk a poll would cover
    // here is a LATER render pass warning, so force one and read again instead.
    expect(await grid.warnedAboutMissingSanitizer()).toBe(false);

    await grid.rerender();
    await expect(grid.columnHeader()).toHaveText('Smith & Sons, Ltd.; est. 1920');
    expect(await grid.warnedAboutMissingSanitizer()).toBe(false);
  });

  test('renders a prose header holding `<` and `>` as text', async({ page, theme, bundle }) => {
    const grid = new HeaderMarkupGatePage(page, theme, bundle);

    await grid.goto({ colHeader: 'angle' });

    await expect(grid.columnHeader()).toHaveText('Score < 50 > threshold');
    await expect(grid.columnHeader().locator('*')).toHaveCount(0);
    expect(await grid.warnedAboutMissingSanitizer()).toBe(false);

    await grid.rerender();
    await expect(grid.columnHeader()).toHaveText('Score < 50 > threshold');
    expect(await grid.warnedAboutMissingSanitizer()).toBe(false);
  });

  test('still writes a header holding real markup through the HTML path', async({ page, theme, bundle }) => {
    const grid = new HeaderMarkupGatePage(page, theme, bundle);

    await grid.goto({ colHeader: 'markup' });

    // The surviving sink, on purpose: this is content the user asked to render as HTML.
    await expect(grid.columnHeader().getByTestId('markup-marker')).toHaveText('ID');
    await expect.poll(() => grid.warnedAboutMissingSanitizer()).toBe(true);
  });

  test('still writes a header holding a real character reference through the HTML path',
    async({ page, theme, bundle }) => {
      const grid = new HeaderMarkupGatePage(page, theme, bundle);

      await grid.goto({ colHeader: 'entity' });

      // `&amp;` reaching the parser is the whole point: it renders as one `&`, which is
      // what tells the HTML path from the text path here.
      await expect(grid.columnHeader()).toHaveText('a & b');
      await expect.poll(() => grid.warnedAboutMissingSanitizer()).toBe(true);
    });

  test('keeps a prose nested-header label away from a configured sanitizer', async({ page, theme, bundle }) => {
    const grid = new HeaderMarkupGatePage(page, theme, bundle);

    await grid.goto({ nested: 'prose', sanitizer: 'truncate' });

    // The ghost table measures this same label and mirrors the gate, so a sanitizer that
    // rewrites plain text - this one truncates to five characters - must not see it. If it
    // did, the column would be measured against a string the user never sees.
    await expect(grid.nestedHeader()).toHaveText('Smith & Sons, Ltd.; est. 1920');
    // The sanitizer does run on this grid - the leaf headers reach it - so its call list having
    // settled is what makes the absence of the prose label meaningful rather than merely early.
    await expect.poll(() => grid.sanitizerContents()).not.toContain('Smith & Sons, Ltd.; est. 1920');
  });

  test('still routes a nested-header label holding markup to the sanitizer', async({ page, theme, bundle }) => {
    const grid = new HeaderMarkupGatePage(page, theme, bundle);

    await grid.goto({ nested: 'markup', sanitizer: 'truncate' });

    await expect.poll(() => grid.sanitizerContents())
      .toContain('<b data-testid="markup-marker">ID</b>');
    // Under the `'header'` source, never `'innerHTML'`: a context-aware sanitizer must not
    // get one rule set for the rendered header and another for the measured copy. The positive
    // above has settled the call list, so the negative below reads a complete one.
    await expect.poll(() => grid.sanitizerContexts()).toContain('header');
    expect(await grid.sanitizerContexts()).not.toContain('innerHTML');
  });
});
